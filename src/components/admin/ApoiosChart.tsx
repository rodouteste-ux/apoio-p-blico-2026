import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { preCandidatos } from "@/data/preCandidatos";
import { cadastrosMock } from "@/data/cadastrosMock";

export function ApoiosChart() {
  const data = preCandidatos.map((c) => ({
    id: c.id,
    nome: c.nome,
    cargo: c.cargo,
    nomeCurto: c.nome.split(" ").slice(0, 2).join(" "),
    apoios: cadastrosMock.filter((cad) => cad.preCandidatos.includes(c.id)).length,
  }));

  const max = Math.max(1, ...data.map((d) => d.apoios));
  const ranked = [...data].sort((a, b) => b.apoios - a.apoios);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Apoios por pré-candidato</h2>
        <p className="text-xs text-muted-foreground">Distribuição atual de apoios registrados.</p>
      </div>

      {/* Mobile: horizontal ranking */}
      <div className="grid gap-3 sm:hidden">
        {ranked.map((d) => (
          <div key={d.id}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{d.nome}</p>
                <p className="truncate text-[11px] text-muted-foreground">{d.cargo}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {d.apoios}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(d.apoios / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: bar chart */}
      <div className="hidden h-72 w-full sm:block">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="nomeCurto"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,118,110,0.06)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.nome ?? ""}
            />
            <Bar dataKey="apoios" fill="#0f766e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
