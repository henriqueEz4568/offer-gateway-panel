/**
 * Pure theme logic: validation, WCAG contrast, derivation and source merging.
 *
 * Default colors live in `globals.css`; this module only produces overrides
 * (`--theme-*` custom properties) for values that came from the API or env.
 */

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const RADIUS = /^(\d{1,2}(?:\.\d{1,3})?)(rem|px)$/;

export const APP_NAME_MAX_LENGTH = 40;
export const DEFAULT_APP_NAME = "Offer Gateway";

/** WCAG 2.x minimums: 4.5:1 for body text, 3:1 for UI components. */
export const MIN_TEXT_CONTRAST = 4.5;
export const MIN_UI_CONTRAST = 3;

export const BLACK = "#0a0a0a";
export const WHITE = "#fafafa";

export type ThemeMode = "light" | "dark";

/** Page background and default brand colors per mode (mirrors globals.css). */
export const MODE_DEFAULTS: Record<
  ThemeMode,
  { background: string; primary: string; secondary: string }
> = {
  light: { background: "#ffffff", primary: BLACK, secondary: "#ffffff" },
  dark: { background: BLACK, primary: WHITE, secondary: "#171717" },
};

/** Shape of `GET {API}/theme` after validation. Every field is optional. */
export type ThemeInput = {
  primary?: string;
  secondary?: string;
  primaryForeground?: string;
  secondaryForeground?: string;
  radius?: string;
  appName?: string;
  logoUrl?: string;
};

export type ModeColors = {
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
};

export type ResolvedTheme = {
  appName: string;
  logoUrl: string | null;
  radius: string | null;
  light: ModeColors;
  dark: ModeColors;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

function sanitizeHex(value: unknown) {
  return isHexColor(value) ? value.toLowerCase() : undefined;
}

export function sanitizeRadius(value: unknown) {
  if (typeof value !== "string") return undefined;

  const match = RADIUS.exec(value.trim());
  if (!match) return undefined;

  const amount = Number(match[1]);
  const max = match[2] === "rem" ? 2 : 32;

  return amount <= max ? `${match[1]}${match[2]}` : undefined;
}

export function sanitizeAppName(value: unknown) {
  if (typeof value !== "string") return undefined;

  // Strip control characters; React escapes the rest when rendering as text.
  // eslint-disable-next-line no-control-regex
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();

  return name ? name.slice(0, APP_NAME_MAX_LENGTH).trim() : undefined;
}

export function sanitizeLogoUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Validates an untrusted payload field by field. Invalid fields are dropped
 * individually, so one bad value never discards the rest.
 */
export function parseThemeInput(data: unknown): ThemeInput {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {};
  }

  const raw = data as Record<string, unknown>;
  const input: ThemeInput = {
    primary: sanitizeHex(raw.primary),
    secondary: sanitizeHex(raw.secondary),
    primaryForeground: sanitizeHex(raw.primaryForeground),
    secondaryForeground: sanitizeHex(raw.secondaryForeground),
    radius: sanitizeRadius(raw.radius),
    appName: sanitizeAppName(raw.appName),
    logoUrl: sanitizeLogoUrl(raw.logoUrl),
  };

  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as ThemeInput;
}

/** Field-by-field merge where earlier sources win (API > env > default). */
export function mergeThemeSources(...sources: ThemeInput[]): ThemeInput {
  const merged: ThemeInput = {};

  for (const source of [...sources].reverse()) {
    Object.assign(merged, source);
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Color math (sRGB, WCAG 2.x)
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(rgb: Rgb) {
  return `#${rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/** Equivalent to `color-mix(in srgb, color, target amount)`. */
export function mixColors(color: string, target: string, amount: number) {
  const from = hexToRgb(color);
  const to = hexToRgb(target);

  return rgbToHex(
    from.map((channel, index) => channel + (to[index] - channel) * amount) as Rgb,
  );
}

/** Black or white text, whichever has the higher WCAG contrast on `background`. */
export function readableForeground(background: string) {
  const best = [BLACK, WHITE].sort(
    (a, b) => contrastRatio(b, background) - contrastRatio(a, background),
  )[0];

  if (contrastRatio(best, background) >= MIN_TEXT_CONTRAST) return best;

  // Off-black/off-white fall just short on some mid-tones; pure values never do.
  return best === BLACK ? "#000000" : "#ffffff";
}

/**
 * Darkens (on light backgrounds) or lightens (on dark backgrounds) `color`
 * by the smallest amount that reaches `minRatio` against `background`.
 */
export function ensureContrast(
  color: string,
  background: string,
  minRatio = MIN_UI_CONTRAST,
) {
  if (contrastRatio(color, background) >= minRatio) return color.toLowerCase();

  const target = relativeLuminance(background) > 0.18 ? "#000000" : "#ffffff";
  let low = 0;
  let high = 1;

  for (let step = 0; step < 20; step++) {
    const mid = (low + high) / 2;
    if (contrastRatio(mixColors(color, target, mid), background) >= minRatio) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return mixColors(color, target, high);
}

/** Uses the requested foreground only if it is legible; otherwise computes one. */
function pickForeground(background: string, requested?: string) {
  if (requested && contrastRatio(requested, background) >= MIN_TEXT_CONTRAST) {
    return requested;
  }

  return readableForeground(background);
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

function resolveMode(input: ThemeInput, mode: ThemeMode): ModeColors {
  const defaults = MODE_DEFAULTS[mode];
  const colors: ModeColors = {};

  if (input.primary || input.primaryForeground) {
    // Primary is used for buttons and active states, so it must stand out
    // from the page background (3:1, WCAG 1.4.11).
    const primary = input.primary
      ? ensureContrast(input.primary, defaults.background, MIN_UI_CONTRAST)
      : defaults.primary;
    colors.primary = primary;
    colors.primaryForeground = pickForeground(primary, input.primaryForeground);
  }

  if (input.secondary || input.secondaryForeground) {
    // Secondary surfaces always render with a border, so only the text on
    // them needs to meet the contrast minimum.
    const secondary = input.secondary ?? defaults.secondary;
    colors.secondary = secondary;
    colors.secondaryForeground = pickForeground(
      secondary,
      input.secondaryForeground,
    );
  }

  return colors;
}

export function resolveTheme(input: ThemeInput): ResolvedTheme {
  return {
    appName: input.appName ?? DEFAULT_APP_NAME,
    logoUrl: input.logoUrl ?? null,
    radius: input.radius ?? null,
    light: resolveMode(input, "light"),
    dark: resolveMode(input, "dark"),
  };
}

const VARIABLE_NAMES: Record<keyof ModeColors, string> = {
  primary: "--theme-primary",
  primaryForeground: "--theme-primary-foreground",
  secondary: "--theme-secondary",
  secondaryForeground: "--theme-secondary-foreground",
};

/**
 * CSS custom properties for `<html style>`. `globals.css` reads them with
 * fallbacks (`var(--theme-primary, <default>)`), so an empty object means the
 * default black-and-white theme.
 */
export function themeToCssVariables(theme: ResolvedTheme) {
  const variables: Record<string, string> = {};

  for (const mode of ["light", "dark"] as const) {
    const suffix = mode === "dark" ? "-dark" : "";

    for (const [key, name] of Object.entries(VARIABLE_NAMES)) {
      const value = theme[mode][key as keyof ModeColors];
      // Defense in depth: only validated hex values ever reach the DOM.
      if (isHexColor(value)) variables[`${name}${suffix}`] = value;
    }
  }

  if (theme.radius && sanitizeRadius(theme.radius)) {
    variables["--radius"] = theme.radius;
  }

  return variables;
}
