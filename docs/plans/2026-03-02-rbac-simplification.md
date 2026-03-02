# RBAC Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the system to 2 active roles — superadmin (full control) and merchant (payment link generation only) — by blocking merchant user-creation, adding an admin order-edit endpoint, and updating the frontend accordingly.

**Architecture:** Surgical removal approach — no DB migration, no schema changes. The `user` role enum remains in MongoDB for existing records but no new accounts can be created with it. Three backend changes + four frontend component changes.

**Tech Stack:** Express 5 + TypeScript (backend), React 19 + TypeScript + Tailwind + Framer Motion (frontend), Mongoose, express-validator, SweetAlert2.

---

## Task 1: Block merchant from creating users (backend)

**Files:**
- Modify: `backend/src/routes/users.ts:94` — change middleware on POST /

**Context:** Currently `POST /api/users` uses `merchant` middleware which allows merchant-or-above. We need to restrict to superadmin only.

**Step 1: Make the change**

In `backend/src/routes/users.ts`, find this line (around line 94):

```typescript
router.post("/", protect, merchant, async (req: AuthRequest, res) => {
```

Change `merchant` to `superadmin`:

```typescript
router.post("/", protect, superadmin, async (req: AuthRequest, res) => {
```

**Step 2: Verify the import is already there**

Check top of `routes/users.ts` — confirm `superadmin` is already imported from `"../middleware/auth.js"`. It is (line 6). No import change needed.

**Step 3: Manual verify**

```bash
cd backend && npm run build
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add backend/src/routes/users.ts
git commit -m "security: restrict user creation to superadmin only"
```

---

## Task 2: Update canCreateRole helper (backend)

**Files:**
- Modify: `backend/src/utils/roleHelpers.ts:84-87` — update merchant case

**Context:** Defense-in-depth layer. Even if route guard is bypassed, the helper should return false for merchants creating any role.

**Step 1: Make the change**

In `backend/src/utils/roleHelpers.ts`, find this block (around line 84):

```typescript
        case "merchant":
                return targetRole === "user"; // Can only create users
```

Replace with:

```typescript
        case "merchant":
                return false; // Merchants cannot create any accounts
```

**Step 2: Build to verify**

```bash
cd backend && npm run build
```

Expected: No errors.

**Step 3: Commit**

```bash
git add backend/src/utils/roleHelpers.ts
git commit -m "security: merchants can no longer create any user accounts"
```

---

## Task 3: Add PATCH /api/orders/:orderId endpoint (backend)

**Files:**
- Modify: `backend/src/routes/order.ts` — add new PATCH route before the DELETE route

**Context:** Superadmin needs to edit amount, VPA, and/or expiry on any existing order. Order must not be INVALIDATED or EXPIRED to be editable.

**Step 1: Add the route**

In `backend/src/routes/order.ts`, find the DELETE route near the bottom:

```typescript
/**
 * DELETE /:orderId - Superadmin-only soft deletion
 */
router.delete("/:orderId", apiLimiter, protect, superadmin, async (req: AuthRequest, res: Response) => {
```

Insert the following PATCH route **immediately before** the DELETE route:

```typescript
/**
 * PATCH /:orderId - Superadmin-only order editing (amount, VPA, expiry)
 */
router.patch("/:orderId",
    apiLimiter,
    protect,
    superadmin,
    [
        body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
        body('vpa').optional().isString().trim().withMessage('VPA must be a string'),
        body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO date')
    ],
    async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                errors: errors.array()
            });
        }

        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);
        if (!sanitizedOrderId) {
            return res.status(400).json({
                message: "Invalid order ID format",
                code: "INVALID_ORDER_ID"
            });
        }

        const order = await Order.findOne({
            orderId: sanitizedOrderId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        const nonEditableStatuses = ["INVALIDATED", "EXPIRED"];
        if (nonEditableStatuses.includes(order.status)) {
            return res.status(400).json({
                message: `Cannot edit an order with status ${order.status}`,
                code: "INVALID_STATUS"
            });
        }

        const { amount, vpa, expiresAt } = req.body;

        if (!amount && !vpa && !expiresAt) {
            return res.status(400).json({
                message: "At least one field (amount, vpa, expiresAt) must be provided",
                code: "NO_FIELDS_PROVIDED"
            });
        }

        const updateData: Partial<{ amount: number; vpa: string; upiLink: string; expiresAt: Date }> = {};

        if (amount) {
            updateData.amount = Number(amount);
        }

        if (vpa) {
            if (!isValidVpa(vpa)) {
                return res.status(400).json({
                    message: "Invalid VPA format",
                    code: "INVALID_VPA"
                });
            }
            updateData.vpa = vpa;
            // Rebuild UPI link if VPA changes
            updateData.upiLink = buildUpiLink({
                pa: vpa,
                pn: order.merchantName || "Merchant",
                am: amount ? Number(amount) : order.amount,
                tn: order.note,
                tr: order.orderId,
            });
        }

        if (expiresAt) {
            updateData.expiresAt = new Date(expiresAt);
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: sanitizedOrderId },
            updateData,
            { new: true, runValidators: true }
        )
            .populate("user", "username role")
            .populate("merchant", "username")
            .populate("createdBy", "username role");

        return res.json({
            message: "Order updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

```

**Step 2: Build to verify**

```bash
cd backend && npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add backend/src/routes/order.ts
git commit -m "feat: add PATCH /api/orders/:orderId for superadmin order editing"
```

---

## Task 4: Fix route guard in App.tsx (frontend)

**Files:**
- Modify: `frontend/src/App.tsx:27` — restrict UserManagementPage to superadmin only

**Context:** Currently the `/admin/users` route allows both superadmin and merchant. Merchants should no longer see or access user management.

**Step 1: Make the change**

In `frontend/src/App.tsx`, find:

```typescript
                    <ProtectedRoute requiredRoles={["superadmin", "merchant"]}>
                        <UserManagementPage />
                    </ProtectedRoute>
```

Replace with:

```typescript
                    <ProtectedRoute requiredRoles={["superadmin"]}>
                        <UserManagementPage />
                    </ProtectedRoute>
```

**Step 2: Build to verify**

```bash
cd frontend && npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "security: restrict user management page to superadmin only"
```

---

## Task 5: Update UserManagement.tsx — remove user-role creation (frontend)

**Files:**
- Modify: `frontend/src/components/admin/UserManagement.tsx`

**Context:** Remove: (1) `"user"` from role dropdown, (2) merchant parent selector and its state, (3) no-merchants warning banner, (4) parentId/merchantError state, (5) the merchant-fetch useEffect, (6) the debug console.log, (7) user-related validation in createUser. The form becomes a clean 4-column grid: username, password, role (superadmin/merchant), create button.

**Step 1: Replace the entire file content**

Replace `frontend/src/components/admin/UserManagement.tsx` with:

```typescript
import axios from "axios";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
    FiEdit3,
    FiLock,
    FiShield,
    FiTrash2,
    FiUser,
    FiUserCheck,
    FiUserPlus,
    FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
import type { User, UserCreateRequest, UserRole } from "../../types/types";

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("merchant");
    const [creating, setCreating] = useState(false);

    const api =
        import.meta.env.VITE_API_URL || "https://api.loanpaymentsystem.xyz";
    const token = localStorage.getItem("token");

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${api}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data.users || res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    }, [api, token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const userData: UserCreateRequest = {
                username,
                password,
                role,
            };

            await axios.post(`${api}/api/users`, userData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Swal.fire({
                icon: "success",
                title: "Account Created",
                text: `"${username}" has been successfully created.`,
                confirmButtonColor: "#10b981",
            });

            setUsername("");
            setPassword("");
            setRole("merchant");
            fetchUsers();
        } catch (err) {
            console.error("Failed to create user:", err);
            Swal.fire({
                icon: "error",
                title: "Creation Failed",
                text: "An error occurred while creating the account.",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setCreating(false);
        }
    };

    const deleteUser = async (id: string, username: string) => {
        Swal.fire({
            title: `Delete "${username}"?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            width: 350,
            padding: "1.5rem",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${api}/api/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: `"${username}" has been deleted.`,
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: "top-right",
                        background: "#111827",
                        color: "#fff",
                    });

                    fetchUsers();
                } catch (err) {
                    console.error("Failed to delete user:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Failed to delete account. Try again.",
                        confirmButtonColor: "#ef4444",
                    });
                }
            }
        });
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case "superadmin": return FiShield;
            case "merchant": return FiUserCheck;
            default: return FiUser;
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case "superadmin": return "from-orange-500 to-red-500";
            case "merchant": return "from-purple-500 to-pink-500";
            default: return "from-blue-500 to-purple-500";
        }
    };

    if (loading) {
        return (
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        <span className="ml-3 text-white">Loading accounts...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                        <FiUsers className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Account Management</h2>
                        <p className="text-slate-300">Create and manage merchant accounts</p>
                    </div>
                </div>

                {/* Create Account Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="mb-8"
                >
                    <div className="bg-white/5 rounded-xl px-6 pt-6 pb-8 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FiUserPlus className="w-5 h-5 mr-2 text-green-400" />
                            Add New Account
                        </h3>
                        <form
                            onSubmit={createUser}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                            {/* Username Input */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiUser className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiLock className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role Select */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiShield className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300 appearance-none"
                                        aria-label="Account role selection"
                                    >
                                        <option value="merchant" className="bg-slate-800">Merchant</option>
                                        <option value="superadmin" className="bg-slate-800">Superadmin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={creating}
                                className="relative group overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-green-500 hover:to-teal-500 transition-all duration-300">
                                    {creating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus className="w-4 h-4" />
                                            <span>Create</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* Accounts Table */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <FiEdit3 className="w-5 h-5 mr-2 text-blue-400" />
                            All Accounts ({users.length})
                        </h3>
                    </div>

                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <FiUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-400">No accounts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Account</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.map((user, index) => {
                                        const RoleIcon = getRoleIcon(user.role);
                                        return (
                                            <motion.tr
                                                key={user._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.9 + index * 0.05 }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user.role)} rounded-full flex items-center justify-center mr-3`}>
                                                            <span className="text-white font-bold text-sm">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">{user.username}</div>
                                                            <div className="text-slate-400 text-sm">ID: {user._id.slice(-6)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                                                        <RoleIcon className="w-3 h-3 mr-1" />
                                                        {user.role === "superadmin" ? "Superadmin" : "Merchant"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => deleteUser(user._id, user.username)}
                                                        className="relative group overflow-hidden cursor-pointer"
                                                        title={`Delete ${user.username}`}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white p-2 rounded-lg hover:from-red-500 hover:to-pink-500 transition-all duration-300">
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </div>
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
```

**Step 2: Build to verify**

```bash
cd frontend && npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add frontend/src/components/admin/UserManagement.tsx
git commit -m "feat: simplify UserManagement to superadmin/merchant creation only"
```

---

## Task 6: Simplify MerchantDashboard.tsx (frontend)

**Files:**
- Modify: `frontend/src/components/dashboards/MerchantDashboard.tsx` — replace entirely

**Context:** Remove stat cards, top users panel, performance overview. Replace with: header, payment link generator section (inline form calling `POST /api/orders`), recent orders list (calls `GET /api/orders`). Merchant sees their own orders with a Verify action.

**Step 1: Replace the entire file content**

Replace `frontend/src/components/dashboards/MerchantDashboard.tsx` with:

```typescript
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiShoppingBag, FiLink2, FiDollarSign, FiCopy, FiCheck, FiClock, FiCheckCircle, FiAlertTriangle, FiShield } from "react-icons/fi";
import Swal from "sweetalert2";
import type { OrderEnhanced, CreateOrderResp } from "../../types/types";
import { RoleBadge } from "../rbac";
import CopyButton from "../CopyButton";

interface MerchantDashboardProps {
  className?: string;
}

export default function MerchantDashboard({ className = "" }: MerchantDashboardProps) {
  const [orders, setOrders] = useState<OrderEnhanced[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Payment link generator state
  const [amount, setAmount] = useState<number | "">("");
  const [vpa, setVpa] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [generatedLink, setGeneratedLink] = useState<CreateOrderResp | null>(null);
  const [generating, setGenerating] = useState(false);

  const api = import.meta.env.VITE_API_URL || "https://api.loanpaymentsystem.xyz";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`${api}/api/orders?limit=20`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [api, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const generateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGeneratedLink(null);
    try {
      const res = await fetch(`${api}/api/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: Number(amount), vpa, merchantName: merchantName || "Merchant" })
      });

      if (res.ok) {
        const data: CreateOrderResp = await res.json();
        setGeneratedLink(data);
        fetchOrders();
      } else {
        const err = await res.json();
        Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to generate link", confirmButtonColor: "#ef4444" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to generate payment link", confirmButtonColor: "#ef4444" });
    } finally {
      setGenerating(false);
    }
  };

  const verifyOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${api}/api/orders/${orderId}/verify`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Verified!", timer: 1500, showConfirmButton: false, toast: true, position: "top-right", background: "#111827", color: "#fff" });
        fetchOrders();
      } else {
        const err = await res.json();
        Swal.fire({ icon: "error", title: "Error", text: err.message || "Verification failed", confirmButtonColor: "#ef4444" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Verification failed", confirmButtonColor: "#ef4444" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "VERIFIED": return FiCheckCircle;
      case "EXPIRED": return FiAlertTriangle;
      case "SUBMITTED": return FiClock;
      default: return FiClock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "VERIFIED": return "text-green-400 bg-green-400/20";
      case "EXPIRED": return "text-red-400 bg-red-400/20";
      case "SUBMITTED": return "text-blue-400 bg-blue-400/20";
      default: return "text-yellow-400 bg-yellow-400/20";
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiShield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Merchant Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Welcome back, {user.username}</p>
        </div>
        <RoleBadge role="merchant" size="lg" />
      </div>

      {/* Payment Link Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <FiLink2 className="w-5 h-5 text-purple-400" />
          <span>Generate Payment Link</span>
        </h2>
        <form onSubmit={generateLink} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiDollarSign className="w-4 h-4 text-green-400" />
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Amount (₹)"
              min="1"
              required
              className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all"
            />
          </div>

          <input
            type="text"
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="UPI VPA (e.g. name@upi)"
            required
            className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all"
          />

          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="Merchant name (optional)"
            className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={generating}
            className="relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-purple-500 hover:to-blue-500 transition-all">
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiLink2 className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </div>
          </button>
        </form>

        {/* Generated Link Result */}
        {generatedLink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-500/10 border border-green-400/30 rounded-xl"
          >
            <p className="text-green-400 font-medium mb-2 flex items-center space-x-2">
              <FiCheck className="w-4 h-4" />
              <span>Payment link generated!</span>
            </p>
            <div className="flex items-center space-x-3">
              <code className="flex-1 text-slate-300 text-sm bg-white/5 px-3 py-2 rounded-lg overflow-auto">
                {generatedLink.payPageUrl}
              </code>
              <CopyButton text={generatedLink.payPageUrl} />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <FiShoppingBag className="w-5 h-5 text-green-400" />
          <span>My Orders</span>
        </h2>

        {loadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <FiShoppingBag className="mx-auto text-slate-400 text-3xl mb-2" />
            <p className="text-slate-400">No orders yet. Generate your first payment link above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Created</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const statusColor = getStatusColor(order.status);
                  return (
                    <tr key={order._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-mono text-sm">#{order.orderId}</td>
                      <td className="px-4 py-3 text-green-400 font-medium">₹{order.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium space-x-1 ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="capitalize">{order.status.toLowerCase()}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.status === "SUBMITTED" && (
                          <button
                            onClick={() => verifyOrder(order.orderId)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

**Step 2: Build to verify**

```bash
cd frontend && npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add frontend/src/components/dashboards/MerchantDashboard.tsx
git commit -m "feat: simplify MerchantDashboard to payment generator + order list"
```

---

## Task 7: Add Edit action to OrderList.tsx (frontend)

**Files:**
- Modify: `frontend/src/components/order-management/OrderList.tsx`

**Context:** Add an Edit button (superadmin only, via `PermissionGate`) that opens a modal to edit amount, VPA, and expiry. On submit, calls `PATCH /api/orders/:orderId`.

**Step 1: Add state and handler**

In `OrderList.tsx`, after the existing `const [showFilters, setShowFilters] = useState(false);` line, add:

```typescript
  const [editingOrder, setEditingOrder] = useState<OrderEnhanced | null>(null);
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editVpa, setEditVpa] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
```

**Step 2: Add the saveEdit handler**

After the `clearFilters` function, add:

```typescript
  const openEdit = (order: OrderEnhanced) => {
    setEditingOrder(order);
    setEditAmount(order.amount);
    setEditVpa(order.vpa || "");
    setEditExpiresAt(order.expiresAt ? new Date(order.expiresAt).toISOString().slice(0, 16) : "");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {};
      if (editAmount !== "" && editAmount !== editingOrder.amount) body.amount = editAmount;
      if (editVpa && editVpa !== editingOrder.vpa) body.vpa = editVpa;
      if (editExpiresAt) body.expiresAt = new Date(editExpiresAt).toISOString();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${editingOrder.orderId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update order");
      }
    } catch {
      alert("Failed to update order");
    } finally {
      setSaving(false);
    }
  };
```

**Step 3: Add FiEdit3 to icon imports**

Find the existing imports line:

```typescript
import { FiShoppingBag, FiSearch, FiFilter, FiUser, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAlertTriangle, FiEye, FiX } from "react-icons/fi";
```

Add `FiEdit3` to the import list:

```typescript
import { FiShoppingBag, FiSearch, FiFilter, FiUser, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAlertTriangle, FiEye, FiX, FiEdit3 } from "react-icons/fi";
```

**Step 4: Add Edit button to the Actions section**

Find the existing `{/* Actions */}` block:

```typescript
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {canViewOrderDetails(order) && (
                        <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all duration-300">
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Superadmin-only invalidate button */}
                      <PermissionGate requiredRole="superadmin">
                        {order.status !== "expired" && (
                          <button className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all duration-300">
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </PermissionGate>
                    </div>
```

Replace with:

```typescript
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {canViewOrderDetails(order) && (
                        <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all duration-300">
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Superadmin-only edit button */}
                      <PermissionGate requiredRole="superadmin">
                        {!["INVALIDATED", "EXPIRED"].includes(order.status.toUpperCase()) && (
                          <button
                            onClick={() => openEdit(order)}
                            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-all duration-300"
                            title="Edit order"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        )}
                      </PermissionGate>

                      {/* Superadmin-only invalidate button */}
                      <PermissionGate requiredRole="superadmin">
                        {!["INVALIDATED", "EXPIRED"].includes(order.status.toUpperCase()) && (
                          <button className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all duration-300">
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </PermissionGate>
                    </div>
```

**Step 5: Add Edit modal**

Immediately before the closing `</motion.div>` tag at the bottom of the component's return, add:

```typescript
        {/* Edit Order Modal */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <FiEdit3 className="w-5 h-5 text-yellow-400" />
                <span>Edit Order #{editingOrder.orderId}</span>
              </h3>
              <form onSubmit={saveEdit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : "")}
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">VPA</label>
                  <input
                    type="text"
                    value={editVpa}
                    onChange={(e) => setEditVpa(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Expiry</label>
                  <input
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
```

**Step 6: Build to verify**

```bash
cd frontend && npm run build
```

Expected: No TypeScript errors.

**Step 7: Commit**

```bash
git add frontend/src/components/order-management/OrderList.tsx
git commit -m "feat: add superadmin order edit modal to OrderList"
```

---

## Task 8: Manual integration test

**No code changes — verification only.**

Run both servers:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Test checklist:**

1. **Superadmin login** → go to `/admin/users` → create a merchant → merchant appears in table ✓
2. **Superadmin login** → try to create a `user` role → role dropdown should only show `merchant` and `superadmin` ✓
3. **Merchant login** → should NOT see "Users" nav link → direct URL `/admin/users` should show "Access Denied" ✓
4. **Merchant login** → go to dashboard → see payment generator + order list (no stat cards, no top users) ✓
5. **Merchant login** → generate a payment link → link appears below form ✓
6. **Merchant login** → try `POST /api/users` via browser dev tools with merchant token → should get 403 ✓
7. **Superadmin login** → go to `/admin/orders` → see Edit (yellow) button and Invalidate (red) button on PENDING orders ✓
8. **Superadmin login** → click Edit on an order → modal opens → change amount → Save → order updates ✓
9. **Superadmin login** → click Edit on an INVALIDATED order → Edit button should not be visible ✓

**Final commit:**

```bash
git commit --allow-empty -m "test: RBAC simplification verified - 2-role system working"
```
