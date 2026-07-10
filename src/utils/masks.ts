import { formatPhone, maskCpf, normalizeCpf, normalizePhone } from "@/lib/personal-data";

export function maskWhatsapp(value: string): string {
  return formatPhone(value);
}

export function maskCPF(value: string): string {
  return maskCpf(value);
}

export function onlyDigits(value: string): string {
  const phoneDigits = normalizePhone(value);
  const cpfDigits = normalizeCpf(value);
  return cpfDigits.length > phoneDigits.length ? cpfDigits : phoneDigits;
}
