import type { Dictionary } from "@/i18n/dictionaries";
import type { GroupStatus } from "./types";

type Messages = Dictionary["validation"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/;

export function required(value: string, label: string, messages: Messages) {
  if (!value.trim()) {
    return messages.required(label);
  }

  return null;
}

export function validateEmail(value: string, messages: Messages) {
  if (!emailRegex.test(value.trim())) {
    return messages.email;
  }

  return null;
}

export function validatePositiveInteger(
  value: string,
  label: string,
  messages: Messages,
) {
  if (!value.trim()) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return messages.positiveInteger(label);
  }

  return null;
}

export function validateBrazilPhone(value: string, messages: Messages) {
  if (!phoneRegex.test(value.trim())) {
    return messages.phone;
  }

  return null;
}

export function validateGroupStatus(value: string): value is GroupStatus {
  return value === "disabled" || value === "active" || value === "pending";
}

/** API message when present (shown as sent by the API), otherwise `fallback`. */
export function formatApiError(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };

    if (Array.isArray(data.message)) {
      return data.message.join(" ");
    }

    if (data.message) {
      return data.message;
    }
  }

  return fallback;
}
