import { useEffect, useState } from "react";

import type { AdminSession } from "@/types/auth";
import { getAdminSession } from "@/services/authService";

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setLoading(true);
      setError(null);

      try {
        const currentSession = await getAdminSession();
        if (!active) return;
        setSession(currentSession);
      } catch {
        if (!active) return;
        setError("Nao foi possivel validar sua sessao administrativa.");
        setSession(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [retryKey]);

  return {
    session,
    loading,
    error,
    setSession,
    retry: () => setRetryKey((current) => current + 1),
  };
}
