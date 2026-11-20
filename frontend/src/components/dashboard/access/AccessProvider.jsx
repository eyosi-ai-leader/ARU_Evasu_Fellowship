"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMyAccess } from "@/lib/accountApi";

const AccessContext = createContext(null);

/**
 * Loads "who am I and what can I do" once for the whole dashboard, so the
 * sidebar and every page build themselves from the same answer.
 */
export function AccessProvider({ children }) {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setAccess(await getMyAccess());
    } catch (err) {
      setError(err.message || "Failed to load your access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      access,
      loading,
      error,
      reload: load,
      can: (capability) =>
        Boolean(access?.capabilities?.includes(capability)),
    }),
    [access, loading, error, load]
  );

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}

export function useAccess() {
  const context = useContext(AccessContext);

  if (!context) {
    throw new Error("useAccess must be used inside <AccessProvider>.");
  }

  return context;
}