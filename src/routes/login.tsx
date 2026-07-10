import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { signInAdmin } from "@/services/authService";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signInAdmin(email, password);
      await navigate({ to: search.redirect || "/admin" });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(
        message || "Nao foi possivel entrar. Verifique suas credenciais e permissao de acesso.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout maxWidth="sm">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Acesso administrativo
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
