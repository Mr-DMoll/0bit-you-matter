import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

/**
 * Auth Rate Limiter:
 * Brute-force protection on /login and /register.
 * Disabled in development so testing isn't blocked.
 * Re-enables automatically in production.
 */
const _authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "fail", message: "Too many attempts from this IP, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") return next();
  return _authRateLimiter(req, res, next);
};

/**
 * Global Rate Limiter:
 * Protects the entire API from general abuse.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: {
    message: "Too many requests from this IP, please try again in an hour.",
  },
});
