import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: '.env.local' });

// Define User schema inline
const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["admin", "user"], default: "user" },
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
            role: "admin"
        });

        console.log("✅ Superadmin created successfully!");
        console.log("📝 Login credentials:");
        console.log("   Username: superadmin");
        console.log("   Password: admin123");
        console.log("⚠️  Please change the password after first login!");
        
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