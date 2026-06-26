import { api } from "./api";

export const spectatorService = {
  // ── Public race schedule ──────────────────────────────────
  getRaces: () => api.get("/races"),
  getRaceById: (raceId) => api.get(`/races/${raceId}`),
  getRaceEntries: (raceId) => api.get(`/races/${raceId}/entries`),
  getRaceResults: (raceId) => api.get(`/races/${raceId}/results`),

  // ── Race schedule detail ──────────────────────────────────
  getRaceSchedule: (raceId) => api.get(`/races/${raceId}/schedule`),

  // ── Predictions ───────────────────────────────────────────
  makePrediction: (raceId, data) =>
    api.post(`/races/${raceId}/predictions`, data),
  updatePrediction: (raceId, data) =>
    api.put(`/races/${raceId}/predictions`, data),
  getPredictionHistory: () => api.get("/predictions/history"),
};
