import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const migrateToV2 = async () => {
    const isDryRun = process.argv.includes('--dry-run');
    
    try {
        console.log("🔄 Starting UPI Gateway v2.0 Migration...");
        console.log(`📋 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
        console.log("=" .repeat(50));
        
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in environment variables");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);

        // Get collections
        const usersCollection = mongoose.connection.db.collection('users');
        const ordersCollection = mongoose.connection.db.collection('orders');

        // === STEP 1: ANALYZE CURRENT DATA ===
        console.log("\n📊 ANALYZING CURRENT DATA...");
        
        const totalUsers = await usersCollection.countDocuments();
        const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
        const regularUsers = await usersCollection.countDocuments({ role: 'user' });
        const totalOrders = await ordersCollection.countDocuments();

        console.log(`👥 Total Users: ${totalUsers}`);
        console.log(`🔑 Admin Users: ${adminUsers}`);
        console.log(`👤 Regular Users: ${regularUsers}`);
        console.log(`📦 Total Orders: ${totalOrders}`);

        if (isDryRun) {
            console.log("\n🔍 DRY RUN - No changes will be made");
        }

        // === STEP 2: UPDATE USER SCHEMA ===
        console.log("\n🔄 STEP 1: Updating User Schema...");
        
        if (!isDryRun) {
            // Convert admin role to superadmin
            const adminUpdateResult = await usersCollection.updateMany(
                { role: 'admin' },
                { 
                    $set: { 
                        role: 'superadmin',
                        isActive: true,
                        parent: null,
                        createdBy: null
                    }
                }
            );
            console.log(`✅ Updated ${adminUpdateResult.modifiedCount} admin users to superadmin`);

            // Update existing regular users
            const userUpdateResult = await usersCollection.updateMany(
                { 
                    role: 'user', 
                    $or: [
                        { isActive: { $exists: false } },
                        { parent: { $exists: false } },
                        { createdBy: { $exists: false } }
                    ]
                },
                { 
                    $set: { 
                        isActive: true,
                        parent: null, // Will need manual assignment
                        createdBy: null
                    }
                }
            );
            console.log(`✅ Updated ${userUpdateResult.modifiedCount} regular users with new fields`);
        } else {
            console.log(`📋 Would update ${adminUsers} admin users to superadmin`);
            console.log(`📋 Would update ${regularUsers} regular users with new fields`);
        }

        // === STEP 3: UPDATE ORDER SCHEMA ===
        console.log("\n🔄 STEP 2: Updating Order Schema...");
        
        if (!isDryRun) {
            const orders = await ordersCollection.find({}).toArray();
            let updatedOrders = 0;

            for (const order of orders) {
                const updateData = {
                    createdBy: order.user, // Initially, creator is same as user
                    merchant: order.user,  // Will need proper merchant assignment
                    isActive: true
                };

                // Only update if fields don't exist
                const needsUpdate = !order.createdBy || !order.merchant || order.isActive === undefined;
                
                if (needsUpdate) {
                    await ordersCollection.updateOne(
                        { _id: order._id },
                        { $set: updateData }
                    );
                    updatedOrders++;
                }
            }
            console.log(`✅ Updated ${updatedOrders} orders with new fields`);
        } else {
            console.log(`📋 Would update ${totalOrders} orders with new fields`);
        }

        // === STEP 4: CREATE INDEXES ===
        console.log("\n🔄 STEP 3: Creating Database Indexes...");
        
        if (!isDryRun) {
            // User indexes
            await usersCollection.createIndex({ parent: 1 });
            await usersCollection.createIndex({ isActive: 1 });
            await usersCollection.createIndex({ role: 1, isActive: 1 });
            
            // Order indexes
            await ordersCollection.createIndex({ merchant: 1, status: 1, createdAt: -1 });
            await ordersCollection.createIndex({ createdBy: 1, createdAt: -1 });
            await ordersCollection.createIndex({ isActive: 1 });
            await ordersCollection.createIndex({ user: 1, status: 1, createdAt: -1 });
            
            console.log("✅ Created database indexes for performance optimization");
        } else {
            console.log("📋 Would create 7 new database indexes");
        }

        // === STEP 5: VALIDATION ===
        console.log("\n🔍 STEP 4: Validation...");
        
        const postMigrationUsers = await usersCollection.countDocuments();
        const superadminUsers = await usersCollection.countDocuments({ role: 'superadmin' });
        const activeUsers = await usersCollection.countDocuments({ isActive: true });
        
        console.log(`👥 Total Users After Migration: ${postMigrationUsers}`);
        console.log(`🔑 Superadmin Users: ${superadminUsers}`);
        console.log(`✅ Active Users: ${activeUsers}`);

        // === MIGRATION SUMMARY ===
        console.log("\n" + "=".repeat(50));
        console.log("🎉 MIGRATION COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(50));

        if (isDryRun) {
            console.log("\n⚠️  THIS WAS A DRY RUN - NO CHANGES MADE");
            console.log("To run the actual migration, use:");
            console.log("node scripts/migrate-to-v2.js");
        } else {
            console.log("\n✅ LIVE MIGRATION COMPLETED");
        }

        console.log("\n📋 MANUAL STEPS REQUIRED:");
        console.log("1. Create merchant users for your business structure");
        console.log("2. Assign regular users to appropriate merchants (update parent field)");
        console.log("3. Update order.merchant field to reflect proper merchant ownership");
        console.log("4. Test the new role-based access controls");
        console.log("5. Update frontend to handle new role system (optional)");

        console.log("\n🔧 SUGGESTED NEXT COMMANDS:");
        console.log("# Test the API with different roles");
        console.log("# Create a merchant user:");
        console.log("curl -X POST http://localhost:5000/api/users \\");
        console.log("  -H 'Authorization: Bearer YOUR_SUPERADMIN_TOKEN' \\");
        console.log("  -H 'Content-Type: application/json' \\");
        console.log("  -d '{\"username\":\"merchant1\",\"password\":\"password123\",\"role\":\"merchant\"}'");

    } catch (error) {
        console.error("\n❌ MIGRATION FAILED:");
        console.error(error.message);
        console.error("\n🔄 ROLLBACK GUIDANCE:");
        console.error("1. Restore database from backup if available");
        console.error("2. Or manually revert role changes:");
        console.error("   db.users.updateMany({role:'superadmin'}, {$set:{role:'admin'}})");
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Migration interrupted by user');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('uncaughtException', async (err) => {
    console.error('\n💥 Uncaught Exception:', err);
    await mongoose.disconnect();
    process.exit(1);
});

// Run migration
migrateToV2().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});