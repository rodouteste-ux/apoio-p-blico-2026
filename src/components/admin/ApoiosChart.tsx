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
    nome: c.cargo.replace("Deputado ", "Dep. ").replace("Primeiro ", "1º ").replace("Segundo ", "2º "),
    apoios: cadastrosMock.filter((cad) => cad.preCandidatos.includes(c.id)).length,
  }));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Apoios por pré-candidato</h2>
        <p className="text-xs text-muted-foreground">Distribuição atual de apoios registrados.</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="nome"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
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
            />
            <Bar dataKey="apoios" fill="#0f766e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
