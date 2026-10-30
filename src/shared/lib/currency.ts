const CURRENCY_LOCALE = "pt-BR";
const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "BRL",
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  options: Intl.NumberFormatOptions,
  locale = CURRENCY_LOCALE,
) {
  const key = `${locale}:${JSON.stringify(
    Object.entries(options).sort(([left], [right]) => left.localeCompare(right)),
  )}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {},
) {
  return getFormatter({ ...DEFAULT_CURRENCY_OPTIONS, ...options }).format(value);
}

export function formatCompactCurrency(value: number) {
  return formatCurrency(value, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
) {
  return getFormatter(options).format(value);
}

export function parseCurrencyInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return NaN;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

export function installmentAmount(total: number, count: number, number: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return (base + (number <= remainder ? 1 : 0)) / 100;
}
