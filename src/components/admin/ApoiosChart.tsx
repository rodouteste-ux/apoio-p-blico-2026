interface ApoiosChartProps {
  data: Array<{
    preCandidatoId?: string | null;
    nomePreCandidato: string;
    cargo: string;
    totalApoios: number;
  }>;
}

export function ApoiosChart({ data }: ApoiosChartProps) {
  const normalizedData = data.map((item, index) => ({
    id: item.preCandidatoId ?? `${item.nomePreCandidato}-${index}`,
    nome: item.nomePreCandidato,
    cargo: item.cargo,
    nomeCurto: item.nomePreCandidato.split(" ").slice(0, 2).join(" "),
    apoios: item.totalApoios,
  }));

  const max = Math.max(1, ...normalizedData.map((item) => item.apoios));
  const ranked = [...normalizedData].sort((a, b) => b.apoios - a.apoios);
  const hasData = normalizedData.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Apoios por pre-candidato</h2>
        <p className="text-xs text-muted-foreground">Distribuicao atual de apoios registrados.</p>
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Nenhum apoio registrado ainda.
        </div>
      )}

      {hasData && <div className="grid gap-3">
        {ranked.map((item) => (
          <div key={item.id}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.nome}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.cargo}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {item.apoios}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(item.apoios / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
