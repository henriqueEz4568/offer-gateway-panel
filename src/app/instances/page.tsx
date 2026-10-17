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
import { useI18n } from "@/i18n/provider";
import { instancesApi } from "@/lib/api";
import { getInstanceStatus } from "@/lib/status";
import type { Instance } from "@/lib/types";
import { formatApiError, validatePositiveInteger } from "@/lib/validation";

type InstanceSource = "database" | "evolution";

function formatQrCodeSource(base64: string) {
  return base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;
}

export default function InstancesPage() {
  const { t } = useI18n();
  const sourceOptions = [
    { label: t.common.sourceDatabase, value: "database" },
    { label: t.common.sourceEvolution, value: "evolution" },
  ];
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
        toast.error(t.instances.loadError, {
          description: formatApiError(err, t.validation.apiFallback),
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

    const validationError = validatePositiveInteger(id, t.common.id, t.validation);
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
      toast.success(t.instances.connectRequested(connected.name));
    } catch (err) {
      toast.error(t.instances.connectError, {
        description: formatApiError(err, t.validation.apiFallback),
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
      toast.success(t.instances.deleted(instanceToDelete.name));
      setInstanceToDelete(null);
    } catch (err) {
      toast.error(t.instances.deleteError, {
        description: formatApiError(err, t.validation.apiFallback),
      });
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<Instance>[] = [
    {
      header: t.common.name,
      accessor: (instance) => <span className="font-medium">{instance.name}</span>,
    },
    {
      header: t.common.id,
      accessor: (instance) => (
        <span className="font-mono text-xs text-muted-foreground">
          {instance.id ?? "—"}
        </span>
      ),
    },
    {
      header: t.common.externalId,
      accessor: (instance) => (
        <span className="font-mono text-xs text-muted-foreground">
          {instance.externalId ?? "—"}
        </span>
      ),
    },
    { header: t.instances.type, accessor: (instance) => instance.type ?? "—" },
    {
      header: t.instances.number,
      accessor: (instance) => (
        <span className="tabular-nums">{instance.number ?? "—"}</span>
      ),
    },
    {
      header: t.common.status,
      accessor: (instance) => {
        const status = getInstanceStatus(instance.connection?.status, t.status.instance);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: t.common.actions,
      className: "text-right",
      srOnlyHeader: true,
      accessor: (instance) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t.instances.actionsAria(instance.name)}
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
              {t.instances.connect}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setInstanceToDelete(instance)}
              variant="destructive"
            >
              <Trash2 aria-hidden />
              {t.instances.delete}
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
              {t.instances.newInstance}
            </Link>
          </Button>
        }
        description={t.instances.description}
        title={t.instances.title}
      />

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          onSubmit={handleFilter}
        >
          <Select
            label={t.common.source}
            onValueChange={(value) => setSource(value as InstanceSource)}
            options={sourceOptions}
            value={source}
          />
          <Input
            error={idError}
            inputMode="numeric"
            label={t.common.id}
            onChange={(event) => setId(event.target.value)}
            placeholder="10"
            value={id}
          />
          <Input
            label={t.common.externalId}
            onChange={(event) => setExternalId(event.target.value)}
            placeholder="instance-id"
            value={externalId}
          />
          <Input
            label={t.common.name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.instances.namePlaceholder}
            value={name}
          />
          <div className="flex items-start sm:col-span-2 lg:col-span-1 lg:pt-6">
            <Button className="w-full lg:w-auto" disabled={loading} type="submit">
              <Filter aria-hidden />
              {loading ? t.common.filtering : t.common.filter}
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
                  {t.instances.newInstance}
                </Link>
              </Button>
            }
            description={t.instances.emptyDescription}
            icon={Smartphone}
            title={t.instances.emptyTitle}
          />
        }
        getRowKey={(instance, index) =>
          String(instance.id ?? instance.externalId ?? instance.name ?? index)
        }
        loading={loading}
        loadingLabel={t.instances.loadingInstances}
      />

      <Modal
        description={t.instances.connectDescription(qrInstanceName)}
        footer={
          <Button onClick={closeConnectionModal} type="button" variant="secondary">
            {t.common.close}
          </Button>
        }
        onOpenChange={(open) => {
          if (!open) closeConnectionModal();
        }}
        open={Boolean(qrCode || pairingCode)}
        title={t.instances.connectTitle}
      >
        <div className="grid gap-4">
          {qrCode ? (
            <div className="mx-auto rounded-lg bg-qr-background p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={t.instances.qrAlt(qrInstanceName)}
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
                {t.instances.pairingCode}
              </p>
              <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-widest">
                {pairingCode}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmationModal
        confirmLabel={t.instances.delete}
        description={
          instanceToDelete
            ? t.instances.deleteConfirm(instanceToDelete.name)
            : ""
        }
        loading={deletingId !== null}
        onCancel={() => setInstanceToDelete(null)}
        onConfirm={() => void handleDelete()}
        open={Boolean(instanceToDelete)}
        title={t.instances.deleteTitle}
      />
    </>
  );
}
