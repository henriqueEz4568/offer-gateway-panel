"use client";

import { useRouter } from "next/navigation";
import { Fragment, createContext, useContext, useState, type ReactNode } from "react";
import { LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type I18nContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  function setLocale(nextLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    document.documentElement.lang = nextLocale;
    setLocaleState(nextLocale);
    // Re-render server parts (metadata) with the new cookie.
    router.refresh();
  }

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {/* Remount on change so messages already in state (e.g. validation
          errors) are produced again in the new language. */}
      <Fragment key={locale}>{children}</Fragment>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
