import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/rbac";
import Layout from "./layouts/Layout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PaymentGenerator from "./pages/PaymentGenerator";
import PayPage from "./pages/PayPage";
import UserManagementPage from "./pages/UserManagementPage";
import OrderManagementPage from "./pages/OrderManagementPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pay/:orderId" element={<PayPage />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<PaymentGenerator />} />

                    {/* Protected Admin Routes */}
                    <Route
                        path="admin/dashboard"
                        element={
                            <ProtectedRoute requiredRoles={["superadmin", "merchant"]}>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* User Management - Superadmin & Merchant only */}
                    <Route
                        path="admin/users"
                        element={
                            <ProtectedRoute requiredRoles={["superadmin", "merchant"]}>
                                <UserManagementPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Order Management - All authenticated users with role-based content */}
                    <Route
                        path="admin/orders"
                        element={
                            <ProtectedRoute requiredRoles={["superadmin", "merchant", "user"]}>
                                <OrderManagementPage />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
