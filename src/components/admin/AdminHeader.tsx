import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="mb-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao geral dos cadastros de apoio.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            to="/admin/cadastros"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
          >
            <LayoutGrid className="h-4 w-4" />
            Ver cadastros
          </Link>
        </div>
      </div>
    </header>
  );
}
