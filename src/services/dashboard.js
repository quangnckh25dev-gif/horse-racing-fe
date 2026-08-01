import { api } from "./api";

export const dashboardService = {
  getDashboard: () => api.get("/dashboard"),
  getRoleDashboard: (role) => api.get(`/dashboard/${role}`),
  getSharedDashboard: () => api.get("/dashboard"),
};
