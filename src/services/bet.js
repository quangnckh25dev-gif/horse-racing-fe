import { api } from "./api";

export const betService = {
  getBetOptions: (raceId) => api.get(`/races/${raceId}/bet-options`),
  placeBet: (raceId, data) => api.post(`/races/${raceId}/bets`, data),
  getMyBetByRace: (raceId) => api.get(`/races/${raceId}/bets`),
  getBetHistory: () => api.get("/bets/history"),
};
