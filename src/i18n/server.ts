import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

/** Locale saved in the cookie, or the default (English). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
