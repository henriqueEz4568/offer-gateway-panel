import type { BadgeVariant } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n/dictionaries";
import type { GroupStatus } from "./types";

type StatusDisplay = { label: string; variant: BadgeVariant };
type StatusLabels = Dictionary["status"];

const instanceVariants: Record<string, BadgeVariant> = {
  open: "success",
  connecting: "warning",
  close: "destructive",
};

export function getInstanceStatus(
  status: string | undefined,
  labels: StatusLabels["instance"],
): StatusDisplay {
  if (!status) return { label: labels.unknown, variant: "neutral" };

  const variant = instanceVariants[status];
  return variant
    ? { label: labels[status as keyof typeof labels], variant }
    : { label: status, variant: "info" };
}

export const groupStatuses: GroupStatus[] = ["active", "pending", "disabled"];

const groupStatusVariants: Record<GroupStatus, BadgeVariant> = {
  active: "success",
  pending: "warning",
  disabled: "neutral",
};

export function getGroupStatus(
  status: GroupStatus,
  labels: StatusLabels["group"],
): StatusDisplay {
  return {
    label: labels[status] ?? status,
    variant: groupStatusVariants[status] ?? "info",
  };
}

export function getOfferStatus(
  active: boolean,
  labels: StatusLabels["offer"],
): StatusDisplay {
  return active
    ? { label: labels.active, variant: "success" }
    : { label: labels.inactive, variant: "neutral" };
}
