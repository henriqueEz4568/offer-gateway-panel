export type ThemeModePreference = "light" | "dark" | "system";

export const THEME_MODE_STORAGE_KEY = "offer-gateway:theme-mode";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs in <head> before first paint, so the persisted mode never flashes.
 * Static string: no external data is interpolated.
 */
export const themeModeScript = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  THEME_MODE_STORAGE_KEY,
)});var d=m==="dark"||(m!=="light"&&window.matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function isThemeModePreference(value: unknown): value is ThemeModePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredMode(): ThemeModePreference {
  try {
    const value = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return isThemeModePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function systemPrefersDark() {
  return window.matchMedia(DARK_QUERY).matches;
}

export function subscribeToSystemMode(callback: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
