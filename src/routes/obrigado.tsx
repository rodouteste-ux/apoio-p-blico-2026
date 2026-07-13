import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  component: Obrigado,
});

function Obrigado() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 text-center sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent">
          <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          Cadastro realizado com sucesso!
        </h1>
        <p className="mt-2 text-base text-muted-foreground">Obrigado pelo seu apoio.</p>

        <div className="mt-6 grid gap-2">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Voltar
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-white px-4 py-3 text-base font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
          >
            Novo cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
