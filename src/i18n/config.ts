export const locales = ["en", "pt-BR", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that stores the chosen locale (read by the root layout). */
export const LOCALE_COOKIE = "locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
