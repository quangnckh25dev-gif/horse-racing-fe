import { api } from "./api";

export const leaderboardService = {
  getTournamentJockeyLeaderboard: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/leaderboard/jockeys`),
  getTournamentHorseLeaderboard: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/leaderboard/horses`),
  getGlobalJockeyLeaderboard: () => api.get(`/leaderboard/jockeys`),
  getGlobalHorseLeaderboard: () => api.get(`/leaderboard/horses`),
};
