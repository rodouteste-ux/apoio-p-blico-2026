import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  component: Obrigado,
});

function Obrigado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
          <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
          Cadastro realizado com sucesso!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Obrigado pelo seu apoio.</p>

        <div className="mt-6 grid gap-2">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Voltar
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
