import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: { className: "border-info/30 bg-info/10 text-info", icon: Info },
  error: {
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: CircleAlert,
  },
  success: {
    className: "border-success/30 bg-success/10 text-success",
    icon: CircleCheck,
  },
};

export function Alert({
  children,
  className,
  tone = "info",
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof tones;
}) {
  const { className: toneClassName, icon: Icon } = tones[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        toneClassName,
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
