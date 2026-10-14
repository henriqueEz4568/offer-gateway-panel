import axios from "axios";
import { isMock, mockAdapter } from "@/mock";
import { getToken, logout } from "./auth";
import type {
  EvolutionGroup,
  GroupStatus,
  ImportGroupsResponse,
  Instance,
  LinkedGroup,
  Offer,
  ResetGroupsResponse,
  SendOfferPayload,
  SendOfferResponse,
  User,
} from "./types";

function buildBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    baseUrl.startsWith("http://")
  ) {
    return "/api/proxy";
  }

  return baseUrl;
}

function createInstance() {
  return axios.create({
    adapter: isMock() ? mockAdapter : undefined,
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
  async list(params: {
    source?: "database" | "evolution";
    id?: string;
    external_id?: string;
    name?: string;
  }) {
    const { data } = await api.get<Instance[]>("/instances", { params });
    return data;
  },
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
  async delete(id: number) {
    await api.delete(`/instances/${id}`);
  },
};

export const groupsApi = {
  async list(params: {
    source: "database" | "evolution";
    instance_name?: string;
    search?: string;
  }) {
    const { data } = await api.get<(EvolutionGroup | LinkedGroup)[]>(
      "/evolution/groups",
      { params },
    );
    return data;
  },
  async listEvolution(params: { instance_name?: string; search?: string }) {
    const { data } = await api.get<EvolutionGroup[]>("/evolution/groups", {
      params: { ...params, source: "evolution" },
    });
    return data;
  },
  async listLinked() {
    const { data } = await api.get<LinkedGroup[]>("/evolution/groups", {
      params: { source: "database" },
    });
    return data;
  },
  async importAll(
    payload: { instance_name?: string; status?: GroupStatus },
    params?: { search?: string },
  ) {
    const { data } = await api.post<ImportGroupsResponse>(
      "/evolution/groups/import",
      payload,
      { params },
    );
    return data;
  },
  async reset(payload: { instance_name?: string }) {
    const { data } = await api.post<ResetGroupsResponse>(
      "/evolution/groups/reset",
      payload,
    );
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
