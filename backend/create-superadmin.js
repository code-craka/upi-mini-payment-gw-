import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

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

const createSuperAdmin = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        console.log("MongoDB URI:", process.env.MONGO_URI?.substring(0, 50) + "...");
        
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
        console.log("⚠️  Please change the default password after first login!");
        
    } catch (error) {
        console.error("❌ Error creating superadmin:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createSuperAdmin();