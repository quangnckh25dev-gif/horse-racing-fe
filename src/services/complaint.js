import { api } from "./api";

export const complaintService = {
  createDepositComplaint: (payload) => api.post("/complaints/deposits", payload),
  getMyDepositComplaints: () => api.get("/complaints/deposits/mine"),
  getAdminDepositComplaints: () => api.get("/admin/complaints/deposits"),
  resolveDepositComplaint: (id, adminNote) =>
    api.put(`/admin/complaints/deposits/${id}/resolve`, { adminNote }),
  rejectDepositComplaint: (id, adminNote) =>
    api.put(`/admin/complaints/deposits/${id}/reject`, { adminNote }),

  createRaceComplaint: (payload) => api.post("/complaints/races", payload),
  getMyRaceComplaints: () => api.get("/complaints/races/mine"),
  getRefereeRaceComplaints: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "All") params.set("status", filters.status);
    if (filters.keyword) params.set("keyword", filters.keyword);
    const query = params.toString();
    return api.get(`/referee/complaints/races${query ? `?${query}` : ""}`);
  },
  getRefereeRaceComplaint: (id) => api.get(`/referee/complaints/races/${id}`),
  resolveRaceComplaint: (id, payload = {}) =>
    api.put(`/referee/complaints/races/${id}/resolve`, payload),
  rejectRaceComplaint: (id, payload = {}) =>
    api.put(`/referee/complaints/races/${id}/reject`, payload),
  forwardRaceComplaint: (id, payload = {}) =>
    api.put(`/referee/complaints/races/${id}/forward`, payload),
};
