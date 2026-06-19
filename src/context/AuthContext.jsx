import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, remember = false, refreshToken = null) => {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.clear();
    sessionStorage.clear();
    storage.setItem("accessToken", accessToken);
    if (refreshToken) storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // ignore — proceed with local logout regardless
      }
    }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.roleName || null,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
