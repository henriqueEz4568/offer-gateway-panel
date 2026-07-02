"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { instancesApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

export default function CreateInstancePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("connection");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError =
      required(name, "Nome") ?? validatePositiveInteger(number, "Numero");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await instancesApi.create({
        name: name.trim(),
        ...(type.trim() ? { type: type.trim() } : {}),
        ...(number.trim() ? { number: Number(number) } : {}),
      });
      router.push("/instances");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/instances">Voltar</Link>
          </Button>
        }
        description="Crie uma instance local. O token e gerado pela API."
        title="Criar instance"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="max-w-2xl">
        <form className="grid gap-4" onSubmit={handleCreate}>
          <Input
            label="Nome"
            onChange={(event) => setName(event.target.value)}
            placeholder="minha-instancia"
            value={name}
          />
          <Input
            label="Tipo"
            onChange={(event) => setType(event.target.value)}
            placeholder="connection"
            value={type}
          />
          <Input
            inputMode="numeric"
            label="Numero"
            onChange={(event) => setNumber(event.target.value)}
            placeholder="5511999999999"
            value={number}
          />
          <div>
            <Button disabled={loading} type="submit">
              {loading ? "Criando..." : "Criar instance"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
