#!/usr/bin/env node

/**
 * UPI Gateway v2.0 Migration Test Script
 * Tests the migration and RBAC functionality
 *
 * Usage:
 *   node scripts/test-migration.js
 *
 * @author Sayem Abdullah Rihan (@code-craka)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';
import User from '../dist/models/User.js';
import Order from '../dist/models/Order.js';

// Load environment variables
config({ path: '.env.local' });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
}

/**
 * Test migration results and RBAC functionality
 */
async function testMigration() {
    try {
        console.log('🧪 Starting Migration Test Suite...\n');

        // Connect to database
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to database');

        // Test 1: Check role migration
        await testRoleMigration();

        // Test 2: Check user relationships
        await testUserRelationships();

        // Test 3: Check order merchant references
        await testOrderMerchantReferences();

        // Test 4: Test RBAC permissions
        await testRBACPermissions();

        // Test 5: Check database indexes
        await testDatabaseIndexes();

        console.log('\n🎉 All migration tests passed successfully!');

    } catch (error) {
        console.error('❌ Migration test failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

/**
 * Test 1: Verify role migration from admin to superadmin
 */
async function testRoleMigration() {
    console.log('📋 Test 1: Role Migration Validation');

    // Check for any remaining 'admin' roles
    const adminUsers = await User.find({ role: 'admin' });
    if (adminUsers.length > 0) {
        throw new Error(`Found ${adminUsers.length} users with 'admin' role - migration incomplete`);
    }
    console.log('   ✅ No admin roles found');

    // Check superadmin users exist
    const superadminUsers = await User.find({ role: 'superadmin' });
    if (superadminUsers.length === 0) {
        throw new Error('No superadmin users found - migration may have failed');
    }
    console.log(`   ✅ Found ${superadminUsers.length} superadmin users`);

    // Verify role enum values
    const allRoles = await User.distinct('role');
    const expectedRoles = ['superadmin', 'merchant', 'user'];
    const invalidRoles = allRoles.filter(role => !expectedRoles.includes(role));

    if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles found: ${invalidRoles.join(', ')}`);
    }
    console.log(`   ✅ All roles valid: ${allRoles.join(', ')}`);
}

/**
 * Test 2: Verify user relationship structure
 */
async function testUserRelationships() {
    console.log('\n📋 Test 2: User Relationship Validation');

    // Check merchant users have no parent
    const merchantsWithParent = await User.find({
        role: 'merchant',
        parent: { $ne: null }
    });

    if (merchantsWithParent.length > 0) {
        throw new Error(`Found ${merchantsWithParent.length} merchants with parent - invalid structure`);
    }
    console.log('   ✅ All merchants have no parent');

    // Check user roles have merchant parent
    const usersWithoutParent = await User.find({
        role: 'user',
        $or: [{ parent: null }, { parent: { $exists: false } }]
    });

    if (usersWithoutParent.length > 0) {
        console.log(`   ⚠️  Found ${usersWithoutParent.length} users without parent - may need manual assignment`);
    } else {
        console.log('   ✅ All users have merchant parents');
    }

    // Verify parent relationships are valid
    const users = await User.find({ role: 'user', parent: { $exists: true } });
    for (const user of users) {
        const parent = await User.findById(user.parent);
        if (!parent || parent.role !== 'merchant') {
            throw new Error(`User ${user.username} has invalid parent reference`);
        }
    }
    console.log(`   ✅ Verified ${users.length} user-merchant relationships`);
}

/**
 * Test 3: Verify order merchant references
 */
async function testOrderMerchantReferences() {
    console.log('\n📋 Test 3: Order Merchant Reference Validation');

    // Check orders have merchant field
    const ordersWithoutMerchant = await Order.find({
        $or: [
            { merchant: null },
            { merchant: { $exists: false } }
        ]
    });

    if (ordersWithoutMerchant.length > 0) {
        throw new Error(`Found ${ordersWithoutMerchant.length} orders without merchant reference`);
    }

    const totalOrders = await Order.countDocuments();
    console.log(`   ✅ All ${totalOrders} orders have merchant references`);

    // Verify merchant references are valid
    const sampleOrders = await Order.find().limit(10).populate('merchant user');
    for (const order of sampleOrders) {
        if (!order.merchant) {
            throw new Error(`Order ${order.orderId} has invalid merchant reference`);
        }

        // For user orders, verify merchant is their parent
        if (order.user && order.user.role === 'user') {
            if (!order.user.parent || order.user.parent.toString() !== order.merchant._id.toString()) {
                throw new Error(`Order ${order.orderId} merchant mismatch with user parent`);
            }
        }
    }
    console.log(`   ✅ Verified ${sampleOrders.length} order-merchant relationships`);
}

/**
 * Test 4: Test RBAC permissions
 */
async function testRBACPermissions() {
    console.log('\n📋 Test 4: RBAC Permission Testing');

    // Test superadmin permissions
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (superadmin) {
        const merchant = await User.findOne({ role: 'merchant' });
        const user = await User.findOne({ role: 'user' });

        if (merchant && !superadmin.canManage(merchant)) {
            throw new Error('Superadmin cannot manage merchant - RBAC issue');
        }

        if (user && !superadmin.canManage(user)) {
            throw new Error('Superadmin cannot manage user - RBAC issue');
        }

        console.log('   ✅ Superadmin permissions working');
    }

    // Test merchant permissions
    const merchants = await User.find({ role: 'merchant' }).limit(1);
    for (const merchant of merchants) {
        const merchantUsers = await User.find({ parent: merchant._id });

        for (const user of merchantUsers) {
            if (!merchant.canManage(user)) {
                throw new Error(`Merchant ${merchant.username} cannot manage their user - RBAC issue`);
            }
        }

        console.log(`   ✅ Merchant permissions working for ${merchantUsers.length} users`);
    }

    // Test user permissions (can only manage themselves)
    const user = await User.findOne({ role: 'user' });
    if (user) {
        const otherUser = await User.findOne({
            role: 'user',
            _id: { $ne: user._id }
        });

        if (otherUser && user.canManage(otherUser)) {
            throw new Error('User can manage other user - RBAC security issue');
        }

        if (!user.canManage(user)) {
            throw new Error('User cannot manage themselves - RBAC issue');
        }

        console.log('   ✅ User permissions working');
    }
}

/**
 * Test 5: Check database indexes
 */
async function testDatabaseIndexes() {
    console.log('\n📋 Test 5: Database Index Validation');

    // Check User collection indexes
    const userIndexes = await User.collection.getIndexes();
    const requiredUserIndexes = [
        'username_1',
        'role_1_isActive_1',
        'parent_1_isActive_1'
    ];

    for (const indexName of requiredUserIndexes) {
        if (!userIndexes[indexName]) {
            throw new Error(`Missing User index: ${indexName}`);
        }
    }
    console.log(`   ✅ User collection has ${Object.keys(userIndexes).length} indexes`);

    // Check Order collection indexes
    const orderIndexes = await Order.collection.getIndexes();
    const requiredOrderIndexes = [
        'orderId_1',
        'merchant_1_status_1_createdAt_-1'
    ];

    for (const indexName of requiredOrderIndexes) {
        if (!orderIndexes[indexName]) {
            throw new Error(`Missing Order index: ${indexName}`);
        }
    }
    console.log(`   ✅ Order collection has ${Object.keys(orderIndexes).length} indexes`);
}

// Run the test suite
testMigration().catch(console.error);