import { api } from "./api";

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),

  // FE-04: gửi credential (ID token JWT) Google lấy được từ nút "Sign in with Google"
  // BE (/api/auth/google) verify với Google rồi tạo/đăng nhập tài khoản Spectator
  loginWithGoogle: (idToken) => api.post("/auth/google", { idToken }),

  // Bước 1: Gửi email → BE sinh token + gửi mail
  requestPasswordReset: (data) => api.post("/auth/forgot-password", data),

  // Bước 2: Dùng token từ email + mật khẩu mới để đặt lại
  resetPassword: (data) => api.post("/auth/reset-password", data),

  changePassword: (data) => api.post("/auth/change-password", data),
};
