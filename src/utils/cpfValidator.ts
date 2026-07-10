import { validateCpf } from "@/lib/personal-data";

export function isValidCPF(cpf: string): boolean {
  return validateCpf(cpf);
}
