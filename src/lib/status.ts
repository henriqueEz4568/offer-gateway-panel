import type { BadgeVariant } from "@/components/ui/badge";
import type { GroupStatus } from "./types";

type StatusDisplay = { label: string; variant: BadgeVariant };

const instanceStatus: Record<string, StatusDisplay> = {
  open: { label: "Conectada", variant: "success" },
  connecting: { label: "Conectando", variant: "warning" },
  close: { label: "Desconectada", variant: "destructive" },
};

export function getInstanceStatus(status?: string): StatusDisplay {
  if (!status) return { label: "Desconhecido", variant: "neutral" };
  return instanceStatus[status] ?? { label: status, variant: "info" };
}

export const groupStatusLabels: Record<GroupStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  disabled: "Desativado",
};

const groupStatusVariants: Record<GroupStatus, BadgeVariant> = {
  active: "success",
  pending: "warning",
  disabled: "neutral",
};

export function getGroupStatus(status: GroupStatus): StatusDisplay {
  return {
    label: groupStatusLabels[status] ?? status,
    variant: groupStatusVariants[status] ?? "info",
  };
}

export function getOfferStatus(active: boolean): StatusDisplay {
  return active
    ? { label: "Ativa", variant: "success" }
    : { label: "Inativa", variant: "neutral" };
}
