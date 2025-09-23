import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus =
    | "PENDING"
    | "SUBMITTED"
    | "VERIFIED"
    | "EXPIRED"
    | "CANCELLED"
    | "INVALIDATED";

export interface OrderMetadata {
    ipAddress: string;
    userAgent: string;
    platform: string;
}

export interface IOrder extends Document {
    orderId: string;
    amount: number;
    vpa: string;
    merchantName: string;
    note?: string;
    upiLink?: string;
    status: OrderStatus;
    utr?: string | null;
    expiresAt?: Date;
    createdAt?: Date;
    user: Schema.Types.ObjectId;
    createdBy: Schema.Types.ObjectId;
    merchant: Schema.Types.ObjectId;
    isActive: boolean;
    invalidatedBy?: Schema.Types.ObjectId;
    invalidatedAt?: Date;
    metadata?: OrderMetadata;
}

const OrderSchema = new mongoose.Schema<IOrder>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true
        },
        merchant: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true
        },
        orderId: { type: String, required: true, unique: true, index: true },
        amount: { type: Number, required: true, index: true },
        vpa: { type: String, required: true },
        merchantName: { type: String, default: "Merchant" },
        note: { type: String },
        upiLink: { type: String },
        status: {
            type: String,
            enum: ["PENDING", "SUBMITTED", "VERIFIED", "EXPIRED", "CANCELLED", "INVALIDATED"],
            default: "PENDING",
            index: true
        },
        utr: { type: String, default: null, sparse: true },
        expiresAt: { type: Date, index: true },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        invalidatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            sparse: true
        },
        invalidatedAt: {
            type: Date,
            sparse: true
        },
        metadata: {
            ipAddress: { type: String },
            userAgent: { type: String },
            platform: { type: String }
        }
    },
    { timestamps: true }
);

// Pre-save middleware to automatically set merchant from user's parent
OrderSchema.pre("save", async function (next) {
    if (this.isNew && !this.merchant) {
        try {
            const User = mongoose.model("User");
            const user = await User.findById(this.user);

            if (!user) {
                return next(new Error("Invalid user reference"));
            }

            if (user.role === "user" && user.parent) {
                this.merchant = user.parent;
            } else if (user.role === "merchant") {
                this.merchant = user._id;
            } else {
                return next(new Error("Cannot determine merchant for order"));
            }
        } catch (error) {
            return next(error as any);
        }
    }
    next();
});

// Compound indexes for efficient role-based queries
OrderSchema.index({ merchant: 1, status: 1, createdAt: -1 });
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });
OrderSchema.index({ createdBy: 1, createdAt: -1 });
OrderSchema.index({ status: 1, isActive: 1, createdAt: -1 });
OrderSchema.index({ amount: 1, status: 1, createdAt: -1 });
OrderSchema.index({ expiresAt: 1, status: 1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
