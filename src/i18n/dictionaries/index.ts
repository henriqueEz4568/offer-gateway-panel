import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";

export type { Dictionary };

// Dictionaries hold functions (interpolation), so they are imported where
// they are used instead of being passed from server to client components.
export const dictionaries: Record<Locale, Dictionary> = {
  en,
  "pt-BR": ptBR,
  es,
};
