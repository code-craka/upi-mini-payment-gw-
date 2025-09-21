import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: "admin" | "user";
    };
}

export const protect = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "not authorized, no token" });
    }
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as { userId: string; role: "admin" | "user" };
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res
            .status(401)
            .json({ message: "not authorized, token failed" });
    }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "not authorized as an admin" });
    }
};
