import { describe, expect, it } from "vitest";
import {
  APP_NAME_MAX_LENGTH,
  BLACK,
  DEFAULT_APP_NAME,
  MIN_TEXT_CONTRAST,
  MIN_UI_CONTRAST,
  MODE_DEFAULTS,
  WHITE,
  contrastRatio,
  ensureContrast,
  isHexColor,
  mergeThemeSources,
  parseThemeInput,
  readableForeground,
  resolveTheme,
  themeToCssVariables,
} from "./theme";

describe("isHexColor", () => {
  it.each(["#000000", "#FFFFFF", "#2563eb", "#aBcDeF"])("accepts %s", (value) => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each([
    "#fff",
    "2563eb",
    "#2563eb80",
    "#gggggg",
    "red",
    "rgb(0,0,0)",
    "#000000;}body{display:none",
    " #000000",
    null,
    undefined,
    123,
  ])("rejects %s", (value) => {
    expect(isHexColor(value)).toBe(false);
  });
});

describe("parseThemeInput", () => {
  it("returns an empty theme for non-object payloads", () => {
    expect(parseThemeInput(null)).toEqual({});
    expect(parseThemeInput("oops")).toEqual({});
    expect(parseThemeInput([{ primary: "#2563eb" }])).toEqual({});
  });

  it("drops invalid fields individually and keeps the valid ones", () => {
    expect(
      parseThemeInput({
        primary: "#2563EB",
        secondary: "amber",
        primaryForeground: "#fff",
        radius: "0.5rem",
        logoUrl: "javascript:alert(1)",
        appName: "  Acme  ",
        unknown: "ignored",
      }),
    ).toEqual({ primary: "#2563eb", radius: "0.5rem", appName: "Acme" });
  });

  it("only accepts https logo URLs", () => {
    expect(parseThemeInput({ logoUrl: "https://cdn.example.com/logo.svg" })).toEqual({
      logoUrl: "https://cdn.example.com/logo.svg",
    });
    expect(parseThemeInput({ logoUrl: "http://cdn.example.com/logo.svg" })).toEqual({});
    expect(parseThemeInput({ logoUrl: "data:image/svg+xml,<svg/>" })).toEqual({});
    expect(parseThemeInput({ logoUrl: "not a url" })).toEqual({});
  });

  it("limits appName to 40 characters and strips control characters", () => {
    const { appName } = parseThemeInput({ appName: `A\u0000${"b".repeat(80)}` });
    expect(appName).toHaveLength(APP_NAME_MAX_LENGTH);
    expect(appName?.startsWith("Ab")).toBe(true);
    expect(parseThemeInput({ appName: "   " })).toEqual({});
  });

  it("accepts sane radius values only", () => {
    expect(parseThemeInput({ radius: "12px" })).toEqual({ radius: "12px" });
    expect(parseThemeInput({ radius: "9rem" })).toEqual({});
    expect(parseThemeInput({ radius: "calc(1px)" })).toEqual({});
  });
});

describe("mergeThemeSources", () => {
  it("prefers API over env per field, and env over defaults", () => {
    const api = parseThemeInput({ primary: "#2563eb" });
    const env = parseThemeInput({ primary: "#ff0000", secondary: "#f59e0b" });

    expect(mergeThemeSources(api, env)).toEqual({
      primary: "#2563eb",
      secondary: "#f59e0b",
    });
  });

  it("falls back to env when the API is unavailable", () => {
    const env = parseThemeInput({ primary: "#ff0000" });
    expect(mergeThemeSources({}, env)).toEqual({ primary: "#ff0000" });
  });

  it("ignores invalid API values instead of overriding a valid env value", () => {
    const api = parseThemeInput({ primary: "not-a-color" });
    const env = parseThemeInput({ primary: "#ff0000" });
    expect(mergeThemeSources(api, env).primary).toBe("#ff0000");
  });
});

describe("contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#2563eb", "#ffffff")).toBeCloseTo(5.17, 1);
  });

  it("picks black or white text by the highest contrast", () => {
    expect(readableForeground("#2563eb")).toBe(WHITE);
    expect(readableForeground("#f59e0b")).toBe(BLACK);
    expect(readableForeground("#ffffff")).toBe(BLACK);
    expect(readableForeground("#0a0a0a")).toBe(WHITE);
  });

  it("always reaches 4.5:1 for text, even on mid-tones", () => {
    for (const background of ["#777777", "#808080", "#ff0000", "#00a0a0", "#7f7fff"]) {
      expect(
        contrastRatio(readableForeground(background), background),
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });

  it("keeps colors that already meet the minimum", () => {
    expect(ensureContrast("#2563eb", "#ffffff")).toBe("#2563eb");
  });

  it("darkens light colors on light backgrounds and lightens dark ones on dark backgrounds", () => {
    const yellow = ensureContrast("#ffeb3b", "#ffffff", MIN_UI_CONTRAST);
    expect(contrastRatio(yellow, "#ffffff")).toBeGreaterThanOrEqual(MIN_UI_CONTRAST);

    const navy = ensureContrast("#0b1a3a", MODE_DEFAULTS.dark.background);
    expect(contrastRatio(navy, MODE_DEFAULTS.dark.background)).toBeGreaterThanOrEqual(
      MIN_UI_CONTRAST,
    );
  });
});

describe("resolveTheme", () => {
  it("falls back to the black and white defaults (no overrides)", () => {
    const theme = resolveTheme({});

    expect(theme).toEqual({
      appName: DEFAULT_APP_NAME,
      logoUrl: null,
      radius: null,
      light: {},
      dark: {},
    });
    expect(themeToCssVariables(theme)).toEqual({});
  });

  it("derives legible foregrounds for custom colors in both modes", () => {
    const theme = resolveTheme(parseThemeInput({ primary: "#2563eb", secondary: "#f59e0b" }));

    for (const mode of ["light", "dark"] as const) {
      const { primary, primaryForeground, secondary, secondaryForeground } = theme[mode];
      expect(contrastRatio(primary!, MODE_DEFAULTS[mode].background)).toBeGreaterThanOrEqual(
        MIN_UI_CONTRAST,
      );
      expect(contrastRatio(primaryForeground!, primary!)).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      );
      expect(contrastRatio(secondaryForeground!, secondary!)).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      );
    }

    expect(theme.light.primary).toBe("#2563eb");
    expect(theme.light.primaryForeground).toBe(WHITE);
    expect(theme.light.secondaryForeground).toBe(BLACK);
  });

  it("adjusts a primary that is unreadable against the background", () => {
    const theme = resolveTheme({ primary: "#ffeb3b" });

    expect(theme.light.primary).not.toBe("#ffeb3b");
    expect(contrastRatio(theme.light.primary!, "#ffffff")).toBeGreaterThanOrEqual(
      MIN_UI_CONTRAST,
    );
    // Yellow already stands out on the dark background.
    expect(theme.dark.primary).toBe("#ffeb3b");
  });

  it("keeps a requested foreground only when it is legible", () => {
    expect(
      resolveTheme({ primary: "#2563eb", primaryForeground: "#ffffff" }).light
        .primaryForeground,
    ).toBe("#ffffff");
    expect(
      resolveTheme({ primary: "#2563eb", primaryForeground: "#3b82f6" }).light
        .primaryForeground,
    ).toBe(WHITE);
  });

  it("emits CSS variables for both modes", () => {
    const variables = themeToCssVariables(
      resolveTheme({ primary: "#2563eb", radius: "0.5rem" }),
    );

    expect(variables).toMatchObject({
      "--theme-primary": "#2563eb",
      "--theme-primary-foreground": WHITE,
      "--theme-primary-dark": "#2563eb",
      "--theme-primary-foreground-dark": WHITE,
      "--radius": "0.5rem",
    });
    expect(Object.keys(variables)).not.toContain("--theme-secondary");
  });
});
