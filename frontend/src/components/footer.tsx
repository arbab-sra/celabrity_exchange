'use client'
import React from 'react'
import {
  Footer,
  FooterBrand,
  FooterCopyright,
  FooterDivider,
  FooterIcon,
  FooterLink,
  FooterLinkGroup,
  FooterTitle,
} from 'flowbite-react'
import { BsGithub, BsInstagram, BsTwitter } from 'react-icons/bs'

const Footercomp = () => {
  return (
    <Footer container>
      <div className="w-full">
        <div className="grid w-full justify-center items-center sm:flex sm:justify-between md:flex md:grid-cols-1">
          <div>
            <FooterBrand
              className="bg-gradient-to-r opacity-80 from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 ark:text-slate-400"
              href="/"
              src="https://res.cloudinary.com/duns099gs/image/upload/v1760680167/Screenshot_2025-10-16_at_1.20.45_PM_yzhnnd.png"
              alt="   Celebrity exchange"
              name="Celebrity Exchange"
            />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6 mb-1">
            <div>
              <FooterTitle title="about" />
              <FooterLinkGroup col>
                <FooterLink href="">Exchange</FooterLink>
                <FooterLink target="_blank" href="https://arbab.fun">
                  Musicfy
                </FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Follow us" />
              <FooterLinkGroup col>
                <FooterLink target="_blank" href="https://github.com/arbab-sra/celabrity_exchange">
                  Github
                </FooterLink>
                <FooterLink target="_blank" href="https://discord.com/users/1382633461201764402">
                  Discord
                </FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Legal" />
              <FooterLinkGroup col>
                <FooterLink href="#">Privacy Policy</FooterLink>
                <FooterLink href="#">Terms &amp; Conditions</FooterLink>
              </FooterLinkGroup>
            </div>
          </div>
        </div>
        <FooterDivider />
        <div className="w-full sm:flex sm:items-center sm:justify-between mt-2">
          <FooterCopyright href="" by="Celebarity Exchange" year={2025} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            <FooterIcon target="_blank" href="https://www.instagram.com/arbab_sra/" icon={BsInstagram} />
            <FooterIcon target="_blank" href="https://x.com/arbab_sra" icon={BsTwitter} />
            <FooterIcon target="_blank" href="https://github.com/arbab-sra/celabrity_exchange" icon={BsGithub} />
          </div>
        </div>
      </div>
    </Footer>
  )
}

export default Footercomp
