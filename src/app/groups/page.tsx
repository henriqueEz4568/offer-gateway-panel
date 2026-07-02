"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { groupsApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { EvolutionGroup, GroupStatus, LinkedGroup } from "@/lib/types";
import {
  formatApiError,
  validateGroupStatus,
} from "@/lib/validation";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<EvolutionGroup[]>([]);
  const [linkedGroups, setLinkedGroups] = useState<LinkedGroup[]>([]);
  const [instanceName, setInstanceName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GroupStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [linkingGroupId, setLinkingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadGroups() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await groupsApi.list({
        instance_name: instanceName.trim() || undefined,
        search: search.trim() || undefined,
      });
      setGroups(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => void loadGroups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadGroups();
  }

  const handleLink = useCallback(
    async (group: EvolutionGroup) => {
      setError(null);
      setSuccess(null);

      if (!validateGroupStatus(status)) {
        setError("Status deve ser disabled, active ou pending.");
        return;
      }

      setLinkingGroupId(group.id);

      try {
        const linked = await groupsApi.link(group.id, {
          instance_name: instanceName.trim() || undefined,
          status,
        });
        setLinkedGroups((current) => {
          const exists = current.some((item) => item.id === linked.id);
          return exists
            ? current.map((item) => (item.id === linked.id ? linked : item))
            : [linked, ...current];
        });
        setSuccess(`Grupo ${linked.name} linkado com status ${linked.status}.`);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLinkingGroupId(null);
      }
    },
    [instanceName, status],
  );

  const groupColumns = useMemo<DataTableColumn<EvolutionGroup>[]>(
    () => [
      { header: "ID externo", accessor: "id" },
      { header: "Nome", accessor: "name" },
      { header: "Subject", accessor: "subject" },
      {
        header: "Acao",
        accessor: (group) => (
          <Button
            disabled={linkingGroupId === group.id}
            onClick={() => void handleLink(group)}
            variant="secondary"
          >
            {linkingGroupId === group.id ? "Linkando..." : "Linkar database"}
          </Button>
        ),
      },
    ],
    [handleLink, linkingGroupId],
  );

  const linkedColumns = useMemo<DataTableColumn<LinkedGroup>[]>(
    () => [
      { header: "ID", accessor: "id" },
      { header: "ID externo", accessor: "externalId" },
      { header: "Nome", accessor: "name" },
      { header: "Status", accessor: "status" },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        description="Liste grupos da Evolution API e cadastre o vinculo local no database."
        title="Grupos"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card>
        <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleFilter}>
          <Input
            className="lg:col-span-2"
            label="Instancia"
            onChange={(event) => setInstanceName(event.target.value)}
            placeholder="minha-instancia"
            value={instanceName}
          />
          <Input
            className="lg:col-span-2"
            label="Busca"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou ID do grupo"
            value={search}
          />
          <Select
            label="Status ao linkar"
            onValueChange={(value) => setStatus(value as GroupStatus)}
            options={[
              { label: "pending", value: "pending" },
              { label: "active", value: "active" },
              { label: "disabled", value: "disabled" },
            ]}
            value={status}
          />
          <div className="flex items-end lg:col-span-5">
            <Button disabled={loading} type="submit">
              {loading ? "Carregando..." : "Buscar grupos"}
            </Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">
          Grupos da Evolution
        </h2>
        <DataTable
          columns={groupColumns}
          data={groups}
          emptyMessage={loading ? "Carregando grupos..." : "Nenhum grupo encontrado."}
          getRowKey={(group) => group.id}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">
          Grupos linkados nesta sessao
        </h2>
        <DataTable
          columns={linkedColumns}
          data={linkedGroups}
          emptyMessage="Nenhum grupo linkado nesta sessao."
          getRowKey={(group) => String(group.id)}
        />
      </section>
    </>
  );
}
