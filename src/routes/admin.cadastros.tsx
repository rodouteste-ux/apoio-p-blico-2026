import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CadastroMobileCard } from "@/components/admin/CadastroMobileCard";
import { CadastrosTable } from "@/components/admin/CadastrosTable";
import { AppLayout } from "@/components/layout/AppLayout";
import { buscarCadastros } from "@/services/cadastroService";
import type { Cadastro } from "@/types/cadastro";

export const Route = createFileRoute("/admin/cadastros")({
  component: AdminCadastros,
});

function AdminCadastros() {
  const [query, setQuery] = useState("");
  const [cidadeFilter, setCidadeFilter] = useState<string>("todas");
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await buscarCadastros({
          search: query,
          cidade: cidadeFilter,
          page: 1,
          limit: 50,
        });

        if (!active) return;

        setCadastros(response.data);
        setTotal(response.total);
        setError(null);
      } catch {
        if (!active) return;
        setError("Nao foi possivel carregar os cadastros.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cidadeFilter, query]);

  const cidades = useMemo(
    () => ["todas", ...Array.from(new Set(cadastros.map((cadastro) => cadastro.cidade)))],
    [cadastros],
  );

  return (
    <AppLayout maxWidth="xl">
      <div className="mb-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
      </div>

      <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cadastros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Carregando registros..." : `${total} ${total === 1 ? "registro" : "registros"}`}
          </p>
        </div>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou WhatsApp"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={cidadeFilter}
          onChange={(event) => setCidadeFilter(event.target.value)}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {cidades.map((cidade) => (
            <option key={cidade} value={cidade}>
              {cidade === "todas" ? "Todas as cidades" : cidade}
            </option>
          ))}
        </select>
      </div>

      {error && <EmptyState description={error} />}

      {!error && loading && <EmptyState description="Buscando os cadastros mais recentes." />}

      {!error && !loading && (
        <>
          <div className="hidden sm:block">
            <CadastrosTable cadastros={cadastros} />
          </div>
          <div className="grid gap-3 sm:hidden">
            {cadastros.map((cadastro) => (
              <CadastroMobileCard key={cadastro.id} cadastro={cadastro} />
            ))}
            {cadastros.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Nenhum cadastro encontrado.
              </p>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function EmptyState({ description }: { description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {description}
    </div>
  );
}
