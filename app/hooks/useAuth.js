import { useState } from "react";
import api from "@/lib/axios";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", userData);
      
      // Assuming your backend responds with the user and/or token
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return { user, loading, error, register, login, logout, setUser };
};
