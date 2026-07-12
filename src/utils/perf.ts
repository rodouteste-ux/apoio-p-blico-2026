export function startMeasure() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function logMeasure(label: string, start: number) {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  console.log(`${label}:`, Math.round((now - start) * 100) / 100, "ms");
}
