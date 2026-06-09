import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import UserApprovalPage from "./pages/admin/UserApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";

const DashboardPlaceholder = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A] text-white">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-[#D4AF37] mb-4">KHU VỰC QUẢN TRỊ</h1>
      <p className="text-gray-400">Bạn đã đăng nhập thành công và được chuyển hướng tới đây!</p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A] text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-400 mb-4">403 - Không có quyền truy cập</h1>
      <a href="/login" className="text-[#D4AF37] hover:underline">Quay về đăng nhập</a>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPlaceholder />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePasswordPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users/pending"
            element={
              <PrivateRoute allowedRoles={["Admin"]}>
                <UserApprovalPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={["Admin"]}>
                <UserManagementPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
