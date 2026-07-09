import { MessageCircle, Eye } from "lucide-react";
import type { Cadastro } from "@/types/cadastro";
import { responsaveis } from "@/data/responsaveis";
import {
  formatCPFMasked,
  formatDate,
  formatWhatsapp,
  whatsappLink,
} from "@/utils/formatters";

interface CadastrosTableProps {
  cadastros: Cadastro[];
  compact?: boolean;
}

function responsavelNome(id: string) {
  return responsaveis.find((r) => r.id === id)?.nome ?? "—";
}

export function CadastrosTable({ cadastros, compact }: CadastrosTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Nome</Th>
            {!compact && <Th>WhatsApp</Th>}
            {!compact && <Th>CPF</Th>}
            <Th>Cidade</Th>
            <Th>Responsável</Th>
            <Th>Data</Th>
            {!compact && <Th className="text-right">Ações</Th>}
          </tr>
        </thead>
        <tbody>
          {cadastros.map((c) => (
            <tr key={c.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">{c.nome}</td>
              {!compact && <td className="px-4 py-3 text-muted-foreground">{formatWhatsapp(c.whatsapp)}</td>}
              {!compact && <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatCPFMasked(c.cpf)}</td>}
              <td className="px-4 py-3 text-muted-foreground">{c.cidade}</td>
              <td className="px-4 py-3 text-muted-foreground">{responsavelNome(c.responsavelId)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(c.criadoEm)}</td>
              {!compact && (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <a
                      href={whatsappLink(c.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
