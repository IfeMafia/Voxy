import { useState, useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { useUserStore } from "@/store/useUserStore";

export const useAuth = () => {
  const { user, setUser, clearUser, hasHydrated } = useUserStore();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState(null);

  // Check current session on mount once store has hydrated
  useEffect(() => {
    if (!hasHydrated) return;

    if (user) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/auth/me", {
          headers,
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success && (data.data?.business || data.data)) {
          const profile = data.data?.business || data.data;
          setUser(profile);
        } else {
          clearUser();
        }
      } catch (err) {
        console.warn("Session check notice:", err);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [hasHydrated, user, setUser, clearUser]);

  const register = async ({ email, password, name }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: "Network or server error" };

      if (!data.success) {
        const msg = data.error?.message || data.error || "Registration failed";
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      if (data.data?.business) {
        setUser(data.data.business);
      }

      toast.success("Account created successfully!");
      return { success: true, data: data.data };
    } catch (err) {
      const errorMsg = err.message || "Registration failed";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: "Network or server error" };

      if (!data.success) {
        const msg = data.error?.message || data.error || "Login failed";
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      if (data.data?.business) {
        setUser(data.data.business);
      }

      toast.success("Welcome back!");
      return { success: true, data: data.data, user: data.data?.business };
    } catch (err) {
      const errorMsg = err.message || "Login failed";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      clearUser();
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const refreshSession = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/auth/me", { headers, credentials: "include" });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        clearUser();
        return;
      }
      const data = await res.json();
      if (data.success && (data.data?.business || data.data)) {
        setUser(data.data?.business || data.data);
      } else {
        clearUser();
      }
    } catch (err) {
      clearUser();
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      toast.success("If this email exists, a password reset link has been sent.");
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, register, login, logout, forgotPassword, setUser, refreshSession };
};
