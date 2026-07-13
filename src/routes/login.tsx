import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { prefetchAdminDashboard } from "@/services/cadastroService";
import { signInAdmin } from "@/services/authService";
import { logMeasure, startMeasure } from "@/utils/perf";

const searchSchema = {
  parse: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/admin",
    reason: typeof search.reason === "string" ? search.reason : "",
  }),
};

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema.parse,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = startMeasure();
    requestAnimationFrame(() => logMeasure("[front] carregamento login", start));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const start = startMeasure();
    setSubmitting(true);
    setError(null);

    try {
      const session = await signInAdmin(email, password);
      prefetchAdminDashboard(session.accessToken);
      await navigate({ to: search.redirect || "/admin" });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(
        message || "Nao foi possivel entrar. Verifique suas credenciais e permissao de acesso.",
      );
    } finally {
      logMeasure("[front] login admin", start);
      setSubmitting(false);
    }
  }

  return (
    <AppLayout maxWidth="sm">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Admin</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          Acesso administrativo
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Entre com seu usuario do Supabase Auth para acessar o painel.
        </p>

        {search.reason === "denied" && (
          <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Usuario sem permissao para acessar o painel administrativo.
          </p>
        )}

        {search.reason === "auth" && (
          <p className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Faça login para continuar no painel administrativo.
          </p>
        )}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 rounded-lg border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="admin@exemplo.com"
              required
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 rounded-lg border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Sua senha"
              required
            />
          </label>

          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
