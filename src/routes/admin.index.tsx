import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, TrendingUp, MapPin, ThumbsUp, UserCheck } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { ApoiosChart } from "@/components/admin/ApoiosChart";
import { CadastrosTable } from "@/components/admin/CadastrosTable";
import { CadastroMobileCard } from "@/components/admin/CadastroMobileCard";
import { cadastrosMock } from "@/data/cadastrosMock";
import { responsaveis } from "@/data/responsaveis";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const total = cadastrosMock.length;
  const hoje = 0;
  const cidades = new Set(cadastrosMock.map((c) => c.cidade)).size;
  const apoios = cadastrosMock.reduce((sum, c) => sum + c.preCandidatos.length, 0);
  const responsaveisAtivos = responsaveis.filter((r) => r.ativo).length;

  const ultimos = cadastrosMock.slice(0, 5);

  return (
    <AppLayout maxWidth="xl">
      <AdminHeader />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <MetricCard label="Total de cadastros" value={total} icon={Users} />
        <MetricCard label="Cadastros hoje" value={hoje} icon={TrendingUp} />
        <MetricCard label="Cidades" value={cidades} icon={MapPin} />
        <MetricCard label="Apoios registrados" value={apoios} icon={ThumbsUp} />
        <MetricCard label="Responsáveis ativos" value={responsaveisAtivos} icon={UserCheck} />
      </section>

      <div className="mt-6">
        <ApoiosChart />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Últimos cadastros</h2>
          <Link
            to="/admin/cadastros"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Ver todos
          </Link>
        </div>

        <div className="hidden sm:block">
          <CadastrosTable cadastros={ultimos} compact />
        </div>
        <div className="grid gap-3 sm:hidden">
          {ultimos.map((c) => (
            <CadastroMobileCard key={c.id} cadastro={c} />
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
