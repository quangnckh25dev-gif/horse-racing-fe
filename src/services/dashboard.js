import { api } from "./api";

export const dashboardService = {
  getSharedDashboard: () => api.get("/dashboard"),
};
