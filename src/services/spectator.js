import { api } from "./api";

export const spectatorService = {
  // Public race schedule.
  getRaces: () => api.get("/races"),
  getAssignedRaces: (status) =>
    api.get(status && status !== "all" ? `/races/assigned?status=${encodeURIComponent(status)}` : "/races/assigned"),
  getRaceById: (raceId) => api.get(`/races/${raceId}`),
  getRaceEntries: (raceId) => api.get(`/races/${raceId}/entries`),
  getRaceResults: (raceId) => api.get(`/races/${raceId}/results`),

  // Race schedule detail.
  getRaceSchedule: (raceId) => api.get(`/races/${raceId}/schedule`),

  // Prediction was replaced by Bet. See services/bet.js.
};
