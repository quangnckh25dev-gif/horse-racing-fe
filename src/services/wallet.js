import { api } from "./api";

export const walletService = {
  getMyWallet: () => api.get("/wallets/me"),
  createDepositRequest: ({ amount, paymentMethod }) =>
    api.post("/wallets/deposit-requests", { amount, paymentMethod }),
  deposit: (amount) => api.post("/wallets/deposit-requests", { amount, paymentMethod: "BANK" }),
  getMyDepositRequests: () => api.get("/wallets/deposit-requests/mine"),
  getTransactions: () => api.get("/wallets/transactions"),
};
