"use client";

import { Filter, Save, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { groupsApi } from "@/lib/api";
import { getGroupStatus, groupStatusLabels } from "@/lib/status";
import type { EvolutionGroup, GroupStatus, LinkedGroup } from "@/lib/types";
import { formatApiError, validateGroupStatus } from "@/lib/validation";

type GroupSource = "database" | "evolution";
type GroupRow = EvolutionGroup | LinkedGroup;

const sourceOptions = [
  { label: "Banco de dados", value: "database" },
  { label: "Evolution API", value: "evolution" },
];

const statusOptions = (Object.keys(groupStatusLabels) as GroupStatus[]).map(
  (value) => ({ label: groupStatusLabels[value], value }),
);

function isLinkedGroup(group: GroupRow): group is LinkedGroup {
  return "externalId" in group;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [source, setSource] = useState<GroupSource>("database");
  // Source of the rows currently displayed (the filter may change before submit).
  const [loadedSource, setLoadedSource] = useState<GroupSource>("database");
  const [instanceName, setInstanceName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GroupStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [linkingGroupId, setLinkingGroupId] = useState<string | null>(null);

  /** Async part only: state is updated in callbacks once the request settles. */
  function fetchGroups(sourceToLoad: GroupSource) {
    const fromEvolution = sourceToLoad === "evolution";

    return groupsApi
      .list({
        source: sourceToLoad,
        instance_name: fromEvolution ? instanceName.trim() || undefined : undefined,
        search: fromEvolution ? search.trim() || undefined : undefined,
      })
      .then((data) => {
        setGroups(data);
        setLoadedSource(sourceToLoad);
      })
      .catch((err) => {
        toast.error("Não foi possível carregar os grupos.", {
          description: formatApiError(err),
        });
      })
      .finally(() => setLoading(false));
  }

  function loadGroups(sourceToLoad = source) {
    setLoading(true);
    void fetchGroups(sourceToLoad);
  }

  useEffect(() => {
    // Initial load only (state starts as loading); later loads come from the form.
    void fetchGroups("database");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadGroups();
  }

  async function handleLink(group: EvolutionGroup) {
    if (!validateGroupStatus(status)) {
      toast.error("Status deve ser ativo, pendente ou desativado.");
      return;
    }

    setLinkingGroupId(group.id);

    try {
      const linked = await groupsApi.link(group.id, {
        instance_name: instanceName.trim() || undefined,
        status,
      });
      setSource("database");
      setLoadedSource("database");
      setGroups((current) => {
        const linkedGroups = current.filter(isLinkedGroup);
        const exists = linkedGroups.some((item) => item.id === linked.id);

        return exists
          ? linkedGroups.map((item) => (item.id === linked.id ? linked : item))
          : [linked, ...linkedGroups];
      });
      toast.success(`Grupo ${linked.name} salvo.`, {
        description: `Status: ${groupStatusLabels[linked.status] ?? linked.status}.`,
      });
    } catch (err) {
      toast.error("Não foi possível salvar o grupo.", {
        description: formatApiError(err),
      });
    } finally {
      setLinkingGroupId(null);
    }
  }

  const columns: DataTableColumn<GroupRow>[] =
    loadedSource === "database"
      ? [
          {
            header: "Nome",
            accessor: (group) => <span className="font-medium">{group.name}</span>,
          },
          {
            header: "ID",
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">
                {isLinkedGroup(group) ? group.id : "—"}
              </span>
            ),
          },
          {
            header: "ID externo",
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">
                {isLinkedGroup(group) ? group.externalId : group.id}
              </span>
            ),
          },
          {
            header: "Status",
            accessor: (group) => {
              if (!isLinkedGroup(group)) return "—";
              const display = getGroupStatus(group.status);
              return <Badge variant={display.variant}>{display.label}</Badge>;
            },
          },
        ]
      : [
          {
            header: "Nome",
            accessor: (group) => <span className="font-medium">{group.name}</span>,
          },
          {
            header: "ID externo",
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">{group.id}</span>
            ),
          },
          {
            header: "Assunto",
            accessor: (group) => (isLinkedGroup(group) ? "—" : group.subject),
          },
          {
            header: "Ação",
            className: "text-right",
            accessor: (group) =>
              isLinkedGroup(group) ? null : (
                <Button
                  aria-label={`Salvar grupo ${group.name}`}
                  disabled={linkingGroupId === group.id}
                  onClick={() => void handleLink(group)}
                  size="sm"
                  variant="secondary"
                >
                  <Save aria-hidden />
                  {linkingGroupId === group.id ? "Salvando..." : "Salvar"}
                </Button>
              ),
          },
        ];

  return (
    <>
      <PageHeader
        description="Liste grupos salvos ou consulte diretamente a Evolution API para salvar novos."
        title="Grupos"
      />

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          onSubmit={handleFilter}
        >
          <Select
            label="Origem"
            onValueChange={(value) => setSource(value as GroupSource)}
            options={sourceOptions}
            value={source}
          />
          <Input
            disabled={source !== "evolution"}
            hint={source !== "evolution" ? "Disponível na Evolution API." : undefined}
            label="Instância"
            onChange={(event) => setInstanceName(event.target.value)}
            placeholder="minha-instancia"
            value={instanceName}
          />
          <Input
            disabled={source !== "evolution"}
            label="Busca"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou ID do grupo"
            type="search"
            value={search}
          />
          <Select
            label="Status ao salvar"
            onValueChange={(value) => setStatus(value as GroupStatus)}
            options={statusOptions}
            value={status}
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
        data={groups}
        emptyState={
          <EmptyState
            action={
              loadedSource === "database" ? (
                <Button
                  onClick={() => {
                    setSource("evolution");
                    loadGroups("evolution");
                  }}
                  size="sm"
                  variant="secondary"
                >
                  Buscar na Evolution API
                </Button>
              ) : undefined
            }
            description={
              loadedSource === "database"
                ? "Busque grupos na Evolution API e salve os que devem receber ofertas."
                : "Confira o nome da instância ou ajuste a busca."
            }
            icon={Users}
            title="Nenhum grupo encontrado"
          />
        }
        getRowKey={(group, index) =>
          String(
            isLinkedGroup(group)
              ? group.id
              : group.id ?? group.name ?? group.subject ?? index,
          )
        }
        loading={loading}
        loadingLabel="Carregando grupos..."
      />
    </>
  );
}
