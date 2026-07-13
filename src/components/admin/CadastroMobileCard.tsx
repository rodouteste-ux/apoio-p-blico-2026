import { MessageCircle } from "lucide-react";

import type { Cadastro } from "@/types/cadastro";
import { formatDate, whatsappLink } from "@/utils/formatters";

export function CadastroMobileCard({ cadastro }: { cadastro: Cadastro }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold leading-snug text-foreground">
            {cadastro.nomeCompleto}
          </h3>
          <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
            {cadastro.cidadeMoradia} - {cadastro.bairro}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-primary">
          {formatDate(cadastro.criadoEm)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-3 text-sm min-[380px]:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="mt-0.5 break-words text-foreground">{cadastro.telefone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lideranca</dt>
          <dd className="mt-0.5 break-words text-foreground">{cadastro.liderancaNome}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Local de votacao</dt>
          <dd className="mt-0.5 break-words text-foreground">{cadastro.localVotacao || "Nao informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Apoios</dt>
          <dd className="mt-0.5 text-foreground">{cadastro.apoios.length}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <a
          href={whatsappLink(cadastro.telefone)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>
    </article>
  );
}
