import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, loginUser as apiLogin, logoutUser as apiLogout } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      
      if (storedToken) {
        try {
          const response = await getUserProfile();
          setUser(response.data?.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login handler
  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      const newToken = response.data?.data?.accessToken;
      const userData = response.data?.data?.user;
      
      if (newToken && userData) {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("token", newToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};