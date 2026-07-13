import { Check } from "lucide-react";
import type { PreCandidato } from "@/types/candidato";

interface CandidateCardProps {
  candidato: PreCandidato;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function CandidateCard({ candidato, selected, onToggle }: CandidateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(candidato.id)}
      aria-pressed={selected}
      className={`group flex min-h-16 w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
        selected
          ? "border-primary bg-accent shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
          : "border-border bg-white hover:border-primary/40 hover:bg-accent/40"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-white text-transparent group-hover:border-primary/50"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-foreground">
          {candidato.nome}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{candidato.cargo}</p>
      </div>
    </button>
  );
}
