import { MessageCircle } from "lucide-react";

import type { Cadastro } from "@/types/cadastro";
import { formatDate, whatsappLink } from "@/utils/formatters";

interface CadastrosTableProps {
  cadastros: Cadastro[];
  compact?: boolean;
}

export function CadastrosTable({ cadastros, compact }: CadastrosTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Nome</Th>
            {!compact && <Th>WhatsApp</Th>}
            <Th>Lideranca</Th>
            <Th>Cidade onde mora</Th>
            {!compact && <Th>Bairro</Th>}
            {!compact && <Th>Local de votacao</Th>}
            <Th>Data</Th>
            {!compact && <Th>Apoios</Th>}
            {!compact && <Th className="text-right">Acoes</Th>}
          </tr>
        </thead>
        <tbody>
          {cadastros.length === 0 && (
            <tr>
              <td
                colSpan={compact ? 4 : 9}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                Nenhum cadastro encontrado.
              </td>
            </tr>
          )}

          {cadastros.map((cadastro) => (
            <tr
              key={cadastro.id}
              className="border-b border-border/70 last:border-b-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 font-medium text-foreground">{cadastro.nomeCompleto}</td>
              {!compact && <td className="px-4 py-3 text-muted-foreground">{cadastro.telefone}</td>}
              <td className="px-4 py-3 text-muted-foreground">{cadastro.liderancaNome}</td>
              <td className="px-4 py-3 text-muted-foreground">{cadastro.cidadeMoradia}</td>
              {!compact && <td className="px-4 py-3 text-muted-foreground">{cadastro.bairro}</td>}
              {!compact && (
                <td className="px-4 py-3 text-muted-foreground">
                  {cadastro.localVotacao || "Nao informado"}
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground">{formatDate(cadastro.criadoEm)}</td>
              {!compact && (
                <td className="px-4 py-3 text-muted-foreground">{cadastro.apoios.length}</td>
              )}
              {!compact && (
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <a
                      href={whatsappLink(cadastro.telefone)}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}
