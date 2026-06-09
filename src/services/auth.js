import { api } from "./api";

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),

  // Bước 1: Gửi email → BE sinh token + gửi mail
  requestPasswordReset: (data) => api.post("/auth/forgot-password/request", data),

  // Bước 2: Dùng token từ email + mật khẩu mới để đặt lại
  resetPassword: (data) => api.post("/auth/forgot-password/reset", data),

  changePassword: (data) => api.post("/auth/change-password", data),
};
