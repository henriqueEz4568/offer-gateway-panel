"use client";

import { ExternalLink, PackageSearch, Search, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { OfferThumbnail } from "@/components/offer-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { groupsApi, offersApi } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getOfferStatus, groupStatusLabels } from "@/lib/status";
import type { LinkedGroup, Offer } from "@/lib/types";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

const LIMIT = 20;
const DEFAULT_PROVIDER = "shopee";

type Filters = { providerId: string; offerId: string; search: string };
const DEFAULT_FILTERS: Filters = { providerId: DEFAULT_PROVIDER, offerId: "", search: "" };

type SendErrors = { offerId?: string | null; to?: string | null; delay?: string | null };

export default function OfferPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [providerId, setProviderId] = useState(DEFAULT_PROVIDER);
  const [offerIdFilter, setOfferIdFilter] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [to, setTo] = useState("");
  const [delay, setDelay] = useState("");
  const [sendErrors, setSendErrors] = useState<SendErrors>({});
  const [groups, setGroups] = useState<LinkedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sendingOfferId, setSendingOfferId] = useState<string | null>(null);

  /** Async part only: state is updated in callbacks once the request settles. */
  function fetchOffers(pageToLoad: number, filters: Filters) {
    return offersApi
      .list({
        provider_id: filters.providerId.trim() || undefined,
        id: filters.offerId.trim() || undefined,
        search: filters.search.trim() || undefined,
        limit: LIMIT,
        page: pageToLoad,
      })
      .then((data) => {
        setOffers(data);
        setPage(pageToLoad);
      })
      .catch((err) => {
        toast.error("Não foi possível carregar as ofertas.", {
          description: formatApiError(err),
        });
      })
      .finally(() => setLoading(false));
  }

  function loadOffers(
    pageToLoad: number,
    filters: Filters = { providerId, offerId: offerIdFilter, search },
  ) {
    const validationError = validatePositiveInteger(filters.offerId, "ID");
    setFilterError(validationError);

    if (validationError) return;

    setLoading(true);
    void fetchOffers(pageToLoad, filters);
  }

  function loadGroups() {
    return groupsApi
      .listLinked()
      .then(setGroups)
      .catch((err) => {
        toast.error("Não foi possível carregar os grupos.", {
          description: formatApiError(err),
        });
      })
      .finally(() => setLoadingGroups(false));
  }

  useEffect(() => {
    // Initial load only (state starts as loading); later loads come from the forms.
    void fetchOffers(1, DEFAULT_FILTERS);
    void loadGroups();
  }, []);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadOffers(1);
  }

  function clearFilters() {
    setProviderId(DEFAULT_FILTERS.providerId);
    setOfferIdFilter(DEFAULT_FILTERS.offerId);
    setSearch(DEFAULT_FILTERS.search);
    loadOffers(1, DEFAULT_FILTERS);
  }

  async function sendOffer(offerId: string) {
    const errors: SendErrors = {
      offerId: required(offerId, "Oferta") ?? validatePositiveInteger(offerId, "ID da oferta"),
      to: to ? null : "Selecione um grupo de destino.",
      delay: validatePositiveInteger(delay, "Atraso"),
    };
    setSendErrors(errors);

    if (errors.offerId || errors.to || errors.delay) {
      toast.error("Revise os dados de envio.", {
        description: errors.to ?? errors.offerId ?? errors.delay ?? undefined,
      });
      return;
    }

    setSendingOfferId(offerId);

    try {
      const data = await offersApi.send({
        offerId: offerId.trim(),
        to: to.trim(),
        ...(delay.trim() ? { delay: Number(delay) } : {}),
      });
      toast.success("Oferta enviada.", {
        description: `Enviada pela instância ${data.instanceName}.`,
      });
    } catch (err) {
      toast.error("Não foi possível enviar a oferta.", {
        description: formatApiError(err),
      });
    } finally {
      setSendingOfferId(null);
    }
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendOffer(selectedOfferId);
  }

  const columns: DataTableColumn<Offer>[] = [
    {
      header: "Produto",
      accessor: (offer) => (
        <div className="flex max-w-md items-center gap-3">
          <OfferThumbnail alt={offer.productName} src={offer.imageUrl} />
          <div className="min-w-0">
            <p className="line-clamp-2 font-medium">{offer.productName}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{offer.provider.name}</span>
              <span aria-hidden>·</span>
              <a
                className="inline-flex items-center gap-1 rounded-sm underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                href={offer.url}
                rel="noreferrer"
                target="_blank"
              >
                Abrir oferta
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "ID",
      accessor: (offer) => (
        <span className="font-mono text-xs text-muted-foreground">{offer.id}</span>
      ),
    },
    {
      header: "Preço",
      className: "text-right",
      accessor: (offer) => (
        <span className="font-medium tabular-nums">{formatCurrency(offer.amount)}</span>
      ),
    },
    {
      header: "Comissão",
      className: "text-right",
      accessor: (offer) => (
        <span className="tabular-nums">{formatPercent(offer.comissionRate)}</span>
      ),
    },
    {
      header: "Você recebe",
      className: "text-right",
      accessor: (offer) => (
        <span className="font-medium tabular-nums text-success">
          {formatCurrency(offer.amountToReceive)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (offer) => {
        const status = getOfferStatus(offer.active);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: "Ação",
      className: "text-right",
      accessor: (offer) => (
        <Button
          aria-label={`Enviar oferta ${offer.productName}`}
          disabled={sendingOfferId === offer.id}
          onClick={() => {
            setSelectedOfferId(offer.id);
            void sendOffer(offer.id);
          }}
          size="sm"
          variant="secondary"
        >
          <Send aria-hidden />
          {sendingOfferId === offer.id ? "Enviando..." : "Enviar"}
        </Button>
      ),
    },
  ];

  const groupOptions = groups.map((group) => ({
    label: `${group.name} (${groupStatusLabels[group.status] ?? group.status})`,
    value: group.externalId,
  }));

  return (
    <>
      <PageHeader
        description="Liste, filtre e envie ofertas para grupos de WhatsApp pela instância configurada."
        title="Ofertas"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Filtros</CardTitle>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleFilter}>
            <Input
              label="Provedor"
              onChange={(event) => setProviderId(event.target.value)}
              placeholder="shopee"
              value={providerId}
            />
            <Input
              error={filterError}
              inputMode="numeric"
              label="ID"
              onChange={(event) => setOfferIdFilter(event.target.value)}
              placeholder="20099553879"
              value={offerIdFilter}
            />
            <Input
              containerClassName="sm:col-span-2"
              label="Busca"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome do produto"
              type="search"
              value={search}
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={loading} type="submit">
                <Search aria-hidden />
                {loading ? "Buscando..." : "Buscar ofertas"}
              </Button>
              <Button disabled={loading} onClick={clearFilters} type="button" variant="ghost">
                Limpar
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle className="mb-4">Enviar oferta</CardTitle>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSend}>
            <Input
              error={sendErrors.offerId}
              hint="Clique em Enviar na tabela ou digite o ID."
              inputMode="numeric"
              label="ID da oferta"
              onChange={(event) => setSelectedOfferId(event.target.value)}
              placeholder="20099553879"
              value={selectedOfferId}
            />
            <Input
              error={sendErrors.delay}
              hint="Opcional, em milissegundos."
              inputMode="numeric"
              label="Atraso"
              onChange={(event) => setDelay(event.target.value)}
              placeholder="1000"
              value={delay}
            />
            <Select
              containerClassName="sm:col-span-2"
              disabled={loadingGroups || groupOptions.length === 0}
              error={sendErrors.to}
              hint={
                !loadingGroups && groupOptions.length === 0
                  ? "Nenhum grupo salvo. Salve um grupo na página Grupos."
                  : undefined
              }
              label="Destino"
              onValueChange={(value) => {
                setTo(value);
                setSendErrors((current) => ({ ...current, to: null }));
              }}
              options={groupOptions}
              placeholder={loadingGroups ? "Carregando grupos..." : "Selecione um grupo"}
              value={to}
            />
            <div className="sm:col-span-2">
              <Button disabled={sendingOfferId !== null} type="submit">
                <Send aria-hidden />
                {sendingOfferId !== null && sendingOfferId === selectedOfferId
                  ? "Enviando..."
                  : "Enviar oferta"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={offers}
        emptyState={
          <EmptyState
            action={
              <Button onClick={clearFilters} size="sm" variant="secondary">
                Limpar filtros
              </Button>
            }
            description="Ajuste os filtros ou busque por outro produto."
            icon={PackageSearch}
            title="Nenhuma oferta encontrada"
          />
        }
        getRowKey={(offer) => `${offer.provider.id}-${offer.id}`}
        limit={LIMIT}
        loading={loading}
        loadingLabel="Carregando ofertas..."
        onPaginationChange={({ page: nextPage }) => loadOffers(nextPage)}
        page={page}
        paginationEnabled
      />
    </>
  );
}
