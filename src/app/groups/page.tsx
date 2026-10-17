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
import { useI18n } from "@/i18n/provider";
import { groupsApi } from "@/lib/api";
import { getGroupStatus, groupStatuses } from "@/lib/status";
import type { EvolutionGroup, GroupStatus, LinkedGroup } from "@/lib/types";
import { formatApiError, validateGroupStatus } from "@/lib/validation";

type GroupSource = "database" | "evolution";
type GroupRow = EvolutionGroup | LinkedGroup;

function isLinkedGroup(group: GroupRow): group is LinkedGroup {
  return "externalId" in group;
}

export default function GroupsPage() {
  const { t } = useI18n();
  const sourceOptions = [
    { label: t.common.sourceDatabase, value: "database" },
    { label: t.common.sourceEvolution, value: "evolution" },
  ];
  const statusOptions = groupStatuses.map((value) => ({
    label: t.status.group[value],
    value,
  }));
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
        toast.error(t.groups.loadError, {
          description: formatApiError(err, t.validation.apiFallback),
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
      toast.error(t.groups.invalidStatus);
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
      toast.success(t.groups.saved(linked.name), {
        description: t.groups.savedStatus(t.status.group[linked.status] ?? linked.status),
      });
    } catch (err) {
      toast.error(t.groups.saveError, {
        description: formatApiError(err, t.validation.apiFallback),
      });
    } finally {
      setLinkingGroupId(null);
    }
  }

  const columns: DataTableColumn<GroupRow>[] =
    loadedSource === "database"
      ? [
          {
            header: t.common.name,
            accessor: (group) => <span className="font-medium">{group.name}</span>,
          },
          {
            header: t.common.id,
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">
                {isLinkedGroup(group) ? group.id : "—"}
              </span>
            ),
          },
          {
            header: t.common.externalId,
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">
                {isLinkedGroup(group) ? group.externalId : group.id}
              </span>
            ),
          },
          {
            header: t.common.status,
            accessor: (group) => {
              if (!isLinkedGroup(group)) return "—";
              const display = getGroupStatus(group.status, t.status.group);
              return <Badge variant={display.variant}>{display.label}</Badge>;
            },
          },
        ]
      : [
          {
            header: t.common.name,
            accessor: (group) => <span className="font-medium">{group.name}</span>,
          },
          {
            header: t.common.externalId,
            accessor: (group) => (
              <span className="font-mono text-xs text-muted-foreground">{group.id}</span>
            ),
          },
          {
            header: t.groups.subject,
            accessor: (group) => (isLinkedGroup(group) ? "—" : group.subject),
          },
          {
            header: t.common.action,
            className: "text-right",
            accessor: (group) =>
              isLinkedGroup(group) ? null : (
                <Button
                  aria-label={t.groups.saveAria(group.name)}
                  disabled={linkingGroupId === group.id}
                  onClick={() => void handleLink(group)}
                  size="sm"
                  variant="secondary"
                >
                  <Save aria-hidden />
                  {linkingGroupId === group.id ? t.common.saving : t.common.save}
                </Button>
              ),
          },
        ];

  return (
    <>
      <PageHeader
        description={t.groups.description}
        title={t.groups.title}
      />

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          onSubmit={handleFilter}
        >
          <Select
            label={t.common.source}
            onValueChange={(value) => setSource(value as GroupSource)}
            options={sourceOptions}
            value={source}
          />
          <Input
            disabled={source !== "evolution"}
            hint={source !== "evolution" ? t.groups.evolutionOnly : undefined}
            label={t.common.instance}
            onChange={(event) => setInstanceName(event.target.value)}
            placeholder={t.instances.namePlaceholder}
            value={instanceName}
          />
          <Input
            disabled={source !== "evolution"}
            label={t.common.search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.groups.searchPlaceholder}
            type="search"
            value={search}
          />
          <Select
            label={t.groups.statusOnSave}
            onValueChange={(value) => setStatus(value as GroupStatus)}
            options={statusOptions}
            value={status}
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
                  {t.groups.searchEvolution}
                </Button>
              ) : undefined
            }
            description={
              loadedSource === "database"
                ? t.groups.emptyDatabase
                : t.groups.emptyEvolution
            }
            icon={Users}
            title={t.groups.emptyTitle}
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
        loadingLabel={t.groups.loadingGroups}
      />
    </>
  );
}
