import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { formatCurrency } from "@/lib/format";
import { getGroupStatus, getInstanceStatus } from "@/lib/status";
import { formatApiError, required } from "@/lib/validation";

/**
 * Every leaf of a dictionary as "path:type", or only the string values
 * when `values` is true.
 */
function shape(value: unknown, path = "", values = false): string[] {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      shape(child, path ? `${path}.${key}` : key, values),
    );
  }

  if (values) return typeof value === "string" ? [value] : [];
  return [`${path}:${typeof value}`];
}

describe("i18n config", () => {
  it("defaults to English", () => {
    expect(defaultLocale).toBe("en");
  });

  it("supports English, Brazilian Portuguese and Spanish", () => {
    expect(locales).toEqual(["en", "pt-BR", "es"]);
  });

  it("only accepts supported locales", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("pt")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("dictionaries", () => {
  it("have the same keys and value types in every locale", () => {
    const expected = shape(dictionaries.en).sort();

    for (const locale of locales) {
      expect(shape(dictionaries[locale]).sort()).toEqual(expected);
    }
  });

  it("have no empty strings", () => {
    for (const locale of locales) {
      expect(shape(dictionaries[locale], "", true)).not.toContain("");
    }
  });

  it("interpolate values", () => {
    expect(dictionaries.en.offers.sentBy("main")).toBe("Sent through instance main.");
    expect(dictionaries["pt-BR"].offers.sentBy("main")).toBe("Enviada pela instância main.");
    expect(dictionaries.es.offers.sentBy("main")).toBe("Enviada por la instancia main.");
  });
});

describe("locale-aware helpers", () => {
  it("translate validation messages", () => {
    expect(required(" ", "Name", dictionaries.en.validation)).toBe("Name is required.");
    expect(required(" ", "Senha", dictionaries["pt-BR"].validation)).toBe("Preencha o campo Senha.");
    expect(required("x", "Name", dictionaries.en.validation)).toBeNull();
  });

  it("keep API messages and translate the fallback", () => {
    const apiError = { response: { data: { message: "Invalid token" } } };

    expect(formatApiError(apiError, "fallback")).toBe("Invalid token");
    expect(formatApiError(new Error("boom"), dictionaries.es.validation.apiFallback)).toBe(
      "No se pudo completar la operación.",
    );
  });

  it("translate status labels", () => {
    expect(getInstanceStatus("open", dictionaries.es.status.instance)).toEqual({
      label: "Conectada",
      variant: "success",
    });
    expect(getInstanceStatus(undefined, dictionaries.en.status.instance).label).toBe("Unknown");
    expect(getInstanceStatus("qrcode", dictionaries.en.status.instance)).toEqual({
      label: "qrcode",
      variant: "info",
    });
    expect(getGroupStatus("pending", dictionaries["pt-BR"].status.group).label).toBe("Pendente");
  });

  it("format BRL amounts with the locale's number format", () => {
    expect(formatCurrency(1234.5, "en")).toBe("R$1,234.50");
    expect(formatCurrency(1234.5, "pt-BR")).toBe("R$\u00a01.234,50");
    expect(formatCurrency(1234.5, "es")).toBe("1234,50\u00a0R$");
    expect(formatCurrency(undefined, "en")).toBe("—");
  });
});
