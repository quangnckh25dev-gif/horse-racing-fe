import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // <-- Thêm dòng này

// Màn hình Dashboard "ảo" tạm thời
const DashboardPlaceholder = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A] text-white">
    <div className="text-center">
      <h1 className="text-5xl font-bold text-[#D4AF37] mb-4">
        KHU VỰC QUẢN TRỊ 🚀
      </h1>
      <p className="text-gray-400">
        Bạn đã đăng nhập thành công và được chuyển hướng tới đây!
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào localhost:5173 sẽ tự nhảy sang /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Khai báo route cho trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Khai báo route cho trang quản trị */}
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
