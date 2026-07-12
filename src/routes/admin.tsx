import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { AdminSessionProvider } from "@/contexts/admin-session";
import { useAdminSession } from "@/hooks/use-admin-session";
import { logMeasure, startMeasure } from "@/utils/perf";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, error, retry } = useAdminSession();
  const loadStartedAt = useRef(startMeasure());

  useEffect(() => {
    if (!loading) logMeasure("[front] carregamento admin", loadStartedAt.current);
  }, [loading]);

  useEffect(() => {
    if (!loading && !session && !error) {
      void navigate({
        to: "/login",
        search: { redirect: location.pathname, reason: "auth" },
      });
    }
  }, [error, loading, location.pathname, navigate, session]);

  if (loading) {
    return (
      <AppLayout maxWidth="md">
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Validando acesso administrativo...
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout maxWidth="md">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Falha ao validar acesso administrativo</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={retry}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return (
      <AppLayout maxWidth="md">
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Redirecionando para o login...
        </div>
      </AppLayout>
    );
  }

  return (
    <AdminSessionProvider value={session}>
      <Outlet />
    </AdminSessionProvider>
  );
}
