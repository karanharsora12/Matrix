import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "matrix-super-secret-key-2026";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Global User Authentication & Audit Middleware
 * Decodes the Bearer token if present and attaches `req.user`.
 * Automatically populates `addBy` on POST requests and `editBy` on PUT/PATCH requests.
 */
export const authUserMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.id) {
          req.user = {
            id: Number(decoded.id),
            email: decoded.email,
            name: decoded.name,
          };
        }
      }
    }
  } catch (error) {
    // If token is invalid or expired, continue without req.user
    // Optional endpoints can still proceed
  }

  if (!req.user && process.env.NODE_ENV !== "production") {
    req.user = { id: 1, email: "admin@company.com", name: "Admin User" };
  }

  if (req.user?.id && req.body && typeof req.body === "object") {
    const userId = req.user.id;
    const method = req.method.toUpperCase();

    if (method === "POST") {
      if (req.body.addBy == null) {
        req.body.addBy = userId;
      }
      // On new entry creation, editBy must be null because it has not been edited yet
      req.body.editBy = null;

      if (Array.isArray(req.body.itemLines)) {
        req.body.itemLines = req.body.itemLines.map((item: any) => ({
          ...item,
          addBy: item.addBy != null ? item.addBy : userId,
          editBy: null,
        }));
      }
    } else if (method === "PUT" || method === "PATCH") {
      req.body.editBy = userId;
      if (Array.isArray(req.body.itemLines)) {
        req.body.itemLines = req.body.itemLines.map((item: any) => ({
          ...item,
          editBy: userId,
        }));
      }
    }
  }

  next();
};

/**
 * Strict authentication guard for routes that require an authenticated user
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in.",
    });
  }
  next();
};
