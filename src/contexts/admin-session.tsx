import { createContext, useContext } from "react";

import type { AdminSession } from "@/types/auth";

const AdminSessionContext = createContext<AdminSession | null>(null);

export const AdminSessionProvider = AdminSessionContext.Provider;

export function useRequiredAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session?.accessToken) {
    throw new Error("Sessao administrativa nao inicializada.");
  }

  return session;
}
