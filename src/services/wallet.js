import { api } from "./api";

export const walletService = {
  getMyWallet: () => api.get("/wallets/me"),
  deposit: (amount) => api.post("/wallets/deposit", { amount }),
  getTransactions: () => api.get("/wallets/transactions"),
};
