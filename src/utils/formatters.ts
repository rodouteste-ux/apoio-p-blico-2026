import { maskCPF, maskWhatsapp } from "./masks";

export function formatCPFMasked(cpf: string): string {
  const digits = cpf.replace(/\D/g, "").padEnd(11, "0").slice(0, 11);
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function formatCPF(cpf: string): string {
  return maskCPF(cpf);
}

export function formatWhatsapp(value: string): string {
  return maskWhatsapp(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function whatsappLink(numero: string): string {
  const digits = numero.replace(/\D/g, "");
  return `https://wa.me/55${digits}`;
}
