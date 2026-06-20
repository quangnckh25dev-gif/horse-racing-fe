import { api } from "./api";

export const raceResultService = {
  // ── Results ───────────────────────────────────────────────
  getResults: (raceId) => api.get(`/races/${raceId}/results`),
  createResults: (raceId, data) => api.post(`/races/${raceId}/results`, data),
  updateResults: (raceId, data) => api.put(`/races/${raceId}/results`, data),

  // ── Violations ────────────────────────────────────────────
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
};
