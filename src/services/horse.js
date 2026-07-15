import { api } from "./api";

export const horseService = {
  // ── My horses (HorseOwner) ────────────────────────────────
  getMyHorses: () => api.get("/horses"),
  getById: (id) => api.get(`/horses/${id}`),
  create: (data) => api.post("/horses", data),
  update: (id, data) => api.put(`/horses/${id}`, data),
  // BE không có DELETE ngựa (giữ lịch sử đua). Ngừng thi đấu = đổi HealthStatus (do BTC cập nhật).
  changeStatus: (id, status) => api.patch(`/horses/${id}/status`, { status }),

  // ── Health records ────────────────────────────────────────
  getHealthRecords: (id) => api.get(`/horses/${id}/health`),
  addHealthRecord: (id, data) => api.post(`/horses/${id}/health`, data),

  // ── Stats (GET /api/horses/{horseId}/stats) ───────────────
  getStats: (id) => api.get(`/horses/${id}/stats`),
};
