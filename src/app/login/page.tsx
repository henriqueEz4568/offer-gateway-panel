"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { formatApiError, required, validateEmail } from "@/lib/validation";
import { Alert, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMock } from "@/mock";
import { MockBanner } from "@/mock/mock-banner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError =
      required(email, "Email") ??
      validateEmail(email) ??
      required(password, "Senha");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
      });

      setToken(data.access_token);
      router.replace("/offer");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 md:px-4">
      {isMock() ? <MockBanner /> : null}
      <Card className="flex min-h-screen w-full flex-col justify-center rounded-none border-none bg-[#1E293B] p-10 md:min-h-0 md:w-1/3 md:rounded-xl md:border lg:w-1/4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Entrar</h1>

          <p className="mt-1 text-sm text-slate-400">
            Use seu email e senha para acessar o Offer Gateway.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? <Alert tone="error">{error}</Alert> : null}

          <Input
            autoComplete="email"
            labelClassName="text-sm text-slate-50 font-medium"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            type="email"
            value={email}
          />

          <Input
            autoComplete="current-password"
            labelClassName="text-sm text-slate-50 font-medium"
            label="Senha"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            type="password"
            value={password}
          />

          <Button disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
