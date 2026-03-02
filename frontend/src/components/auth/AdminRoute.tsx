import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "admin") {
        return <Outlet />;
    } else {
        return <Navigate to="/login" replace />;
    }
};

export default AdminRoute;
