import { api } from "./api";

export const spectatorService = {
  // ── Public race schedule ──────────────────────────────────
  getRaces: () => api.get("/races"),
  getRaceById: (raceId) => api.get(`/races/${raceId}`),
  getRaceEntries: (raceId) => api.get(`/races/${raceId}/entries`),
  getRaceResults: (raceId) => api.get(`/races/${raceId}/results`),

  // ── Race schedule detail ──────────────────────────────────
  getRaceSchedule: (raceId) => api.get(`/races/${raceId}/schedule`),

  // ⚠️ Prediction đã BỎ — Prediction = Bet (xem services/bet.js)
};
