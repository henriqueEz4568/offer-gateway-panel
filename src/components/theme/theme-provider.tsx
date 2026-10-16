"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  THEME_MODE_STORAGE_KEY,
  readStoredMode,
  subscribeToSystemMode,
  systemPrefersDark,
  type ThemeModePreference,
} from "./theme-mode";

const MODE_CHANGE_EVENT = "offer-gateway:theme-mode-change";

type ThemeContextValue = {
  appName: string;
  logoUrl: string | null;
  /** Persisted preference. `null` until hydrated on the client. */
  mode: ThemeModePreference | null;
  /** Effective mode after resolving "system". `null` until hydrated. */
  resolvedMode: "light" | "dark" | null;
  setMode: (mode: ThemeModePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToStoredMode(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_MODE_STORAGE_KEY) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(MODE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MODE_CHANGE_EVENT, callback);
  };
}

function setMode(mode: ThemeModePreference) {
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage unavailable (private mode): still apply for this session.
  }
  window.dispatchEvent(new Event(MODE_CHANGE_EVENT));
}

const getServerSnapshot = () => null;

export function ThemeProvider({
  appName,
  children,
  logoUrl,
}: {
  appName: string;
  children: ReactNode;
  logoUrl: string | null;
}) {
  const mode = useSyncExternalStore(
    subscribeToStoredMode,
    readStoredMode,
    getServerSnapshot,
  );
  const prefersDark = useSyncExternalStore(
    subscribeToSystemMode,
    systemPrefersDark,
    getServerSnapshot,
  );
  const resolvedMode =
    mode === null ? null : mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (resolvedMode) {
      document.documentElement.classList.toggle("dark", resolvedMode === "dark");
    }
  }, [resolvedMode]);

  return (
    <ThemeContext value={{ appName, logoUrl, mode, resolvedMode, setMode }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>.");
  }

  return context;
}
