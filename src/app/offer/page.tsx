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
import { useI18n } from "@/i18n/provider";
import { groupsApi, offersApi } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getOfferStatus } from "@/lib/status";
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
  const { locale, t } = useI18n();
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
        toast.error(t.offers.loadError, {
          description: formatApiError(err, t.validation.apiFallback),
        });
      })
      .finally(() => setLoading(false));
  }

  function loadOffers(
    pageToLoad: number,
    filters: Filters = { providerId, offerId: offerIdFilter, search },
  ) {
    const validationError = validatePositiveInteger(
      filters.offerId,
      t.common.id,
      t.validation,
    );
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
        toast.error(t.offers.loadGroupsError, {
          description: formatApiError(err, t.validation.apiFallback),
        });
      })
      .finally(() => setLoadingGroups(false));
  }

  useEffect(() => {
    // Initial load only (state starts as loading); later loads come from the forms.
    void fetchOffers(1, DEFAULT_FILTERS);
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      offerId:
        required(offerId, t.offers.offer, t.validation) ??
        validatePositiveInteger(offerId, t.offers.offerId, t.validation),
      to: to ? null : t.offers.selectGroupError,
      delay: validatePositiveInteger(delay, t.offers.delay, t.validation),
    };
    setSendErrors(errors);

    if (errors.offerId || errors.to || errors.delay) {
      toast.error(t.offers.reviewSend, {
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
      toast.success(t.offers.sent, {
        description: t.offers.sentBy(data.instanceName),
      });
    } catch (err) {
      toast.error(t.offers.sendError, {
        description: formatApiError(err, t.validation.apiFallback),
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
      header: t.offers.product,
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
                {t.offers.openOffer}
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">{t.common.opensInNewTab}</span>
              </a>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: t.common.id,
      accessor: (offer) => (
        <span className="font-mono text-xs text-muted-foreground">{offer.id}</span>
      ),
    },
    {
      header: t.offers.price,
      className: "text-right",
      accessor: (offer) => (
        <span className="font-medium tabular-nums">{formatCurrency(offer.amount, locale)}</span>
      ),
    },
    {
      header: t.offers.commission,
      className: "text-right",
      accessor: (offer) => (
        <span className="tabular-nums">{formatPercent(offer.comissionRate, locale)}</span>
      ),
    },
    {
      header: t.offers.youReceive,
      className: "text-right",
      accessor: (offer) => (
        <span className="font-medium tabular-nums text-success">
          {formatCurrency(offer.amountToReceive, locale)}
        </span>
      ),
    },
    {
      header: t.common.status,
      accessor: (offer) => {
        const status = getOfferStatus(offer.active, t.status.offer);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: t.common.action,
      className: "text-right",
      accessor: (offer) => (
        <Button
          aria-label={t.offers.sendOfferAria(offer.productName)}
          disabled={sendingOfferId === offer.id}
          onClick={() => {
            setSelectedOfferId(offer.id);
            void sendOffer(offer.id);
          }}
          size="sm"
          variant="secondary"
        >
          <Send aria-hidden />
          {sendingOfferId === offer.id ? t.common.sending : t.common.send}
        </Button>
      ),
    },
  ];

  const groupOptions = groups.map((group) => ({
    label: `${group.name} (${t.status.group[group.status] ?? group.status})`,
    value: group.externalId,
  }));

  return (
    <>
      <PageHeader
        description={t.offers.description}
        title={t.offers.title}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">{t.offers.filters}</CardTitle>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleFilter}>
            <Input
              label={t.offers.provider}
              onChange={(event) => setProviderId(event.target.value)}
              placeholder="shopee"
              value={providerId}
            />
            <Input
              error={filterError}
              inputMode="numeric"
              label={t.common.id}
              onChange={(event) => setOfferIdFilter(event.target.value)}
              placeholder="20099553879"
              value={offerIdFilter}
            />
            <Input
              containerClassName="sm:col-span-2"
              label={t.common.search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.offers.searchPlaceholder}
              type="search"
              value={search}
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={loading} type="submit">
                <Search aria-hidden />
                {loading ? t.offers.searching : t.offers.searchSubmit}
              </Button>
              <Button disabled={loading} onClick={clearFilters} type="button" variant="ghost">
                {t.offers.clear}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle className="mb-4">{t.offers.sendTitle}</CardTitle>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSend}>
            <Input
              error={sendErrors.offerId}
              hint={t.offers.offerIdHint}
              inputMode="numeric"
              label={t.offers.offerId}
              onChange={(event) => setSelectedOfferId(event.target.value)}
              placeholder="20099553879"
              value={selectedOfferId}
            />
            <Input
              error={sendErrors.delay}
              hint={t.offers.delayHint}
              inputMode="numeric"
              label={t.offers.delay}
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
                  ? t.offers.noGroups
                  : undefined
              }
              label={t.offers.destination}
              onValueChange={(value) => {
                setTo(value);
                setSendErrors((current) => ({ ...current, to: null }));
              }}
              options={groupOptions}
              placeholder={loadingGroups ? t.offers.loadingGroups : t.offers.selectGroup}
              value={to}
            />
            <div className="sm:col-span-2">
              <Button disabled={sendingOfferId !== null} type="submit">
                <Send aria-hidden />
                {sendingOfferId !== null && sendingOfferId === selectedOfferId
                  ? t.common.sending
                  : t.offers.sendSubmit}
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
                {t.offers.clearFilters}
              </Button>
            }
            description={t.offers.emptyDescription}
            icon={PackageSearch}
            title={t.offers.emptyTitle}
          />
        }
        getRowKey={(offer) => `${offer.provider.id}-${offer.id}`}
        limit={LIMIT}
        loading={loading}
        loadingLabel={t.offers.loadingOffers}
        onPaginationChange={({ page: nextPage }) => loadOffers(nextPage)}
        page={page}
        paginationEnabled
      />
    </>
  );
}
