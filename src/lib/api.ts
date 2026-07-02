import axios from "axios";
import { getToken, logout } from "./auth";
import type {
  EvolutionGroup,
  GroupStatus,
  Instance,
  LinkedGroup,
  Offer,
  SendOfferPayload,
  SendOfferResponse,
  User,
} from "./types";

function buildBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}

function createInstance() {
  return axios.create({
    baseURL: buildBaseUrl(),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const api = createInstance();
const publicApi = createInstance();

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await publicApi.post<{ access_token: string }>(
      "/auth/login",
      payload,
    );
    return data;
  },
  async me() {
    const { data } = await api.get<User>("/users/me");
    return data;
  },
};

export const offersApi = {
  async list(params: {
    provider_id?: string;
    id?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const { data } = await api.get<Offer[]>("/offers", { params });
    return data;
  },
  async send(payload: SendOfferPayload) {
    const { data } = await api.post<SendOfferResponse>("/offers/send-offer", payload);
    return data;
  },
};

export const instancesApi = {
  async create(payload: { name: string; type?: string; number?: number }) {
    const { data } = await api.post<Instance>("/instances", payload);
    return data;
  },
  async importAll() {
    const { data } = await api.post<Instance[]>("/instances/import");
    return data;
  },
  async connect(id: number) {
    const { data } = await api.post<Instance>(`/instances/${id}/connection`);
    return data;
  },
};

export const groupsApi = {
  async list(params: { instance_name?: string; search?: string }) {
    const { data } = await api.get<EvolutionGroup[]>("/evolution/groups", {
      params,
    });
    return data;
  },
  async link(
    groupId: string,
    payload: { instance_name?: string; status?: GroupStatus },
  ) {
    const { data } = await api.post<LinkedGroup>(
      `/evolution/groups/${encodeURIComponent(groupId)}/link`,
      payload,
    );
    return data;
  },
};
