import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import UserApprovalPage from "./pages/admin/UserApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TournamentManagementPage from "./pages/admin/TournamentManagementPage";
import TournamentDetailPage from "./pages/admin/TournamentDetailPage";
import DashboardPage from "./pages/admin/DashboardPage";

const UnauthorizedPage = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A] text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-400 mb-4">403 - Không có quyền truy cập</h1>
      <a href="/login" className="text-[#D4AF37] hover:underline">Quay về đăng nhập</a>
    </div>
  </div>
);

const adminRoute = (element) => (
  <PrivateRoute allowedRoles={["Admin"]}>{element}</PrivateRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Authenticated (any role) */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />

          {/* Admin — Luồng 1 */}
          <Route path="/admin/users/pending"  element={adminRoute(<UserApprovalPage />)} />
          <Route path="/admin/users"          element={adminRoute(<UserManagementPage />)} />

          {/* Admin — Luồng 2 */}
          <Route path="/admin/tournaments"     element={adminRoute(<TournamentManagementPage />)} />
          <Route path="/admin/tournaments/:id" element={adminRoute(<TournamentDetailPage />)} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
