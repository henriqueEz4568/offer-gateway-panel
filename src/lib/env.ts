function normalizeUrl(value: string | undefined) {
  const url = value?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/** Base URL of the NestJS API, or `null` when not configured. */
export function readApiUrl() {
  // Must be accessed literally so Next.js can inline it in the client bundle.
  return normalizeUrl(process.env.NEXT_PUBLIC_API_URL);
}

/** Base URL of the NestJS API; throws an actionable error when missing. */
export function getApiUrl() {
  const apiUrl = readApiUrl();

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL não está definida. Copie .env.example para .env.local e informe a URL da API do Offer Gateway.",
    );
  }

  return apiUrl;
}
