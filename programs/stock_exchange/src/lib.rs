use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata,
};
use mpl_token_metadata::types::DataV2;

declare_id!("6RYHxeQ4turMqubZkmLg4UB9AeNRbgW9tR5L2uQ7VJ4f");

// ✅ UPDATE THIS TO YOUR WALLET ADDRESS
pub const PLATFORM_FEE_WALLET: &str = "2XchL7rEESZFJPEUgR4RjvduHdTR9J8ANqvsuzqmLUkv";
pub const CREATION_FEE: u64 = 100_000_000; // 0.1 SOL
pub const TRANSACTION_FEE_BPS: u64 = 100; // 1% = 100 basis points

// ✅ NEW: Fee split ratios (basis points out of 10000)
pub const PLATFORM_FEE_SHARE_BPS: u64 = 7000; // 70% = 7000 basis points
pub const CREATOR_FEE_SHARE_BPS: u64 = 3000;  // 30% = 3000 basis points

// ✅ NEW: Bonding curve parameters for exponential curve
// P = BASE_PRICE × e^(K × supply / SCALE_FACTOR)
pub const BASE_PRICE: u64 = 1_000_000; // 0.001 SOL
pub const K_FACTOR: u64 = 5; // Growth rate (adjust for steepness)
pub const SCALE_FACTOR: u64 = 10_000; // Scale to prevent overflow

#[program]
pub mod celebrity_exchange {
    use super::*;

    pub fn create_market(
        ctx: Context<CreateMarket>,
        initial_price_lamports: u64,
        initial_supply: u64,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        require!(name.len() <= 32, ExchangeError::InvalidMetadata);
        require!(symbol.len() <= 10, ExchangeError::InvalidMetadata);
        require!(uri.len() <= 200, ExchangeError::InvalidMetadata);

        // Charge creation fee
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.platform_fee_wallet.to_account_info(),
                },
            ),
            CREATION_FEE,
        )?;

        // Initialize market
        let market = &mut ctx.accounts.market;
        market.owner = *ctx.accounts.payer.key;
        market.mint = ctx.accounts.mint.key();
        market.escrow = ctx.accounts.escrow_token_account.key();
        market.treasury = ctx.accounts.treasury.key();
        market.current_price = initial_price_lamports;
        market.total_supply = initial_supply;
        market.circulating_supply = 0; // ✅ NEW: Track circulating supply for bonding curve
        market.trade_count = 0;
        market.name = name.clone();
        market.symbol = symbol.clone();
        market.uri = uri.clone();

        // Mint tokens to escrow
        let mint_bump = ctx.bumps.mint_authority;
        let signer_seeds: &[&[u8]] = &[b"mint-authority".as_ref(), &[mint_bump]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                &[&signer_seeds[..]],
            ),
            initial_supply,
        )?;

        // Create token metadata
        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint_authority.to_account_info(),
                    update_authority: ctx.accounts.mint_authority.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                &[&signer_seeds[..]],
            ),
            DataV2 {
                name,
                symbol,
                uri,
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true,
            true,
            None,
        )?;

        emit!(MarketCreated {
            market: market.key(),
            owner: market.owner,
            mint: market.mint,
            initial_price: market.current_price,
            initial_supply,
            name: market.name.clone(),
            symbol: market.symbol.clone(),
            uri: market.uri.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn buy_tokens(ctx: Context<BuySell>, amount: u64) -> Result<()> {
        require!(amount > 0, ExchangeError::InvalidAmount);
        let market = &mut ctx.accounts.market;

        // ✅ NEW: Calculate price using exponential bonding curve
        let new_circulating = market.circulating_supply.checked_add(amount)
            .ok_or(ExchangeError::MathError)?;
        
        let total_cost = calculate_buy_cost(
            market.circulating_supply,
            new_circulating,
            market.current_price
        )?;

        // Calculate 1% platform fee
        let total_fee = (total_cost as u128)
            .checked_mul(TRANSACTION_FEE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        // ✅ NEW: Split fee 70/30 between platform and creator
        let platform_fee = (total_fee as u128)
            .checked_mul(PLATFORM_FEE_SHARE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        let creator_fee = (total_fee as u128)
            .checked_mul(CREATOR_FEE_SHARE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        msg!("💰 Buy Details:");
        msg!("  Total Cost: {} lamports", total_cost);
        msg!("  Platform Fee (70%): {} lamports", platform_fee);
        msg!("  Creator Fee (30%): {} lamports", creator_fee);

        // Transfer SOL to treasury
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            total_cost,
        )?;

        // ✅ Transfer 70% to platform
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.platform_fee_wallet.to_account_info(),
                },
            ),
            platform_fee,
        )?;

        // ✅ Transfer 30% to creator
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.creator_wallet.to_account_info(),
                },
            ),
            creator_fee,
        )?;

        // Transfer tokens from escrow to buyer
        let market_key = market.key();
        let escrow_bump = ctx.bumps.escrow_authority;
        let escrow_seeds: &[&[u8]] = &[b"escrow".as_ref(), market_key.as_ref(), &[escrow_bump]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_authority.to_account_info(),
                },
                &[&escrow_seeds[..]],
            ),
            amount,
        )?;

        // ✅ Update market state
        market.circulating_supply = new_circulating;
        market.current_price = calculate_current_price(new_circulating, market.current_price)?;
        market.trade_count = market.trade_count.saturating_add(1);

        emit!(TradeExecuted {
            market: market.key(),
            buyer: Some(*ctx.accounts.user.key),
            seller: None,
            tokens: amount,
            price: market.current_price,
            total_cost,
            platform_fee,
            creator_fee,
            kind: TradeKind::Buy,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn sell_tokens(
        ctx: Context<BuySell>,
        amount: u64,
        min_receive_lamports: u64,
    ) -> Result<()> {
        require!(amount > 0, ExchangeError::InvalidAmount);
        let market = &mut ctx.accounts.market;

        require!(
            amount <= market.circulating_supply,
            ExchangeError::InvalidAmount
        );

        // ✅ NEW: Calculate sell value using bonding curve
        let new_circulating = market.circulating_supply.checked_sub(amount)
            .ok_or(ExchangeError::MathError)?;
        
        let total_value = calculate_sell_value(
            market.circulating_supply,
            new_circulating,
            market.current_price
        )?;

        // Calculate 1% fee
        let total_fee = (total_value as u128)
            .checked_mul(TRANSACTION_FEE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        // ✅ Split fee 70/30
        let platform_fee = (total_fee as u128)
            .checked_mul(PLATFORM_FEE_SHARE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        let creator_fee = (total_fee as u128)
            .checked_mul(CREATOR_FEE_SHARE_BPS as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000u128)
            .ok_or(ExchangeError::MathError)? as u64;

        let user_receives = total_value
            .checked_sub(total_fee)
            .ok_or(ExchangeError::MathError)?;

        require!(
            user_receives >= min_receive_lamports,
            ExchangeError::SlippageExceeded
        );

        msg!("💸 Sell Details:");
        msg!("  Total Value: {} lamports", total_value);
        msg!("  Platform Fee (70%): {} lamports", platform_fee);
        msg!("  Creator Fee (30%): {} lamports", creator_fee);
        msg!("  User Receives: {} lamports", user_receives);

        // Transfer tokens from seller to escrow
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        let market_key = market.key();
        let treasury_bump = ctx.bumps.treasury;
        let treasury_seeds: &[&[u8]] = &[b"treasury".as_ref(), market_key.as_ref(), &[treasury_bump]];

        // Transfer SOL to seller (minus fees)
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.treasury.key(),
                &ctx.accounts.user.key(),
                user_receives,
            ),
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[treasury_seeds],
        )?;

        // ✅ Transfer platform fee (70%)
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.treasury.key(),
                &ctx.accounts.platform_fee_wallet.key(),
                platform_fee,
            ),
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.platform_fee_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[treasury_seeds],
        )?;

        // ✅ Transfer creator fee (30%)
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.treasury.key(),
                &ctx.accounts.creator_wallet.key(),
                creator_fee,
            ),
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.creator_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[treasury_seeds],
        )?;

        // ✅ Update market state
        market.circulating_supply = new_circulating;
        market.current_price = calculate_current_price(new_circulating, market.current_price)?;
        market.trade_count = market.trade_count.saturating_add(1);

        emit!(TradeExecuted {
            market: market.key(),
            buyer: None,
            seller: Some(*ctx.accounts.user.key),
            tokens: amount,
            price: market.current_price,
            total_cost: total_value,
            platform_fee,
            creator_fee,
            kind: TradeKind::Sell,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn get_market_details(ctx: Context<GetMarket>) -> Result<MarketDetails> {
        let market = &ctx.accounts.market;

        Ok(MarketDetails {
            owner: market.owner,
            mint: market.mint,
            escrow: market.escrow,
            treasury: market.treasury,
            current_price: market.current_price,
            total_supply: market.total_supply,
            circulating_supply: market.circulating_supply,
            trade_count: market.trade_count,
            name: market.name.clone(),
            symbol: market.symbol.clone(),
            uri: market.uri.clone(),
        })
    }
}

// ✅ NEW: Exponential bonding curve price calculation
fn calculate_current_price(circulating_supply: u64, _base_price: u64) -> Result<u64> {
    if circulating_supply == 0 {
        return Ok(BASE_PRICE);
    }

    // P = BASE_PRICE × e^(K × S / SCALE_FACTOR)
    // Simplified using integer math to avoid floating point
    
    let exponent = (circulating_supply as u128)
        .checked_mul(K_FACTOR as u128)
        .ok_or(ExchangeError::MathError)?
        .checked_div(SCALE_FACTOR as u128)
        .ok_or(ExchangeError::MathError)? as u64;

    // Approximate e^x using series expansion for small x
    // e^x ≈ 1 + x + x²/2 + x³/6 ...
    let price = if exponent < 10 {
        let multiplier = 10000 + (exponent * 10000) + (exponent * exponent * 5000) / 10000;
        (BASE_PRICE as u128)
            .checked_mul(multiplier as u128)
            .ok_or(ExchangeError::MathError)?
            .checked_div(10000)
            .ok_or(ExchangeError::MathError)? as u64
    } else {
        // For larger exponents, use capped exponential
        (BASE_PRICE as u128)
            .checked_mul(2u128.pow(exponent.min(20) as u32))
            .ok_or(ExchangeError::MathError)? as u64
    };

    Ok(price.max(BASE_PRICE))
}

fn calculate_buy_cost(from_supply: u64, to_supply: u64, base_price: u64) -> Result<u64> {
    // Integrate price curve from from_supply to to_supply
    let mut total_cost: u128 = 0;
    
    for i in from_supply..to_supply {
        let price = calculate_current_price(i, base_price)?;
        total_cost = total_cost.checked_add(price as u128)
            .ok_or(ExchangeError::MathError)?;
    }
    
    Ok(total_cost as u64)
}

fn calculate_sell_value(from_supply: u64, to_supply: u64, base_price: u64) -> Result<u64> {
    // Same as buy cost but in reverse
    calculate_buy_cost(to_supply, from_supply, base_price)
}

// ✅ UPDATED CONTEXTS

#[derive(Accounts)]
#[instruction(initial_price_lamports: u64, initial_supply: u64, name: String, symbol: String, uri: String)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA authority for minting
    #[account(seeds = [b"mint-authority".as_ref()], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + Market::MAX_SIZE,
        seeds = [b"market".as_ref(), mint.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: PDA for escrow authority
    #[account(seeds = [b"escrow".as_ref(), market.key().as_ref()], bump)]
    pub escrow_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = escrow_authority
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury PDA
    #[account(
        mut,
        seeds = [b"treasury".as_ref(), market.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Platform fee wallet
    #[account(
        mut,
        constraint = platform_fee_wallet.key().to_string() == PLATFORM_FEE_WALLET @ ExchangeError::InvalidPlatformWallet
    )]
    pub platform_fee_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuySell<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: Escrow authority PDA
    #[account(seeds = [b"escrow".as_ref(), market.key().as_ref()], bump)]
    pub escrow_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury PDA
    #[account(
        mut,
        seeds = [b"treasury".as_ref(), market.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Platform fee wallet
    #[account(
        mut,
        constraint = platform_fee_wallet.key().to_string() == PLATFORM_FEE_WALLET @ ExchangeError::InvalidPlatformWallet
    )]
    pub platform_fee_wallet: UncheckedAccount<'info>,

    /// CHECK: ✅ NEW: Creator wallet (market owner)
    #[account(
        mut,
        constraint = creator_wallet.key() == market.owner @ ExchangeError::InvalidCreatorWallet
    )]
    pub creator_wallet: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetMarket<'info> {
    pub market: Account<'info, Market>,
}

#[account]
pub struct Market {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub escrow: Pubkey,
    pub treasury: Pubkey,
    pub current_price: u64,
    pub total_supply: u64,
    pub circulating_supply: u64, // ✅ NEW
    pub trade_count: u64,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

impl Market {
    pub const MAX_SIZE: usize = 32 * 4 + 8 * 4 + 4 + 32 + 4 + 10 + 4 + 200;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketDetails {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub escrow: Pubkey,
    pub treasury: Pubkey,
    pub current_price: u64,
    pub total_supply: u64,
    pub circulating_supply: u64, // ✅ NEW
    pub trade_count: u64,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub initial_price: u64,
    pub initial_supply: u64,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TradeKind {
    Buy,
    Sell,
}

#[event]
pub struct TradeExecuted {
    pub market: Pubkey,
    pub buyer: Option<Pubkey>,
    pub seller: Option<Pubkey>,
    pub tokens: u64,
    pub price: u64,
    pub total_cost: u64,
    pub platform_fee: u64,
    pub creator_fee: u64, // ✅ NEW
    pub kind: TradeKind,
    pub timestamp: i64,
}

#[error_code]
pub enum ExchangeError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math error")]
    MathError,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Invalid metadata")]
    InvalidMetadata,
    #[msg("Invalid platform wallet")]
    InvalidPlatformWallet,
    #[msg("Invalid creator wallet")] // ✅ NEW
    InvalidCreatorWallet,
}
