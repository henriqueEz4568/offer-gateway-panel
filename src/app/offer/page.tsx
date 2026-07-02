"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { isAuthenticated } from "@/lib/auth";
import { groupsApi, offersApi } from "@/lib/api";
import type { LinkedGroup, Offer, SendOfferResponse } from "@/lib/types";
import {
  formatApiError,
  required,
  validatePositiveInteger,
} from "@/lib/validation";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function OfferPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [providerId, setProviderId] = useState("shopee");
  const [offerIdFilter, setOfferIdFilter] = useState("");
  const [search, setSearch] = useState("");
  const [limit] = useState(20);
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [to, setTo] = useState("");
  const [delay, setDelay] = useState("");
  const [groups, setGroups] = useState<LinkedGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sendingOfferId, setSendingOfferId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadOffers(pageToLoad = page, limitToLoad = limit) {
    setError(null);
    setSuccess(null);

    const validationError = validatePositiveInteger(offerIdFilter, "ID");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = await offersApi.list({
        provider_id: providerId.trim() || undefined,
        id: offerIdFilter.trim() || undefined,
        search: search.trim() || undefined,
        limit: limitToLoad,
        page: pageToLoad,
      });
      setOffers(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    setLoadingGroups(true);

    try {
      const data = await groupsApi.listLinked();
      setGroups(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingGroups(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => void loadOffers());
    queueMicrotask(() => void loadGroups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadOffers(1);
  }

  async function handlePaginationChange({
    page: nextPage,
    limit: nextLimit,
  }: {
    page: number;
    limit: number;
  }) {
    await loadOffers(nextPage, nextLimit);
  }

  const sendOffer = useCallback(async ({ offerId }: { offerId: string }) => {
    setError(null);
    setSuccess(null);

    const validationError =
      validatePositiveInteger(offerId, "Offer ID") ??
      required(to, "Destino") ??
      validatePositiveInteger(delay, "Delay");

    if (validationError) {
      setError(validationError);
      return;
    }

    setSendingOfferId(offerId);

    try {
      const payload = {
        offerId: offerId.trim(),
        to: to.trim(),
        ...(delay.trim() ? { delay: Number(delay) } : {}),
      };
      const data: SendOfferResponse = await offersApi.send(payload);

      setSuccess(`Offer enviada pela instancia ${data.instanceName}.`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSendingOfferId(null);
    }
  }, [delay, to]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendOffer({ offerId: selectedOfferId });
  }

  const columns = useMemo<DataTableColumn<Offer>[]>(
    () => [
      {
        header: "Produto",
        accessor: (offer) => (
          <div className="max-w-sm">
            <p className="font-medium text-zinc-950">{offer.productName}</p>
            <a
              className="text-xs text-zinc-500 underline underline-offset-2"
              href={offer.url}
              rel="noreferrer"
              target="_blank"
            >
              Abrir offer
            </a>
          </div>
        ),
      },
      { header: "ID", accessor: "id" },
      {
        header: "Provider",
        accessor: (offer) => offer.provider.name,
      },
      {
        header: "Valor",
        accessor: (offer) => moneyFormatter.format(offer.amount),
      },
      {
        header: "Comissao",
        accessor: (offer) => `${offer.comissionRate}%`,
      },
      {
        header: "Receber",
        accessor: (offer) => moneyFormatter.format(offer.amountToReceive),
      },
      {
        header: "Status",
        accessor: (offer) => (offer.active ? "Ativa" : "Inativa"),
      },
      {
        header: "Acao",
        accessor: (offer) => (
          <Button
            disabled={sendingOfferId === offer.id}
            onClick={() => void sendOffer({ offerId: offer.id })}
            variant="secondary"
          >
            {sendingOfferId === offer.id ? "Enviando..." : "Enviar"}
          </Button>
        ),
      },
    ],
    [sendOffer, sendingOfferId],
  );

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        label: `${group.name} (${group.status})`,
        value: group.externalId,
      })),
    [groups],
  );

  return (
    <>
      <PageHeader
        description="Liste, filtre e envie offers para um WhatsApp usando a instancia configurada."
        title="Offers"
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card>
        <form className="grid gap-4 lg:grid-cols-4" onSubmit={handleFilter}>
          <Input
            label="Provider"
            onChange={(event) => setProviderId(event.target.value)}
            placeholder="shopee"
            value={providerId}
          />
          <Input
            inputMode="numeric"
            label="ID"
            onChange={(event) => setOfferIdFilter(event.target.value)}
            placeholder="20099553879"
            value={offerIdFilter}
          />
          <Input
            className="lg:col-span-2"
            label="Busca"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Produto"
            value={search}
          />
          <div className="flex items-end lg:col-span-4">
            <Button disabled={loading} type="submit">
              {loading ? "Carregando..." : "Buscar offers"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-zinc-950">
          Enviar offer
        </h2>
        <form className="grid gap-4 lg:grid-cols-4" onSubmit={handleSend}>
          <Input
            inputMode="numeric"
            label="Offer ID"
            onChange={(event) => setSelectedOfferId(event.target.value)}
            placeholder="Selecione na tabela ou digite"
            value={selectedOfferId}
          />
          <Select
            disabled={loadingGroups || groupOptions.length === 0}
            label="Destino"
            onValueChange={setTo}
            options={groupOptions}
            placeholder={
              loadingGroups ? "Carregando grupos..." : "Selecione um grupo"
            }
            value={to}
          />
          <Input
            inputMode="numeric"
            label="Delay"
            onChange={(event) => setDelay(event.target.value)}
            placeholder="1000"
            value={delay}
          />
          <div className="flex items-end">
            <Button disabled={sendingOfferId === selectedOfferId} type="submit">
              {sendingOfferId === selectedOfferId ? "Enviando..." : "Enviar offer"}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        data={offers}
        emptyMessage="Nenhuma offer encontrada."
        getRowKey={(offer) => `${offer.provider.id}-${offer.id}`}
        limit={limit}
        loading={loading}
        loadingMessage="Carregando offers..."
        onPaginationChange={(pagination) => void handlePaginationChange(pagination)}
        page={page}
        paginationEnabled
        setPage={setPage}
      />
    </>
  );
}
