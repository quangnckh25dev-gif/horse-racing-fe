import { api } from "./api";

export const entryService = {
  registerForRace: (raceId, data) => api.post(`/races/${raceId}/entries`, data),
  getEntriesByRace: (raceId) => api.get(`/races/${raceId}/entries`),
  getEntryDetail: (entryId) => api.get(`/entries/${entryId}`),
  getMyEntries: () => api.get(`/entries/mine`),
  approveEntry: (raceId, entryId, data) =>
    api.patch(`/races/${raceId}/entries/${entryId}/approve`, data),
  withdrawEntry: (raceId, entryId) =>
    api.delete(`/races/${raceId}/entries/${entryId}`),
  cancelEntry: (raceId, entryId) =>
    api.delete(`/races/${raceId}/entries/${entryId}`),
};
