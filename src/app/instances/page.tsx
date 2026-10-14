"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Filter, MoreHorizontal, Plug, Plus, Smartphone, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { ConfirmationModal, Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { instancesApi } from "@/lib/api";
import { getInstanceStatus } from "@/lib/status";
import type { Instance } from "@/lib/types";
import { formatApiError, validatePositiveInteger } from "@/lib/validation";

type InstanceSource = "database" | "evolution";

const sourceOptions = [
  { label: "Banco de dados", value: "database" },
  { label: "Evolution API", value: "evolution" },
];

function formatQrCodeSource(base64: string) {
  return base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [source, setSource] = useState<InstanceSource>("database");
  const [id, setId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);
  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(
    null,
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrInstanceName, setQrInstanceName] = useState("");
  const [loading, setLoading] = useState(true);

  /** Async part only: state is updated in callbacks once the request settles. */
  function fetchInstances() {
    return instancesApi
      .list({
        source,
        id: id.trim() || undefined,
        external_id: externalId.trim() || undefined,
        name: name.trim() || undefined,
      })
      .then(setInstances)
      .catch((err) => {
        toast.error("Não foi possível carregar as instâncias.", {
          description: formatApiError(err),
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Initial load only (state starts as loading); later loads come from the form.
    void fetchInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePositiveInteger(id, "ID");
    setIdError(validationError);

    if (validationError) return;

    setLoading(true);
    void fetchInstances();
  }

  function closeConnectionModal() {
    setQrCode(null);
    setPairingCode(null);
  }

  async function handleConnect(instance: Instance) {
    closeConnectionModal();
    setQrInstanceName(instance.name);
    setConnectingId(instance.id);

    try {
      const connected = await instancesApi.connect(instance.id);
      setInstances((current) =>
        current.map((item) => (item.id === connected.id ? connected : item)),
      );
      setQrCode(connected.connection?.base64 ?? null);
      setPairingCode(connected.connection?.pairingCode ?? null);
      setQrInstanceName(connected.name);
      toast.success(`Conexão solicitada para ${connected.name}.`);
    } catch (err) {
      toast.error("Não foi possível conectar a instância.", {
        description: formatApiError(err),
      });
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDelete() {
    if (!instanceToDelete) {
      return;
    }

    setDeletingId(instanceToDelete.id);

    try {
      await instancesApi.delete(instanceToDelete.id);
      setInstances((current) =>
        current.filter((instance) => instance.id !== instanceToDelete.id),
      );
      toast.success(`Instância ${instanceToDelete.name} excluída.`);
      setInstanceToDelete(null);
    } catch (err) {
      toast.error("Não foi possível excluir a instância.", {
        description: formatApiError(err),
      });
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<Instance>[] = [
    {
      header: "Nome",
      accessor: (instance) => <span className="font-medium">{instance.name}</span>,
    },
    {
      header: "ID",
      accessor: (instance) => (
        <span className="font-mono text-xs text-muted-foreground">
          {instance.id ?? "—"}
        </span>
      ),
    },
    {
      header: "ID externo",
      accessor: (instance) => (
        <span className="font-mono text-xs text-muted-foreground">
          {instance.externalId ?? "—"}
        </span>
      ),
    },
    { header: "Tipo", accessor: (instance) => instance.type ?? "—" },
    {
      header: "Número",
      accessor: (instance) => (
        <span className="tabular-nums">{instance.number ?? "—"}</span>
      ),
    },
    {
      header: "Status",
      accessor: (instance) => {
        const status = getInstanceStatus(instance.connection?.status);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: "Ações",
      className: "text-right",
      srOnlyHeader: true,
      accessor: (instance) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Ações da instância ${instance.name}`}
              disabled={
                connectingId === instance.id || deletingId === instance.id
              }
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => void handleConnect(instance)}>
              <Plug aria-hidden />
              Conectar
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setInstanceToDelete(instance)}
              variant="destructive"
            >
              <Trash2 aria-hidden />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/instances/create">
              <Plus aria-hidden />
              Nova instância
            </Link>
          </Button>
        }
        description="Liste instâncias locais ou consulte diretamente a Evolution API."
        title="Instâncias"
      />

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          onSubmit={handleFilter}
        >
          <Select
            label="Origem"
            onValueChange={(value) => setSource(value as InstanceSource)}
            options={sourceOptions}
            value={source}
          />
          <Input
            error={idError}
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
          <div className="flex items-start sm:col-span-2 lg:col-span-1 lg:pt-6">
            <Button className="w-full lg:w-auto" disabled={loading} type="submit">
              <Filter aria-hidden />
              {loading ? "Filtrando..." : "Filtrar"}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        data={instances}
        emptyState={
          <EmptyState
            action={
              <Button asChild size="sm">
                <Link href="/instances/create">
                  <Plus aria-hidden />
                  Nova instância
                </Link>
              </Button>
            }
            description="Crie uma instância para começar a enviar ofertas pelo WhatsApp."
            icon={Smartphone}
            title="Nenhuma instância encontrada"
          />
        }
        getRowKey={(instance, index) =>
          String(instance.id ?? instance.externalId ?? instance.name ?? index)
        }
        loading={loading}
        loadingLabel="Carregando instâncias..."
      />

      <Modal
        description={`Escaneie o QR code ou use o pairing code no WhatsApp para conectar ${qrInstanceName}.`}
        footer={
          <Button onClick={closeConnectionModal} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onOpenChange={(open) => {
          if (!open) closeConnectionModal();
        }}
        open={Boolean(qrCode || pairingCode)}
        title="Conectar instância"
      >
        <div className="grid gap-4">
          {qrCode ? (
            <div className="mx-auto rounded-lg bg-qr-background p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`QR code da instância ${qrInstanceName}`}
                className="size-64 object-contain [image-rendering:pixelated]"
                height={256}
                src={formatQrCodeSource(qrCode)}
                width={256}
              />
            </div>
          ) : null}
          {pairingCode ? (
            <div className="rounded-md border border-border bg-muted p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pairing code
              </p>
              <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-widest">
                {pairingCode}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmationModal
        confirmLabel="Excluir"
        description={
          instanceToDelete
            ? `Tem certeza que deseja excluir a instância ${instanceToDelete.name}? Esta ação não pode ser desfeita.`
            : ""
        }
        loading={deletingId !== null}
        onCancel={() => setInstanceToDelete(null)}
        onConfirm={() => void handleDelete()}
        open={Boolean(instanceToDelete)}
        title="Excluir instância"
      />
    </>
  );
}
