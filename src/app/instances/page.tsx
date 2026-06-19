"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { instancesApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Instance } from "@/lib/types";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

export default function InstancesPage() {
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("connection");
  const [number, setNumber] = useState("");
  const [connectId, setConnectId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError =
      required(name, "Nome") ?? validatePositiveInteger(number, "Numero");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const instance = await instancesApi.create({
        name: name.trim(),
        ...(type.trim() ? { type: type.trim() } : {}),
        ...(number.trim() ? { number: Number(number) } : {}),
      });
      setInstances((current) => [instance, ...current]);
      setSuccess(`Instancia ${instance.name} criada.`);
      setName("");
      setNumber("");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const imported = await instancesApi.importAll();
      setInstances(imported);
      setSuccess(`${imported.length} instancia(s) importada(s).`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setQrCode(null);

    const validationError = validatePositiveInteger(connectId, "ID da instancia");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const instance = await instancesApi.connect(Number(connectId));
      setInstances((current) => {
        const exists = current.some((item) => item.id === instance.id);
        return exists
          ? current.map((item) => (item.id === instance.id ? instance : item))
          : [instance, ...current];
      });
      setQrCode(instance.connection?.base64 ?? null);
      setSuccess(`Conexao solicitada para ${instance.name}.`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<DataTableColumn<Instance>[]>(
    () => [
      { header: "ID", accessor: "id" },
      { header: "Nome", accessor: "name" },
      { header: "Tipo", accessor: "type" },
      {
        header: "Numero",
        accessor: (instance) => instance.number ?? "-",
      },
      {
        header: "Status",
        accessor: (instance) => instance.connection?.status ?? "-",
      },
      {
        header: "Acao",
        accessor: (instance) => (
          <Button
            onClick={() => setConnectId(String(instance.id))}
            variant="secondary"
          >
            Usar ID
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        actions={
          <Button disabled={loading} onClick={handleImport} variant="secondary">
            {loading ? "Processando..." : "Importar instances"}
          </Button>
        }
        description="Crie instances locais, importe as existentes da Evolution API e solicite conexao por QR code."
        title="Instances"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950">
            Criar instance
          </h2>
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
            <Button disabled={loading} type="submit">
              {loading ? "Criando..." : "Criar instance"}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950">
            Conectar instance
          </h2>
          <form className="grid gap-4" onSubmit={handleConnect}>
            <Input
              inputMode="numeric"
              label="ID local da instance"
              onChange={(event) => setConnectId(event.target.value)}
              placeholder="10"
              value={connectId}
            />
            <Button disabled={loading} type="submit">
              {loading ? "Conectando..." : "Gerar conexao"}
            </Button>
          </form>
          {qrCode ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-zinc-800">QR code</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR code da instancia"
                className="h-56 w-56 rounded-md border border-zinc-200 object-contain"
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
              />
            </div>
          ) : null}
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={instances}
        emptyMessage="Importe instances ou crie uma nova para visualizar aqui."
        getRowKey={(instance) => String(instance.id)}
      />
    </>
  );
}
