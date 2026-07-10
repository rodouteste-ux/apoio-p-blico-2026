export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") ? digits.slice(2) : digits;
}

export function maskCpf(value: string): string {
  const digits = normalizeCpf(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCpfForAdmin(value: string): string {
  const digits = normalizeCpf(value).padEnd(11, "*").slice(0, 11);
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function validateCpf(value: string): boolean {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += Number(base[i]) * (factor - i);
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const firstDigit = calc(digits.slice(0, 9), 10);
  if (firstDigit !== Number(digits[9])) return false;

  const secondDigit = calc(digits.slice(0, 10), 11);
  return secondDigit === Number(digits[10]);
}

export function whatsappLink(value: string): string {
  const digits = normalizePhone(value);
  return `https://wa.me/55${digits}`;
}
