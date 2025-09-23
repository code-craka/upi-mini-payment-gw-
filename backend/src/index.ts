// IMPORTANT: Sentry must be imported first!
import "../instrument.js";
import * as Sentry from "@sentry/node";

import cors from "cors";
import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import ordersRouter from "./routes/order.js";
import usersRouter from "./routes/users.js";
import { globalErrorHandler, notFoundHandler } from './utils/errorHandler.js';
import { requestLogger } from './utils/logger.js';

config({ path: '.env.local' });

const app = express();
app.use(express.json());

// ✅ Request logging middleware
app.use(requestLogger);

// ✅ Allow frontend from multiple domains
const allowedOrigins = [
    process.env.APP_BASE_URL,
    // New domains
    "https://pay.loanpaymentsystem.xyz",
    "https://www.pay.loanpaymentsystem.xyz",
    // Legacy domains (keep for transition)
    "https://negoman.com",
    "https://www.negoman.com",
    // Local development
    "http://localhost:5173",
    "http://localhost:3000"
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow no-origin requests (mobile browsers, Postman, etc.)
            if (!origin) {
                callback(null, true);
                return;
            }

            // Check if origin is in allowed list
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(`CORS blocked origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ✅ API Routes
app.get("/", (_req, res) => {
    res.json({
        message: "UPI Gateway API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        env: {
            hasMongoUri: Boolean(process.env.MONGO_URI),
            hasJwtSecret: Boolean(process.env.JWT_SECRET),
            hasAppBaseUrl: Boolean(process.env.APP_BASE_URL)
        }
    });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);

// 🐛 Sentry debug endpoint for testing
app.get("/debug-sentry", function mainHandler(req, res) {
  // Send a log before throwing the error
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
    user_ip: req.ip,
  });
  throw new Error("My first Sentry error!");
});

// ❌ Sentry error handler - must be after all routes but before other error middleware
Sentry.setupExpressErrorHandler(app);

// ✅ Handle 404 errors
app.use(notFoundHandler);

// ✅ Global error handler
app.use(globalErrorHandler);

// ✅ Connect to DB and listen on all network interfaces
mongoose
    .connect(process.env.MONGO_URI || "")
    .then(() => {
        console.log("✅ Mongo connected");
    })
    .catch((err) => {
        console.error("❌ DB connect error:", err);
        process.exit(1);
    });

export default app;
