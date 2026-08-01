import { api } from "./api";

export const complaintService = {
  createDepositComplaint: (payload) => api.post("/complaints/deposits", payload),
  getMyDepositComplaints: () => api.get("/complaints/deposits/mine"),
  getAdminDepositComplaints: () => api.get("/admin/complaints/deposits"),
  resolveDepositComplaint: (id, adminNote) =>
    api.put(`/admin/complaints/deposits/${id}/resolve`, { adminNote }),
  rejectDepositComplaint: (id, adminNote) =>
    api.put(`/admin/complaints/deposits/${id}/reject`, { adminNote }),
};
