"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { instancesApi } from "@/lib/api";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

type FieldErrors = { name?: string | null; number?: string | null };

export default function CreateInstancePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("connection");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: FieldErrors = {
      name: required(name, "Nome"),
      number: validatePositiveInteger(number, "Número"),
    };
    setFieldErrors(errors);

    if (errors.name || errors.number) {
      return;
    }

    setLoading(true);

    try {
      const created = await instancesApi.create({
        name: name.trim(),
        ...(type.trim() ? { type: type.trim() } : {}),
        ...(number.trim() ? { number: Number(number) } : {}),
      });
      toast.success(`Instância ${created.name ?? name.trim()} criada.`);
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
            <Link href="/instances">
              <ArrowLeft aria-hidden />
              Voltar
            </Link>
          </Button>
        }
        description="Crie uma instância local. O token é gerado pela API."
        title="Nova instância"
      />

      <Card className="max-w-2xl">
        <form className="grid gap-4" noValidate onSubmit={handleCreate}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input
            error={fieldErrors.name}
            label="Nome"
            onChange={(event) => setName(event.target.value)}
            placeholder="minha-instancia"
            required
            value={name}
          />
          <Input
            label="Tipo"
            onChange={(event) => setType(event.target.value)}
            placeholder="connection"
            value={type}
          />
          <Input
            error={fieldErrors.number}
            hint="Opcional. Apenas números, com DDI e DDD."
            inputMode="numeric"
            label="Número"
            onChange={(event) => setNumber(event.target.value)}
            placeholder="5511999999999"
            value={number}
          />
          <div>
            <Button disabled={loading} type="submit">
              {loading ? "Criando..." : "Criar instância"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
