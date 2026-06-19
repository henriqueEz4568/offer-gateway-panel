"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { formatApiError, required, validateEmail } from "@/lib/validation";
import { Alert, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-950">
            Entrar no painel
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Use seu email e senha para acessar o Offer Gateway.
          </p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input
            autoComplete="email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            type="email"
            value={email}
          />
          <Input
            autoComplete="current-password"
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
