import cors from "cors";
import { config } from "dotenv";
import express from "express";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import ordersRouter from "./routes/order.js";
import usersRouter from "./routes/users.js";
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandler.js";
import { requestLogger } from "./utils/logger.js";

config({ path: ".env.local" });

// Initialize Sentry here so it works both locally and on Vercel
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        integrations: [nodeProfilingIntegration()],
        enableLogs: true,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        sendDefaultPii: false,
        release: process.env.APP_VERSION || "1.0.1",
    });
}

const app = express();

// 🔒 Security: Parse JSON with size limit to prevent DoS
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🔒 Security: NoSQL injection protection
// Note: express-mongo-sanitize removed due to Express 5 incompatibility
// Multi-layer protection provided by:
// - QuerySanitizer.sanitizeFilter() in utils/queryHelpers.ts
// - InputSanitizer in utils/errorHandler.ts
// - express-validator route validation
// - Mongoose schema validation

// ✅ Request logging middleware
app.use(requestLogger);

// ✅ Allow frontend from multiple domains
const allowedOrigins = [
    process.env.APP_BASE_URL,
    // Production domains
    "https://www.loanpayment.live",
    "https://loanpayment.live",
    "https://upi-mini-gateway.vercel.app",

    // Legacy domains (keep for transition)
    "https://pay.loanpaymentsystem.xyz",
    "https://www.pay.loanpaymentsystem.xyz",
    "https://negoman.com",
    "https://www.negoman.com",
    // Local development
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
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
            hasAppBaseUrl: Boolean(process.env.APP_BASE_URL),
        },
    });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);

// ❌ Sentry error handler - must be after all routes but before other error middleware
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

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
