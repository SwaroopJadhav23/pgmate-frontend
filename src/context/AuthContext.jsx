import { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export const AuthContext = createContext(null);

const getProfileCompletion = (profile) => {
  if (!profile) return 0;
  const fields = [
    profile.name,
    profile.email,
    profile.city,
    profile.photoUrl,
    profile.idProofUrl,
    profile.defaultPoliceFormType,
  ];
  return (fields.filter(Boolean).length / fields.length) * 100;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [owner, setOwner] = useState(null);

  // Profile completion gate — only relevant for OWNER role
  const [ownerProfileComplete, setOwnerProfileComplete] = useState(null); // null = unknown/loading
  const [ownerProfileLoading, setOwnerProfileLoading] = useState(false);

  // Subscription expiry gate — shared between Sidebar (popup) and dashboard (click redirect)
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Re-checks subscription status from server and updates the gate both ways
  // (true -> expired, false -> active). Call this right after a renew/payment
  // succeeds so owner gets access back WITHOUT logout/login.
  const refreshSubscriptionStatus = useCallback(() => {
    if (!token || role !== "OWNER") return Promise.resolve();
    return api
      .get("/owner/subscription/summary")
      .then((res) => {
        const data = res.data || {};
        const expired = Boolean(data.expired) || !data.active;
        setSubscriptionExpired(expired);
        return !expired;
      })
      .catch(() => false);
  }, [token, role]);

  const fetchOwnerProfile = useCallback(() => {
    if (!token || role !== "OWNER") return;
    setOwnerProfileLoading(true);
    api
      .get("/owner/profile")
      .then((res) => {
        const data = res.data || null;
        setOwner(data);
        setOwnerProfileComplete(getProfileCompletion(data) >= 100);
      })
      .catch(() => {
        // On error, don't block — assume complete so they aren't stuck
        setOwnerProfileComplete(true);
      })
      .finally(() => setOwnerProfileLoading(false));
  }, [token, role]);

  // Run once on mount / when auth changes
  useEffect(() => {
    if (role === "OWNER" && token) {
      fetchOwnerProfile();
    } else {
      // Not an owner — reset to neutral
      setOwnerProfileComplete(null);
      setOwnerProfileLoading(false);
    }
  }, [role, token, fetchOwnerProfile]);

  const login = (newToken, newRole) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    setToken(newToken);
    setRole(newRole);
    // Reset completion so it re-fetches for the new session
    setOwnerProfileComplete(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setOwner(null);
    setOwnerProfileComplete(null);
    setSubscriptionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        owner,
        setOwner,
        isAuthenticated: Boolean(token),
        ownerProfileComplete,
        ownerProfileLoading,
        refreshOwnerProfile: fetchOwnerProfile, // called after profile save
        subscriptionExpired,
        setSubscriptionExpired,
        refreshSubscriptionStatus,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};