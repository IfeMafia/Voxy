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
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          clearUser();
        }
      } catch (err) {
        console.error('Session fetch failed:', err);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [hasHydrated, user, setUser, clearUser]);

  const register = async ({ email, password, name, role = 'customer' }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Registration failed');
        toast.error(data.error || 'Registration failed');
        return data; 
      }
      
      toast.success("Account created successfully!");
      return data;
    } catch (err) {
      const errorMsg = err.message || "Registration failed";
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        if (!data.requiresVerification) {
          toast.error(data.error || 'Login failed');
        }
        return data;
      }

      setUser(data.user);
      toast.success("Welcome back!");
      return data;
    } catch (err) {
      const errorMsg = err.message || "Login failed";
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      clearUser();
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) setUser(data.user);
      else clearUser();
    } catch (err) {
      clearUser();
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send reset link');
      
      toast.success("Reset link sent successfully!");
      return data;
    } catch (err) {
      const errorMsg = err.message || "Failed to send reset link";
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, register, login, logout, forgotPassword, setUser, refreshSession };
};
