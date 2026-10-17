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
import { useI18n } from "@/i18n/provider";
import { instancesApi } from "@/lib/api";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

type FieldErrors = { name?: string | null; number?: string | null };

export default function CreateInstancePage() {
  const router = useRouter();
  const { t } = useI18n();
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
      name: required(name, t.common.name, t.validation),
      number: validatePositiveInteger(number, t.instances.number, t.validation),
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
      toast.success(t.instances.created(created.name ?? name.trim()));
      router.push("/instances");
    } catch (err) {
      setError(formatApiError(err, t.validation.apiFallback));
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
              {t.common.back}
            </Link>
          </Button>
        }
        description={t.instances.createDescription}
        title={t.instances.newInstance}
      />

      <Card className="max-w-2xl">
        <form className="grid gap-4" noValidate onSubmit={handleCreate}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input
            error={fieldErrors.name}
            label={t.common.name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.instances.namePlaceholder}
            required
            value={name}
          />
          <Input
            label={t.instances.type}
            onChange={(event) => setType(event.target.value)}
            placeholder="connection"
            value={type}
          />
          <Input
            error={fieldErrors.number}
            hint={t.instances.numberHint}
            inputMode="numeric"
            label={t.instances.number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="5511999999999"
            value={number}
          />
          <div>
            <Button disabled={loading} type="submit">
              {loading ? t.instances.creating : t.instances.create}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
