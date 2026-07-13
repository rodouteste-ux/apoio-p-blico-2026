import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CadastroMobileCard } from "@/components/admin/CadastroMobileCard";
import { CadastrosTable } from "@/components/admin/CadastrosTable";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useRequiredAdminSession } from "@/contexts/admin-session";
import { cidades as cidadesOptions } from "@/data/cidades";
import { ApiError } from "@/services/api";
import { signOutAdmin } from "@/services/authService";
import { getAdminCadastros } from "@/services/cadastroService";
import type { Cadastro } from "@/types/cadastro";
import { logMeasure, startMeasure } from "@/utils/perf";

export const Route = createFileRoute("/admin/cadastros")({
  component: AdminCadastros,
});

function AdminCadastros() {
  const navigate = useNavigate();
  const adminSession = useRequiredAdminSession();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cidadeFilter, setCidadeFilter] = useState<string>("todas");
  const [liderancaFilter, setLiderancaFilter] = useState<string>("todas");
  const [liderancas, setLiderancas] = useState<Array<{ nome: string; slug: string }>>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = query.trim();
      setDebouncedQuery((current) => (current === nextQuery ? current : nextQuery));
      setPage((current) => (current === 1 ? current : 1));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  const queryKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(page));
    searchParams.set("limit", "20");
    if (debouncedQuery) searchParams.set("search", debouncedQuery);
    if (cidadeFilter !== "todas") searchParams.set("cidade", cidadeFilter);
    if (liderancaFilter !== "todas") searchParams.set("lideranca", liderancaFilter);
    return searchParams.toString();
  }, [cidadeFilter, debouncedQuery, liderancaFilter, page]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const start = startMeasure();

    async function loadCadastros() {
      try {
        if (!adminSession.accessToken) {
          throw new ApiError("Sessao expirada. Faca login novamente.", 401);
        }

        const response = await getAdminCadastros(adminSession.accessToken, {
          search: debouncedQuery,
          cidade: cidadeFilter,
          lideranca: liderancaFilter,
          page,
          limit: 20,
        });

        if (!active) return;

        setCadastros(response.data);
        setLiderancas(response.liderancas);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          await signOutAdmin();
          await navigate({ to: "/login", search: { redirect: "/admin/cadastros", reason: "auth" } });
          return;
        }
        setError("Nao foi possivel carregar os cadastros.");
      } finally {
        if (active) {
          setLoading(false);
          logMeasure("[front] carregamento lista cadastros", start);
        }
      }
    }

    void loadCadastros();

    return () => {
      active = false;
    };
  }, [adminSession.accessToken, navigate, queryKey, retryKey]);

  const cidades = useMemo(
    () => ["todas", ...cidadesOptions],
    [],
  );

  const rankingLiderancas = useMemo(() => {
    const ranking = new Map<string, { nome: string; total: number }>();

    for (const cadastro of cadastros) {
      const nome = cadastro.liderancaNome || "Sem lideranca";
      const current = ranking.get(nome);
      if (current) {
        current.total += 1;
      } else {
        ranking.set(nome, { nome, total: 1 });
      }
    }

    return Array.from(ranking.values()).sort((a, b) => b.total - a.total);
  }, [cadastros]);

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

      <header className="mb-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            Cadastros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Carregando registros..." : `${total} ${total === 1 ? "registro" : "registros"}`}
          </p>
        </div>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px_240px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou WhatsApp"
            className="min-h-12 w-full rounded-lg border border-border bg-white py-3 pl-10 pr-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={cidadeFilter}
          onChange={(event) => {
            setCidadeFilter(event.target.value);
            setPage(1);
          }}
          className="min-h-12 rounded-lg border border-border bg-white px-3 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {cidades.map((cidade) => (
            <option key={cidade} value={cidade}>
              {cidade === "todas" ? "Todas as cidades" : cidade}
            </option>
          ))}
        </select>
        <select
          value={liderancaFilter}
          onChange={(event) => {
            setLiderancaFilter(event.target.value);
            setPage(1);
          }}
          className="min-h-12 rounded-lg border border-border bg-white px-3 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <option value="todas">Todas as liderancas</option>
          {liderancas.map((lideranca) => (
            <option key={lideranca.slug} value={lideranca.slug}>
              {lideranca.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Total de cadastros filtrados: <span className="font-semibold text-foreground">{total}</span>
        </p>
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Cadastros por lideranca</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {rankingLiderancas.length === 0 && (
              <p className="text-muted-foreground">Nenhum cadastro carregado.</p>
            )}
            {rankingLiderancas.map((item) => (
              <div key={item.nome} className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-muted-foreground">{item.nome}</span>
                <span className="font-semibold text-foreground">{item.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {error && (
        <>
          <EmptyState description={error} />
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="outline" onClick={() => setRetryKey((current) => current + 1)}>
              Tentar novamente
            </Button>
          </div>
        </>
      )}

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

      {!error && !loading && totalPages > 1 && (
        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Proxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
