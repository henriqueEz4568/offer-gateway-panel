import { AxiosError, type AxiosAdapter } from "axios";

// Liga o modo release somente com o valor exato "release".
// No navegador o NODE_ENV é substituído no build por "development" ou
// "production", então NEXT_PUBLIC_APP_ENV é a chave confiável.
export function isMock() {
  return (
    process.env.NEXT_PUBLIC_APP_ENV === "release" ||
    (process.env.NODE_ENV as string) === "release"
  );
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

  const result = handleRoute(method, url.pathname, params, body);

  if (result === undefined) {
    const message = `Rota não mockada: ${method} ${url.pathname}`;

    throw new AxiosError(message, "ERR_BAD_REQUEST", config, null, {
      data: { statusCode: 404, message },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config,
    });
  }

  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    config,
  };
};
