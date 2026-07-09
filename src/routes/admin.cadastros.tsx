import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CadastrosTable } from "@/components/admin/CadastrosTable";
import { CadastroMobileCard } from "@/components/admin/CadastroMobileCard";
import { cadastrosMock } from "@/data/cadastrosMock";

export const Route = createFileRoute("/admin/cadastros")({
  component: AdminCadastros,
});

function AdminCadastros() {
  const [query, setQuery] = useState("");
  const [cidadeFilter, setCidadeFilter] = useState<string>("todas");

  const cidades = useMemo(
    () => ["todas", ...Array.from(new Set(cadastrosMock.map((c) => c.cidade)))],
    [],
  );

  const filtered = useMemo(() => {
    return cadastrosMock.filter((c) => {
      const matchesQuery =
        !query ||
        c.nome.toLowerCase().includes(query.toLowerCase()) ||
        c.whatsapp.includes(query);
      const matchesCidade = cidadeFilter === "todas" || c.cidade === cidadeFilter;
      return matchesQuery && matchesCidade;
    });
  }, [query, cidadeFilter]);

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
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </p>
        </div>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <select
          value={cidadeFilter}
          onChange={(e) => setCidadeFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c === "todas" ? "Todas as cidades" : c}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block">
        <CadastrosTable cadastros={filtered} />
      </div>
      <div className="grid gap-3 sm:hidden">
        {filtered.map((c) => (
          <CadastroMobileCard key={c.id} cadastro={c} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum cadastro encontrado.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
