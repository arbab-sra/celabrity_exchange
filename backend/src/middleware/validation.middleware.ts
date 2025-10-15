import { Request, Response, NextFunction } from "express";
import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();
export const validateAddress = (field: string = "address") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const address = req.params[field] || req.body[field];

    if (!address) {
      return res.status(400).json({
        success: false,
        error: `Missing required field: ${field}`,
      });
    }

    try {
      new PublicKey(address);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid Solana address: ${field}`,
      });
    }
  };
};

export const validatePositiveNumber = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = Number(req.body[field]);

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        error: `${field} must be a positive number`,
      });
    }

    next();
  };
};
/**
 * Validate string length
 */
export const validateStringLength = (
  field: string,
  maxLength: number,
  minLength: number = 1
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[field];

    if (!value || typeof value !== "string") {
      return res.status(400).json({
        success: false,
        error: `${field} is required and must be a string`,
      });
    }

    if (value.length < minLength || value.length > maxLength) {
      return res.status(400).json({
        success: false,
        error: `${field} must be between ${minLength} and ${maxLength} characters`,
      });
    }

    next();
  };
};

/**
 * Validate required field
 */
export const validateRequired = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        error: `${field} is required`,
      });
    }
    next();
  };
};
