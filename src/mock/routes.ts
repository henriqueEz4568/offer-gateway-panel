import type {
  GroupStatus,
  ImportGroupsResponse,
  Instance,
  LinkedGroup,
  ResetGroupsResponse,
  SendOfferResponse,
} from "@/lib/types";
import {
  PLACEHOLDER_IMAGE,
  counters,
  evolutionGroups,
  instances,
  linkedGroups,
  offers,
  user,
} from "./data";

type Params = Record<string, string | undefined>;
type Body = Record<string, unknown>;

function matches(text: string, search?: string) {
  return !search || text.toLowerCase().includes(search.toLowerCase());
}

function now() {
  return new Date().toISOString();
}

function login() {
  return { access_token: "mock-token" };
}

function me() {
  return user;
}

function listOffers(params: Params) {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const filtered = offers.filter(
    (offer) =>
      (!params.id || offer.id === params.id) &&
      matches(offer.productName, params.search),
  );

  return filtered.slice((page - 1) * limit, page * limit);
}

function sendOffer(body: Body): SendOfferResponse {
  const offer =
    offers.find((item) => item.id === String(body.offerId)) ?? offers[0];

  return {
    sent: true,
    instanceName: String(body.instance_name ?? instances[0]?.name ?? "mock"),
    description: "Oferta enviada em modo release (dados fictícios).",
    offer,
  };
}

function listInstances(params: Params) {
  return instances.filter(
    (instance) =>
      (!params.id || String(instance.id) === params.id) &&
      (!params.external_id || instance.externalId === params.external_id) &&
      matches(instance.name, params.name),
  );
}

function createInstance(body: Body) {
  counters.instanceId += 1;

  const instance: Instance = {
    id: counters.instanceId,
    externalId: `mock-instance-${counters.instanceId}`,
    type: String(body.type ?? "connection"),
    name: String(body.name ?? `instancia-${counters.instanceId}`),
    number: typeof body.number === "number" ? body.number : undefined,
    token: `mock-token-${counters.instanceId}`,
    connection: { status: "close" },
    created: now(),
    modified: now(),
    removed: null,
  };

  instances.push(instance);
  return instance;
}

function connectInstance(id: number) {
  const instance = instances.find((item) => item.id === id) ?? instances[0];

  instance.connection = {
    status: "connecting",
    base64: PLACEHOLDER_IMAGE,
    pairingCode: "ABCD-1234",
  };
  return instance;
}

function deleteInstance(id: number) {
  const index = instances.findIndex((item) => item.id === id);

  if (index !== -1) {
    instances.splice(index, 1);
  }

  return {};
}

function listGroups(params: Params) {
  if (params.source === "evolution") {
    return evolutionGroups.filter((group) => matches(group.subject, params.search));
  }

  return linkedGroups.filter((group) => matches(group.name, params.search));
}

function linkGroup(groupId: string, body: Body) {
  const status = (body.status as GroupStatus) ?? "pending";
  const existing = linkedGroups.find((group) => group.externalId === groupId);

  if (existing) {
    existing.status = status;
    existing.modified = now();
    return existing;
  }

  const evolution = evolutionGroups.find((group) => group.id === groupId);
  counters.linkedGroupId += 1;

  const linked: LinkedGroup = {
    id: counters.linkedGroupId,
    externalId: groupId,
    name: evolution?.subject ?? groupId,
    status,
    created: now(),
    modified: now(),
  };

  linkedGroups.push(linked);
  return linked;
}

function importGroups(body: Body): ImportGroupsResponse {
  const existing = linkedGroups.length;

  evolutionGroups.forEach((group) => {
    if (!linkedGroups.some((linked) => linked.externalId === group.id)) {
      linkGroup(group.id, { status: body.status ?? "pending" });
    }
  });

  return {
    total: linkedGroups.length,
    created: linkedGroups.length - existing,
    existing,
    groups: linkedGroups,
  };
}

function resetGroups(): ResetGroupsResponse {
  return {
    total: linkedGroups.length,
    created: 0,
    updated: linkedGroups.length,
    deleted: 0,
    groups: linkedGroups,
    deletedGroups: [],
  };
}

// Devolve undefined quando a rota não é mockada (o adapter devolve um padrão).
export function handleRoute(
  method: string,
  path: string,
  params: Params,
  body: Body,
): unknown {
  const route = `${method} ${path}`;

  if (route === "POST /auth/login") return login();
  if (route === "GET /users/me") return me();
  if (route === "GET /offers") return listOffers(params);
  if (route === "POST /offers/send-offer") return sendOffer(body);
  if (route === "GET /instances") return listInstances(params);
  if (route === "POST /instances") return createInstance(body);
  if (route === "POST /instances/import") return instances;
  if (route === "GET /evolution/groups") return listGroups(params);
  if (route === "POST /evolution/groups/import") return importGroups(body);
  if (route === "POST /evolution/groups/reset") return resetGroups();

  const connection = route.match(/^POST \/instances\/(\d+)\/connection$/);
  if (connection) return connectInstance(Number(connection[1]));

  const remove = route.match(/^DELETE \/instances\/(\d+)$/);
  if (remove) return deleteInstance(Number(remove[1]));

  const link = route.match(/^POST \/evolution\/groups\/([^/]+)\/link$/);
  if (link) return linkGroup(decodeURIComponent(link[1]), body);

  return undefined;
}
