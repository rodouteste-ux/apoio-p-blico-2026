import { MessageCircle } from "lucide-react";

import type { Cadastro } from "@/types/cadastro";
import { formatDate, whatsappLink } from "@/utils/formatters";

export function CadastroMobileCard({ cadastro }: { cadastro: Cadastro }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {cadastro.nomeCompleto}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {cadastro.cidadeMoradia} - {cadastro.bairro}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-primary">
          {formatDate(cadastro.criadoEm)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="mt-0.5 text-foreground">{cadastro.telefone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lideranca</dt>
          <dd className="mt-0.5 text-foreground">{cadastro.liderancaNome}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cidade onde vota</dt>
          <dd className="mt-0.5 text-foreground">{cadastro.cidadeVotacao || "Nao informado"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Local de votacao</dt>
          <dd className="mt-0.5 text-foreground">{cadastro.localVotacao || "Nao informado"}</dd>
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
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>
    </article>
  );
}
