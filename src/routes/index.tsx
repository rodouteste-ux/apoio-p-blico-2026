import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { PUBLIC_CADASTRO_PATH } from "@/config/campaign";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Sistema
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pre-campanha 2026
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastro de Apoio</p>

          <div className="mt-6 grid gap-3">
            <Link
              to={PUBLIC_CADASTRO_PATH}
              className="inline-flex h-12 items-center justify-between gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
            >
              Iniciar cadastro
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin"
              className="inline-flex h-12 items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
            >
              Painel administrativo
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
          Uso interno · Equipe de campanha
        </p>
      </div>
    </div>
  );
}
