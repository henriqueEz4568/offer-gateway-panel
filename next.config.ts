import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Modo release (src/mock). O Next define NODE_ENV antes de ler o .env, então
// NODE_ENV=release no .env não chega em process.env nem no navegador. Lemos o
// texto dos arquivos .env e repassamos como NEXT_PUBLIC_APP_ENV.
const { loadedEnvFiles } = loadEnvConfig(process.cwd());
const isRelease =
  (process.env.NODE_ENV as string) === "release" ||
  loadedEnvFiles.some((file) =>
    /^\s*NODE_ENV\s*=\s*["']?release["']?\s*$/m.test(file.contents),
  );

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  env: isRelease ? { NEXT_PUBLIC_APP_ENV: "release" } : {},
};

export default nextConfig;
