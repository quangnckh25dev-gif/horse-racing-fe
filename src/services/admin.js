import { api } from "./api";

export const adminService = {
  // User approval — adminId là userId của admin đang đăng nhập
  getPendingUsers: () => api.get("/admin/users/pending"),
  approveUser: (userId, adminId) =>
    api.put(`/admin/users/${userId}/approve?adminId=${adminId}`),
  rejectUser: (userId, adminId) =>
    api.put(`/admin/users/${userId}/reject?adminId=${adminId}`),

  // Dashboard stats (từ vw_SystemDashboard)
  getDashboardStats: () => api.get("/admin/dashboard"),

  // User management
  getAllUsers: () => api.get("/admin/users"),
  changeUserRole: (userId, roleName, adminId) =>
    api.put(`/admin/users/${userId}/role?adminId=${adminId}`, { roleName }),
};
