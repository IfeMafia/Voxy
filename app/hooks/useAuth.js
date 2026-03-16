"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Check current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Session fetch failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
      
      if (!data.success) throw new Error(data.error || 'Registration failed');
      
      setUser(data.user);
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

      if (!data.success) throw new Error(data.error || 'Login failed');

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
      setUser(null);
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
    } catch (err) {
      setUser(null);
    }
  };

  return { user, loading, error, register, login, logout, setUser, refreshSession };
};
