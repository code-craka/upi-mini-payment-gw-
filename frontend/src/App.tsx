import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/auth/AdminRoute";
import Layout from "./layouts/Layout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PaymentGenerator from "./pages/PaymentGenerator";
import PayPage from "./pages/PayPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pay/:orderId" element={<PayPage />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<PaymentGenerator />} />
                    <Route path="/admin" element={<AdminRoute />}>
                        <Route path="dashboard" element={<DashboardPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
