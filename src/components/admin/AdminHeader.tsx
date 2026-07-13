import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, LogOut, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAdmin } from "@/services/authService";

export function AdminHeader() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOutAdmin();
    await navigate({ to: "/login", search: { redirect: "/admin", reason: "" } });
  }

  return (
    <header className="mb-6">
      <div className="grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Visao geral dos cadastros de apoio.
          </p>
        </div>
        <div className="grid w-full shrink-0 gap-2 sm:w-auto sm:grid-flow-col">
          <Link
            to="/admin/cadastros"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
          >
            <LayoutGrid className="h-4 w-4" />
            Ver cadastros
          </Link>
          <Link
            to="/admin/pre-candidatos"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" />
            Gerenciar pre-candidatos
          </Link>
          <Button type="button" variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
