export function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

export function fromCents(value) {
  return Math.round(value) / 100;
}
