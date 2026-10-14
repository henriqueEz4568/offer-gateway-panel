import "server-only";
import { cache } from "react";
import { readApiUrl } from "./env";
import {
  mergeThemeSources,
  parseThemeInput,
  resolveTheme,
  type ThemeInput,
} from "./theme";

const THEME_TIMEOUT_MS = 2000;
const THEME_REVALIDATE_SECONDS = 60;

async function fetchApiTheme(): Promise<ThemeInput> {
  const apiUrl = readApiUrl();
  if (!apiUrl) return {};

  try {
    const response = await fetch(`${apiUrl}/theme`, {
      headers: { accept: "application/json" },
      next: { revalidate: THEME_REVALIDATE_SECONDS, tags: ["theme"] },
      signal: AbortSignal.timeout(THEME_TIMEOUT_MS),
    });

    if (!response.ok) return {};

    return parseThemeInput(await response.json());
  } catch {
    // Timeout, network error or invalid JSON: fall back silently.
    return {};
  }
}

function readEnvTheme(): ThemeInput {
  return parseThemeInput({
    primary: process.env.NEXT_PUBLIC_THEME_PRIMARY,
    secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY,
  });
}

/** Theme for the current render: API > NEXT_PUBLIC_THEME_* > defaults. */
export const getTheme = cache(async () =>
  resolveTheme(mergeThemeSources(await fetchApiTheme(), readEnvTheme())),
);
