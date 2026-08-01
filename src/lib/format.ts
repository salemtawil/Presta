export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("COP", "$")
    .trim();
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function daysUntil(target: Date | null, from: Date) {
  if (target == null) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((target.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
  );
}
