import type { AxiosAdapter } from "axios";

// Liga o modo release somente com NEXT_PUBLIC_NODE_ENV="release".
// Qualquer outro valor (ou a variável ausente) chama a API real.
export function isMock() {
  return process.env.NEXT_PUBLIC_NODE_ENV === "release";
}

export const mockAdapter: AxiosAdapter = async (config) => {
  // Import dinâmico: as rotas e os dados só são carregados em modo release.
  const { handleRoute } = await import("./routes");

  const method = (config.method ?? "get").toUpperCase();
  const url = new URL(config.url ?? "/", "http://mock");
  const params: Record<string, string> = {
    ...Object.fromEntries(url.searchParams),
    ...config.params,
  };
  const body = typeof config.data === "string" ? JSON.parse(config.data) : {};

  // Rota não mapeada também passa: GET devolve lista vazia, o resto {}.
  const result =
    handleRoute(method, url.pathname, params, body) ??
    (method === "GET" ? [] : {});

  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    config,
  };
};
