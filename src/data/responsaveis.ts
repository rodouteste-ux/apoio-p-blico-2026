import type { Responsavel } from "@/types/responsavel";

export const responsaveis: Responsavel[] = [
  {
    id: "1",
    nome: "Djavan Damasceno Xavier",
    slug: "djavan-damasceno-xavier",
    cidadeBase: "Tobias Barreto",
    ativo: true,
  },
  {
    id: "2",
    nome: "Maria Helena Andrade",
    slug: "maria-helena-andrade",
    cidadeBase: "Aracaju",
    ativo: true,
  },
];

export function getResponsavelBySlug(slug: string): Responsavel | undefined {
  return responsaveis.find((r) => r.slug === slug);
}
