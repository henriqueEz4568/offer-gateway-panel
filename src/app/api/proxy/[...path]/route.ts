import axios from "axios";
import type { NextRequest } from "next/server";

type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

const requestHeaders = [
  "accept",
  "authorization",
  "content-type",
  "apikey",
];

function getBackendUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}

function buildHeaders(request: NextRequest) {
  const headers: Record<string, string> = {};

  requestHeaders.forEach((header) => {
    const value = request.headers.get(header);

    if (value) {
      headers[header] = value;
    }
  });

  return headers;
}

function getContentType(value: unknown) {
  return typeof value === "string" ? value : "application/json";
}

async function proxy(request: NextRequest, context: ProxyContext) {
  const { path } = await context.params;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const response = await axios.request<ArrayBuffer>({
    baseURL: getBackendUrl(),
    data: body,
    headers: buildHeaders(request),
    method: request.method,
    responseType: "arraybuffer",
    url: `/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    validateStatus: () => true,
  });

  return new Response(response.data, {
    headers: {
      "content-type": getContentType(response.headers["content-type"]),
    },
    status: response.status,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
