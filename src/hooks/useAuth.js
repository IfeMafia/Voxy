import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { useUserStore } from "@/store/useUserStore";

const getFriendlyErrorMessage = (err, fallback = "An unexpected error occurred") => {
  const message = typeof err === "string" ? err : err?.message;
  if (!message || message.includes("Failed to fetch") || message.includes("NetworkError") || message === "Load failed") {
    return "Network error. Please check your internet connection and try again.";
  }
  return message || fallback;
};

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

  const register = useCallback(async ({ email, password, name }) => {
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
        const rawMsg = data.error?.message || data.error || "Registration failed";
        const msg = getFriendlyErrorMessage(rawMsg, "Registration failed");
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
      const errorMsg = getFriendlyErrorMessage(err, "Registration failed");
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const login = useCallback(async ({ email, password }) => {
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
        const rawMsg = data.error?.message || data.error || "Login failed";
        const msg = getFriendlyErrorMessage(rawMsg, "Login failed");
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
      const errorMsg = getFriendlyErrorMessage(err, "Login failed");
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
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
  }, [clearUser]);

  const refreshSession = useCallback(async () => {
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
  }, [setUser, clearUser]);

  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: "Network or server error" };

      if (!data.success) {
        const rawMsg = data.error?.message || data.error || "Failed to send verification code";
        const msg = getFriendlyErrorMessage(rawMsg, "Failed to send verification code");
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      toast.success("Verification code sent to your email!");
      return { success: true, message: data.data?.message };
    } catch (err) {
      const errorMsg = getFriendlyErrorMessage(err, "Failed to send verification code");
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async ({ email, otp }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: "Network or server error" };

      if (!data.success) {
        const rawMsg = data.error?.message || data.error || "Invalid verification code";
        const msg = getFriendlyErrorMessage(rawMsg, "Invalid verification code");
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = getFriendlyErrorMessage(err, "Failed to verify code");
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async ({ email, otp, newPassword }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: "Network or server error" };

      if (!data.success) {
        const rawMsg = data.error?.message || data.error || "Failed to reset password";
        const msg = getFriendlyErrorMessage(rawMsg, "Failed to reset password");
        setError(msg);
        toast.error(msg);
        return { success: false, error: msg };
      }

      toast.success("Password reset successfully! You can now sign in.");
      return { success: true };
    } catch (err) {
      const errorMsg = getFriendlyErrorMessage(err, "Failed to reset password");
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
    setUser,
    refreshSession,
  };
};
