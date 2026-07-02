"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plug, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, Select } from "@/components/ui/input";
import { ConfirmationModal, Modal } from "@/components/ui/modal";
import { instancesApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Instance } from "@/lib/types";
import { formatApiError, validatePositiveInteger } from "@/lib/validation";

type InstanceSource = "database" | "evolution";

function formatQrCodeSource(base64: string) {
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
}

export default function InstancesPage() {
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [source, setSource] = useState<InstanceSource>("database");
  const [id, setId] = useState("");
  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInstances = useCallback(async () => {
    setError(null);
    setSuccess(null);

    const validationError = validatePositiveInteger(id, "ID");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = await instancesApi.list({
        source,
        id: id.trim() || undefined,
        external_id: externalId.trim() || undefined,
        name: name.trim() || undefined,
      });
      setInstances(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [externalId, id, name, source]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => void loadInstances());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadInstances();
  }

  const handleConnect = useCallback(async (instance: Instance) => {
    setError(null);
    setSuccess(null);
    setQrCode(null);
    setQrInstanceName(instance.name);
    setConnectingId(instance.id);

    try {
      const connected = await instancesApi.connect(instance.id);
      setInstances((current) =>
        current.map((item) => (item.id === connected.id ? connected : item)),
      );
      setQrCode(connected.connection?.base64 ?? null);
      setQrInstanceName(connected.name);
      setSuccess(`Conexao solicitada para ${connected.name}.`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setConnectingId(null);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!instanceToDelete) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingId(instanceToDelete.id);

    try {
      await instancesApi.delete(instanceToDelete.id);
      setInstances((current) =>
        current.filter((instance) => instance.id !== instanceToDelete.id),
      );
      setSuccess(`Instance ${instanceToDelete.name} deletada.`);
      setInstanceToDelete(null);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setDeletingId(null);
    }
  }, [instanceToDelete]);

  const columns = useMemo<DataTableColumn<Instance>[]>(
    () => [
      {
        header: "ID",
        accessor: (instance) => instance.id ?? "-",
        className: "text-center",
      },
      { header: "Nome", accessor: "name", className: "text-center" },
      {
        header: "ID externo",
        accessor: (instance) => instance.externalId ?? "-",
        className: "text-center",
      },
      {
        header: "Tipo",
        accessor: (instance) => instance.type ?? "-",
        className: "text-center",
      },
      {
        header: "Numero",
        accessor: (instance) => instance.number ?? "-",
        className: "text-center",
      },
      {
        header: "Status",
        accessor: (instance) => instance.connection?.status ?? "-",
        className: "text-center",
      },
      {
        header: "Acoes",
        className: "text-center",
        accessor: (instance) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Acoes da instance ${instance.name}`}
                disabled={connectingId === instance.id || deletingId === instance.id}
                size="icon"
                variant="secondary"
              >
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => void handleConnect(instance)}>
                <Plug size={16} />
                Conectar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                onSelect={() => setInstanceToDelete(instance)}
              >
                <Trash2 size={16} />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [connectingId, deletingId, handleConnect],
  );

  return (
    <>
      <PageHeader
        actions={
          <Button asChild size="icon" title="Criar instance">
            <Link aria-label="Criar instance" href="/instances/create">
              <Plus size={18} />
            </Link>
          </Button>
        }
        description="Liste instances locais ou consulte diretamente a Evolution API."
        title="Instances"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card>
        <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleFilter}>
          <Select
            label="Source"
            onValueChange={(value) => setSource(value as InstanceSource)}
            options={[
              { label: "database", value: "database" },
              { label: "evolution", value: "evolution" },
            ]}
            value={source}
          />
          <Input
            inputMode="numeric"
            label="ID"
            onChange={(event) => setId(event.target.value)}
            placeholder="10"
            value={id}
          />
          <Input
            label="ID externo"
            onChange={(event) => setExternalId(event.target.value)}
            placeholder="instance-id"
            value={externalId}
          />
          <Input
            label="Nome"
            onChange={(event) => setName(event.target.value)}
            placeholder="minha-instancia"
            value={name}
          />
          <div className="flex items-end">
            <Button disabled={loading} type="submit">
              {loading ? "Filtrando..." : "Filtrar"}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        data={instances}
        emptyMessage="Nenhuma instance encontrada."
        getRowKey={(instance, index) =>
          String(instance.id ?? instance.externalId ?? instance.name ?? index)
        }
        loading={loading}
        loadingMessage="Carregando instances..."
      />

      <Modal
        description={qrInstanceName}
        footer={
          <Button onClick={() => setQrCode(null)} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onOpenChange={(open) => {
          if (!open) {
            setQrCode(null);
          }
        }}
        open={Boolean(qrCode)}
        title="QR code"
      >
        {qrCode ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt={`QR code da instance ${qrInstanceName}`}
            className="mx-auto h-72 w-72 rounded-md border border-zinc-200 object-contain"
            src={formatQrCodeSource(qrCode)}
          />
        ) : null}
      </Modal>

      <ConfirmationModal
        confirmLabel="Deletar"
        description={
          instanceToDelete
            ? `Tem certeza que deseja deletar a instance ${instanceToDelete.name}?`
            : ""
        }
        loading={deletingId !== null}
        onCancel={() => setInstanceToDelete(null)}
        onConfirm={() => void handleDelete()}
        open={Boolean(instanceToDelete)}
        title="Deletar instance"
      />
    </>
  );
}
