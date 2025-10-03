import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: '.env.local' });

// Define User schema inline (v2.0 RBAC)
const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["superadmin", "merchant", "user"], default: "user" },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
    },
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model("User", UserSchema);

const createSuperAdmin = async (): Promise<void> => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        const uriPreview = process.env.MONGO_URI?.substring(0, 20) || '';
        console.log("MongoDB URI:", uriPreview, "...");
        
        await mongoose.connect(process.env.MONGO_URI || "");
        console.log("✅ Connected to MongoDB");

        // Check if superadmin already exists
        const existingAdmin = await User.findOne({ username: "superadmin" });
        
        if (existingAdmin) {
            console.log("❌ Superadmin already exists");
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create superadmin user
        console.log("👤 Creating superadmin user...");
        await User.create({
            username: "superadmin",
            password: "admin123", // Will be hashed by the pre-save hook
            role: "superadmin",
            parent: null, // Superadmin has no parent
            isActive: true,
            createdBy: null // Self-created
        });

        console.log("✅ Superadmin created successfully!");
        console.log("⚠️  Please change the default password after first login!");
        
    } catch (error) {
        console.error("❌ Error creating superadmin:", error);
        if (error instanceof Error) {
            console.error("Full error:", error.message);
        }
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
        process.exit(0);
    }
};

createSuperAdmin();