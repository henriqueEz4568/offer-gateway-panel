"use client";

import { Boxes, Eye, EyeOff, LogIn } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { isAuthenticated, setToken } from "@/lib/auth";
import { formatApiError, required, validateEmail } from "@/lib/validation";
import { isMock } from "@/mock";
import { MockBanner } from "@/mock/mock-banner";

type FieldErrors = { email?: string | null; password?: string | null };

export default function LoginPage() {
  const router = useRouter();
  const { appName, logoUrl } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/offer");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: FieldErrors = {
      email: required(email, "E-mail") ?? validateEmail(email),
      password: required(password, "Senha"),
    };
    setFieldErrors(errors);

    if (errors.email || errors.password) {
      (errors.email ? emailRef : passwordRef).current?.focus();
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
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      {isMock() ? <MockBanner /> : null}

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- remote logo from the theme API */
            <img
              alt=""
              className="size-12 rounded-lg object-contain"
              height={48}
              src={logoUrl}
              width={48}
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Boxes aria-hidden className="size-6" />
            </span>
          )}
          <p className="text-lg font-semibold">{appName}</p>
        </div>

        <Card className="p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use seu e-mail e senha para acessar o painel.
            </p>
          </div>

          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}

            <Input
              autoComplete="email"
              autoFocus
              error={fieldErrors.email}
              label="E-mail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              ref={emailRef}
              required
              type="email"
              value={email}
            />

            <Input
              autoComplete="current-password"
              endAdornment={
                <Button
                  aria-controls="password"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              }
              error={fieldErrors.password}
              id="password"
              label="Senha"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              ref={passwordRef}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />

            <Button className="mt-2 w-full" disabled={loading} type="submit">
              <LogIn aria-hidden />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
