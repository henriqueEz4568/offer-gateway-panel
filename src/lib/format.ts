import type { Locale } from "@/i18n/config";

/** Amounts are always in BRL; only the number formatting follows the locale. */
export function formatCurrency(value: number | null | undefined, locale: Locale) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "BRL",
        currencyDisplay: "narrowSymbol",
      }).format(value)
    : "—";
}

/** Formats a rate already expressed in percent (e.g. 12.5 → "12.5%" / "12,5%"). */
export function formatPercent(value: number | null | undefined, locale: Locale) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}%`
    : "—";
}
