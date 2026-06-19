export type ApiError = {
  statusCode?: number;
  message?: string | string[];
};

export type User = {
  id: string;
  dbId: number;
  name: string;
  email: string;
  created: string;
  modified: string;
};

export type Provider = {
  id: string;
  name: string;
};

export type Offer = {
  id: string;
  provider: Provider;
  productName: string;
  comissionRate: number;
  priceDiscountRate: number;
  imageUrl: string;
  amount: number;
  amountToReceive: number;
  active: boolean;
  url: string;
  created: string;
  modified: string;
};

export type SendOfferPayload = {
  to: string;
  delay?: number;
  instance_name?: string;
};

export type SendOfferResponse = {
  sent: boolean;
  instanceName: string;
  description: string;
  offer: Offer;
};

export type Instance = {
  id: number;
  externalId: string;
  type: string;
  name: string;
  number?: number;
  token: string;
  connection?: {
    status: string;
    base64?: string;
  };
  created: string;
  modified: string;
};

export type EvolutionGroup = {
  id: string;
  subject: string;
  name: string;
};

export type LinkedGroup = {
  id: number;
  externalId: string;
  name: string;
  status: "disabled" | "active" | "pending";
  created: string;
  modified: string;
};

export type GroupStatus = LinkedGroup["status"];
