import { MessageCircle, Eye } from "lucide-react";
import type { Cadastro } from "@/types/cadastro";
import {
  formatCPFMasked,
  formatDate,
  formatWhatsapp,
  whatsappLink,
} from "@/utils/formatters";

export function CadastroMobileCard({ cadastro }: { cadastro: Cadastro }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{cadastro.nome}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {cadastro.cidade} · {cadastro.bairro}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-primary">
          {formatDate(cadastro.criadoEm)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="mt-0.5 text-foreground">{formatWhatsapp(cadastro.whatsapp)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CPF</dt>
          <dd className="mt-0.5 font-mono text-foreground">{formatCPFMasked(cadastro.cpf)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <a
          href={whatsappLink(cadastro.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver detalhes
        </button>
      </div>
    </article>
  );
}
