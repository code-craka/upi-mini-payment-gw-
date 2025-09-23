import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "superadmin" | "merchant" | "user";

export interface IUser extends Document {
    username: string;
    password?: string;
    role: UserRole;
    parent?: Schema.Types.ObjectId;
    isActive: boolean;
    createdBy?: Schema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    canManage(targetUser: IUser): boolean;
}

const UserSchema = new mongoose.Schema<IUser>(
    {
        username: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["superadmin", "merchant", "user"],
            default: "user"
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            sparse: true,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            sparse: true
        }
    },
    { timestamps: true }
);

// Validation: users must have merchant parent, merchants/superadmins cannot
UserSchema.pre("save", async function (next) {
    // Hash password if modified
    if (this.isModified("password") && this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    // Validate parent relationships
    if (this.role === "user") {
        if (!this.parent) {
            return next(new Error("Users must have a merchant parent"));
        }
        // Verify parent is a merchant
        const parentUser = await mongoose.model("User").findById(this.parent);
        if (!parentUser || parentUser.role !== "merchant") {
            return next(new Error("User parent must be a merchant"));
        }
    } else if (this.role === "merchant" || this.role === "superadmin") {
        if (this.parent) {
            return next(new Error("Merchants and superadmins cannot have parents"));
        }
    }

    next();
});

// Instance method for permission checking
UserSchema.methods.canManage = function(targetUser: IUser): boolean {
    if (!this.isActive || !targetUser.isActive) return false;

    switch (this.role) {
        case "superadmin":
            return true; // Can manage everyone
        case "merchant":
            // Can manage users that belong to them
            return targetUser.role === "user" &&
                   targetUser.parent?.toString() === (this._id as any).toString();
        case "user":
            // Can only manage themselves
            return (this._id as any).toString() === (targetUser._id as any).toString();
        default:
            return false;
    }
};

// Compound indexes for efficient queries
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ parent: 1, isActive: 1 });
UserSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model<IUser>("User", UserSchema);
