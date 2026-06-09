import { api } from "./api";

export const adminService = {
  // User approval
  getPendingUsers: () => api.get("/admin/users/pending"),
  approveUser: (userId) => api.put(`/admin/users/${userId}/approve`),
  rejectUser: (userId) => api.put(`/admin/users/${userId}/reject`),

  // User management
  getAllUsers: () => api.get("/admin/users"),
  changeUserRole: (userId, roleName) =>
    api.put(`/admin/users/${userId}/role`, { roleName }),
};
