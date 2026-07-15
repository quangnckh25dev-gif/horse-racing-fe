import { api } from "./api";

export const raceResultService = {
  // ── Results ───────────────────────────────────────────────
  getResults: (raceId) => api.get(`/races/${raceId}/results`),
  // POST creates a single result entry
  createResults: (raceId, data) => api.post(`/races/${raceId}/results`, data),
  // PUT updates a specific result by resultId (contract: PUT /races/{raceId}/results/{resultId})
  updateResult: (raceId, resultId, data) =>
    api.put(`/races/${raceId}/results/${resultId}`, data),

  // ── Violations ────────────────────────────────────────────
  getViolationOptions: () => api.get("/violations/options"),
  getViolations: (raceId) => api.get(`/races/${raceId}/violations`),
  addViolation: (raceId, data) => api.post(`/races/${raceId}/violations`, data),
  updateViolation: (violationId, data) =>
    api.put(`/violations/${violationId}`, data),
  deleteViolation: (violationId) =>
    api.delete(`/violations/${violationId}`),

  // ── Minutes (biên bản) ────────────────────────────────────
  getMinutes: (raceId) => api.get(`/races/${raceId}/minutes`),
  createMinutes: (raceId, data) => api.post(`/races/${raceId}/minutes`, data),
  updateMinutes: (raceId, data) => api.put(`/races/${raceId}/minutes`, data),
  // Gửi biên bản cho toàn bộ Owner (sp_SendMinutesToOwners)
  sendMinutes: (raceId) => api.post(`/races/${raceId}/minutes/send`, {}),
  // Bàn giao kết quả + biên bản cho Ban tổ chức duyệt
  handoff: (raceId) => api.post(`/races/${raceId}/minutes/handoff`, {}),

  // ── Điều khiển trạng thái đua (Trọng tài là người DUY NHẤT đổi) ──
  // PATCH /races/{id}/status: Scheduled/RegistrationOpen → Ongoing → Finished
  changeRaceStatus: (raceId, status) =>
    api.patch(`/races/${raceId}/status`, { status }),
};
