import type { EvolutionGroup, Instance, LinkedGroup, Offer, User } from "@/lib/types";

const DATE = "2026-01-01T12:00:00.000Z";

// Imagem pequena usada como foto de oferta e como QR code fictício.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3IDciIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyI+PHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iNyIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wIDBoM3YzSDB6TTQgMGgzdjNINHpNMCA0aDN2M0gwek00IDRoMXYxSDR6TTYgNmgxdjFINnpNNSA1aDF2MUg1eiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==";

export const user: User = {
  id: "mock-user",
  dbId: 1,
  name: "Usuário Demo",
  email: "demo@offergateway.dev",
  created: DATE,
  modified: DATE,
};

const productNames = [
  "Fone Bluetooth",
  "Smartwatch",
  "Cafeteira Elétrica",
  "Mochila Notebook",
  "Teclado Mecânico",
  "Mouse Sem Fio",
  "Luminária LED",
  "Garrafa Térmica",
  "Caixa de Som",
  "Carregador Turbo",
  "Câmera de Segurança",
  "Air Fryer",
];

export const offers: Offer[] = productNames.map((productName, index) => ({
  id: String(index + 1),
  provider: { id: "shopee", name: "Shopee" },
  productName,
  comissionRate: 0.1,
  priceDiscountRate: 15,
  imageUrl: PLACEHOLDER_IMAGE,
  amount: 100 + index * 10,
  amountToReceive: 10 + index,
  active: true,
  url: `https://example.com/oferta/${index + 1}`,
  created: DATE,
  modified: DATE,
}));

export const instances: Instance[] = [
  {
    id: 1,
    externalId: "mock-instance-1",
    type: "connection",
    name: "instancia-principal",
    number: 5511999990001,
    token: "mock-token-1",
    connection: { status: "open" },
    created: DATE,
    modified: DATE,
    removed: null,
  },
  {
    id: 2,
    externalId: "mock-instance-2",
    type: "connection",
    name: "instancia-reserva",
    number: 5511999990002,
    token: "mock-token-2",
    connection: { status: "close" },
    created: DATE,
    modified: DATE,
    removed: null,
  },
];

export const evolutionGroups: EvolutionGroup[] = [
  { id: "120363000000000001@g.us", subject: "Promoções Gerais", name: "Promoções Gerais" },
  { id: "120363000000000002@g.us", subject: "Ofertas Tech", name: "Ofertas Tech" },
  { id: "120363000000000003@g.us", subject: "Casa e Cozinha", name: "Casa e Cozinha" },
  { id: "120363000000000004@g.us", subject: "Cupons do Dia", name: "Cupons do Dia" },
  { id: "120363000000000005@g.us", subject: "Moda e Beleza", name: "Moda e Beleza" },
  { id: "120363000000000006@g.us", subject: "Achadinhos", name: "Achadinhos" },
];

export const linkedGroups: LinkedGroup[] = evolutionGroups
  .slice(0, 3)
  .map((group, index) => ({
    id: index + 1,
    externalId: group.id,
    name: group.name,
    status: index === 0 ? "active" : "pending",
    created: DATE,
    modified: DATE,
  }));

export const counters = {
  instanceId: instances.length,
  linkedGroupId: linkedGroups.length,
};
