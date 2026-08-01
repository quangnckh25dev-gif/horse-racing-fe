import { api } from "./api";

// Bo qua param rong -> chi gui filter co gia tri (tranh ?role=&keyword=)
const qs = (params) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "All")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return s ? `?${s}` : "";
};

export const adminService = {
  // User approval. BE ho tro filter role + search keyword phia server (FE-05).
  getPendingUsers: (role, keyword) =>
    api.get(`/admin/users/pending${qs({ role, keyword })}`),
  approveUser: (userId, adminId) =>
    api.put(`/admin/users/${userId}/approve?adminId=${adminId}`),
  // reject kem ly do (BE: @RequestParam reason)
  rejectUser: (userId, adminId, reason) =>
    api.put(`/admin/users/${userId}/reject${qs({ adminId, reason })}`),

  // Dashboard stats from the system dashboard view.
  getDashboardStats: () => api.get("/admin/dashboard"),

  // User management. BE ho tro filter role + status + search keyword (FE-06).
  getAllUsers: (role, status, keyword) =>
    api.get(`/admin/users${qs({ role, status, keyword })}`),
  changeUserRole: (userId, roleName, adminId) =>
    api.put(`/admin/users/${userId}/role?adminId=${adminId}`, { roleName }),

  // Audit logs (GET /api/admin/audit-logs)
  getAuditLogs: () => api.get("/admin/audit-logs"),

  // System configs (GET /api/admin/configs, PUT /api/admin/configs/{configKey})
  getConfigs: () => api.get("/admin/configs"),
  updateConfig: (configKey, value) =>
    api.put(`/admin/configs/${configKey}`, { value }),

  // Deposit requests
  getDepositRequests: () => api.get("/admin/deposit-requests"),
  approveDepositRequest: (id) => api.put(`/admin/deposit-requests/${id}/approve`),
  rejectDepositRequest: (id, adminNote) =>
    api.put(`/admin/deposit-requests/${id}/reject`, { adminNote }),
};
