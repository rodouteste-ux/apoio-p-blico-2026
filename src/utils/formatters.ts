import { formatPhone, maskCpf, maskCpfForAdmin, whatsappLink as buildWhatsappLink } from "@/lib/personal-data";

export function formatCPFMasked(cpf: string): string {
  return maskCpfForAdmin(cpf);
}

export function formatCPF(cpf: string): string {
  return maskCpf(cpf);
}

export function formatWhatsapp(value: string): string {
  return formatPhone(value);
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
  return buildWhatsappLink(numero);
}
