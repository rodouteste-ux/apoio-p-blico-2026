import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ListChecks,
  MapPin,
  Settings2,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { ApoiosChart } from "@/components/admin/ApoiosChart";
import { CadastroMobileCard } from "@/components/admin/CadastroMobileCard";
import { CadastrosTable } from "@/components/admin/CadastrosTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { buscarDashboard } from "@/services/cadastroService";
import type { DashboardMetric } from "@/types/cadastro";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardMetric | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setError(null);

      try {
        const data = await buscarDashboard();
        if (!active) return;
        setDashboard(data);
      } catch {
        if (!active) return;
        setError("Nao foi possivel carregar os dados do painel.");
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppLayout maxWidth="xl">
      <AdminHeader />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-7">
        <MetricCard label="Total de cadastros" value={dashboard?.totalCadastros ?? "—"} icon={Users} />
        <MetricCard label="Cadastros hoje" value={dashboard?.cadastrosHoje ?? "—"} icon={TrendingUp} />
        <MetricCard label="Cidades" value={dashboard?.totalCidades ?? "—"} icon={MapPin} />
        <MetricCard label="Apoios registrados" value={dashboard?.totalApoios ?? "—"} icon={ThumbsUp} />
        <MetricCard label="Responsaveis ativos" value={dashboard?.responsaveisAtivos ?? "—"} icon={UserCheck} />
        <MetricCard
          label="Pre-candidatos ativos"
          value={dashboard?.totalPreCandidatosAtivos ?? "—"}
          icon={ListChecks}
        />
        <MetricCard
          label="Pre-candidatos inativos"
          value={dashboard?.totalPreCandidatosInativos ?? "—"}
          icon={Settings2}
        />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <QuickLinkCard
          to="/admin/cadastros"
          title="Ver cadastros"
          description="Acompanhe a lista completa com busca, filtros e paginacao."
        />
        <QuickLinkCard
          to="/admin/pre-candidatos"
          title="Gerenciar pre-candidatos"
          description="Cadastre, edite, ordene e controle quem aparece no formulario."
        />
      </section>

      <div className="mt-6">
        {dashboard ? (
          <ApoiosChart data={dashboard.apoiosPorPreCandidato} />
        ) : (
          <PanelMessage
            title={error ? "Falha ao carregar ranking" : "Carregando ranking"}
            description={error ?? "Estamos preparando a distribuicao dos apoios por pre-candidato."}
          />
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Ultimos cadastros</h2>
          <Link
            to="/admin/cadastros"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Ver todos
          </Link>
        </div>

        {!dashboard && (
          <PanelMessage
            title={error ? "Falha ao carregar cadastros" : "Carregando cadastros"}
            description={error ?? "Buscando os registros mais recentes para preencher o painel."}
          />
        )}

        {dashboard && dashboard.ultimosCadastros.length === 0 && (
          <PanelMessage
            title="Nenhum cadastro ainda"
            description="Assim que os apoios forem enviados, eles aparecerao aqui."
          />
        )}

        {dashboard && dashboard.ultimosCadastros.length > 0 && (
          <>
            <div className="hidden sm:block">
              <CadastrosTable cadastros={dashboard.ultimosCadastros} compact />
            </div>
            <div className="grid gap-3 sm:hidden">
              {dashboard.ultimosCadastros.map((cadastro) => (
                <CadastroMobileCard key={cadastro.id} cadastro={cadastro} />
              ))}
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}

function PanelMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickLinkCard({
  to,
  title,
  description,
}: {
  to: "/admin/cadastros" | "/admin/pre-candidatos";
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:border-primary/40 hover:bg-accent/40"
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
