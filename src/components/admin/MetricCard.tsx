import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug text-muted-foreground">{label}</p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
    </div>
  );
}
