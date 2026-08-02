import { api } from "./api";

export const horseService = {
  getMyHorses: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.status && filters.status !== "All") params.set("status", filters.status);
    const query = params.toString();
    return api.get(`/horses${query ? `?${query}` : ""}`);
  },
  getById: (id) => api.get(`/horses/${id}`),
  create: (data) => api.post("/horses", data),
  update: (id, data) => api.put(`/horses/${id}`, data),
  archive: (id) => api.delete(`/horses/${id}`),
  changeStatus: (id, status) => api.patch(`/horses/${id}/status`, { status }),

  getHealthRecords: (id) => api.get(`/horses/${id}/health`),
  addHealthRecord: (id, data) => api.post(`/horses/${id}/health`, data),
  reviewHealthRecord: (horseId, recordId, data) => api.patch(`/horses/${horseId}/health-records/${recordId}/review`, data),

  getStats: (id) => api.get(`/horses/${id}/stats`),
};
