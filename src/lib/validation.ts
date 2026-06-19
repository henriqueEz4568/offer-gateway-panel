import type { GroupStatus } from "./types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/;

export function required(value: string, label: string) {
  if (!value.trim()) {
    return `${label} e obrigatorio.`;
  }

  return null;
}

export function validateEmail(value: string) {
  if (!emailRegex.test(value.trim())) {
    return "Informe um email valido.";
  }

  return null;
}

export function validatePositiveInteger(value: string, label: string) {
  if (!value.trim()) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return `${label} deve ser um numero inteiro positivo.`;
  }

  return null;
}

export function validateBrazilPhone(value: string) {
  if (!phoneRegex.test(value.trim())) {
    return "Informe o destino apenas com numeros, incluindo DDI e DDD.";
  }

  return null;
}

export function validateGroupStatus(value: string): value is GroupStatus {
  return value === "disabled" || value === "active" || value === "pending";
}

export function formatApiError(error: unknown) {
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

  return "Nao foi possivel concluir a operacao.";
}
