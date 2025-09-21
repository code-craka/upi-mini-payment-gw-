import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { admin, protect } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// Register a new user (for now, open registration)
router.post(
    "/register",
    protect,
    admin,
    async (req: Request, res: Response) => {
        try {
            const { username, password, role } = req.body;
            if (!username || !password) {
                return res
                    .status(400)
                    .json({ message: "username and password required" });
            }
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res
                    .status(400)
                    .json({ message: "username already exists" });
            }
            const user = await User.create({
                username,
                password,
                role: role || "user",
            });
            return res.status(201).json({ message: "user created" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "server error" });
        }
    }
);

// Login a user
router.post("/login", async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log("Login attempt for username:", username);
        
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "username and password required" });
        }
        
        const user = await User.findOne({ username }).select("+password");
        console.log("User found:", user ? "Yes" : "No");
        
        if (!user || !user.password) {
            console.log("User not found or no password");
            return res.status(401).json({ message: "invalid credentials" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch);
        
        if (!isMatch) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );
        
        console.log("Login successful for user:", username);
        return res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "server error" });
    }
});

export default router;
