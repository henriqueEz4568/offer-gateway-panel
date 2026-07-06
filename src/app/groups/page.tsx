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

type GroupSource = "database" | "evolution";
type GroupRow = EvolutionGroup | LinkedGroup;

function isLinkedGroup(group: GroupRow): group is LinkedGroup {
  return "externalId" in group;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [source, setSource] = useState<GroupSource>("database");
  const [instanceName, setInstanceName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GroupStatus>("pending");
  const [loading, setLoading] = useState(false);
  // const [importingGroups, setImportingGroups] = useState(false);
  // const [resettingGroups, setResettingGroups] = useState(false);
  const [linkingGroupId, setLinkingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await groupsApi.list({
        source,
        instance_name:
          source === "evolution" ? instanceName.trim() || undefined : undefined,
        search: source === "evolution" ? search.trim() || undefined : undefined,
      });
      setGroups(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [instanceName, search, source]);

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

  // async function handleImportGroups() {
  //   setError(null);
  //   setSuccess(null);
  //
  //   if (!validateGroupStatus(status)) {
  //     setError("Status deve ser disabled, active ou pending.");
  //     return;
  //   }
  //
  //   setImportingGroups(true);
  //
  //   try {
  //     const data = await groupsApi.importAll(
  //       {
  //         instance_name: instanceName.trim() || undefined,
  //         status,
  //       },
  //       { search: search.trim() || undefined },
  //     );
  //     setSource("database");
  //     setGroups(data.groups);
  //     setSuccess(
  //       `${data.total} grupo(s) processado(s): ${data.created} criado(s), ${data.existing} existente(s).`,
  //     );
  //   } catch (err) {
  //     setError(formatApiError(err));
  //   } finally {
  //     setImportingGroups(false);
  //   }
  // }
  //
  // async function handleResetGroups() {
  //   setError(null);
  //   setSuccess(null);
  //   setResettingGroups(true);
  //
  //   try {
  //     const data = await groupsApi.reset({
  //       instance_name: instanceName.trim() || undefined,
  //     });
  //     setSource("database");
  //     setGroups(data.groups);
  //     setSuccess(
  //       `${data.total} grupo(s) sincronizado(s): ${data.created} criado(s), ${data.updated} atualizado(s), ${data.deleted} removido(s).`,
  //     );
  //   } catch (err) {
  //     setError(formatApiError(err));
  //   } finally {
  //     setResettingGroups(false);
  //   }
  // }

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
        setSource("database");
        setGroups((current) => {
          const linkedGroups = current.filter(isLinkedGroup);
          const exists = linkedGroups.some((item) => item.id === linked.id);

          return exists
            ? linkedGroups.map((item) => (item.id === linked.id ? linked : item))
            : [linked, ...linkedGroups];
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

  const columns = useMemo<DataTableColumn<GroupRow>[]>(
    () =>
      source === "database"
        ? [
            {
              header: "ID",
              accessor: (group) => (isLinkedGroup(group) ? group.id : "-"),
              className: "text-center",
            },
            {
              header: "ID externo",
              accessor: (group) =>
                isLinkedGroup(group) ? group.externalId : group.id,
              className: "text-center",
            },
            { header: "Nome", accessor: "name", className: "text-center" },
            {
              header: "Status",
              accessor: (group) => (isLinkedGroup(group) ? group.status : "-"),
              className: "text-center",
            },
          ]
        : [
            { header: "ID externo", accessor: "id", className: "text-center" },
            { header: "Nome", accessor: "name", className: "text-center" },
            {
              header: "Subject",
              accessor: (group) => (isLinkedGroup(group) ? "-" : group.subject),
              className: "text-center",
            },
            {
              header: "Acoes",
              className: "text-center",
              accessor: (group) =>
                isLinkedGroup(group) ? null : (
                  <Button
                    disabled={linkingGroupId === group.id}
                    onClick={() => void handleLink(group)}
                    variant="secondary"
                  >
                    {linkingGroupId === group.id ? "Salvando..." : "Salvar"}
                  </Button>
                ),
            },
          ],
    [handleLink, linkingGroupId, source],
  );

  return (
    <>
      <PageHeader
        description="Liste grupos locais ou consulte diretamente a Evolution API."
        title="Grupos"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card>
        <form
          className="grid gap-4 lg:grid-cols-[minmax(120px,0.7fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(150px,0.8fr)_auto]"
          onSubmit={handleFilter}
        >
          <Select
            label="Source"
            onValueChange={(value) => setSource(value as GroupSource)}
            options={[
              { label: "database", value: "database" },
              { label: "evolution", value: "evolution" },
            ]}
            value={source}
          />
          <Input
            label="Instancia"
            onChange={(event) => setInstanceName(event.target.value)}
            placeholder="minha-instancia"
            value={instanceName}
          />
          <Input
            label="Busca"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou ID do grupo"
            value={search}
          />
          <Select
            label="Status ao salvar"
            onValueChange={(value) => setStatus(value as GroupStatus)}
            options={[
              { label: "pending", value: "pending" },
              { label: "active", value: "active" },
              { label: "disabled", value: "disabled" },
            ]}
            value={status}
          />
          <div className="flex items-end">
            <Button disabled={loading} type="submit">
              {loading ? "Filtrando..." : "Filtrar"}
            </Button>
            {/* <Button
              disabled={importingGroups}
              onClick={() => void handleImportGroups()}
              type="button"
              variant="secondary"
            >
              {importingGroups ? "Importando..." : "Importar resultado"}
            </Button> */}
            {/* <Button
              disabled={resettingGroups}
              onClick={() => void handleResetGroups()}
              type="button"
              variant="outline"
            >
              {resettingGroups ? "Sincronizando..." : "Resetar salvos"}
            </Button> */}
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        data={groups}
        emptyMessage="Nenhum grupo encontrado."
        getRowKey={(group, index) =>
          String(
            isLinkedGroup(group)
              ? group.id
              : group.id ?? group.name ?? group.subject ?? index,
          )
        }
        loading={loading}
        loadingMessage="Carregando grupos..."
      />
    </>
  );
}
