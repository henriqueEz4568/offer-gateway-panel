"use client";

import {
  Boxes,
  LogOut,
  Menu,
  Smartphone,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/provider";
import { authApi } from "@/lib/api";
import { getToken, logout, subscribeToToken } from "@/lib/auth";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isMock } from "@/mock";
import { MockBanner } from "@/mock/mock-banner";

const PUBLIC_ROUTES = ["/login"];

const navItems: {
  href: string;
  label: keyof Pick<Dictionary["shell"], "offers" | "instances" | "groups">;
  icon: LucideIcon;
}[] = [
  { href: "/offer", label: "offers", icon: Tag },
  { href: "/instances", label: "instances", icon: Smartphone },
  { href: "/groups", label: "groups", icon: Users },
];

/** `undefined` while hydrating (unknown), then the token or `null`. */
function useToken() {
  return useSyncExternalStore(subscribeToToken, getToken, () => undefined);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const token = useToken();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    authApi
      .me()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        // A 401 already logs out via the API interceptor; the menu just
        // shows a generic label otherwise.
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return <ShellSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent user={user} />
      </aside>

      <Sheet onOpenChange={setMenuOpen} open={menuOpen} title={t.shell.menuTitle}>
        <SidebarContent onNavigate={() => setMenuOpen(false)} user={user} />
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Button
            aria-expanded={menuOpen}
            aria-label={t.shell.openMenu}
            onClick={() => setMenuOpen(true)}
            size="icon-sm"
            variant="ghost"
          >
            <Menu />
          </Button>
          <Brand />
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        {isMock() ? <MockBanner className="lg:left-64" /> : null}
      </div>
    </div>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  const { appName, logoUrl } = useTheme();

  return (
    <Link
      className="flex min-w-0 items-center gap-2.5 rounded-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href="/offer"
      onClick={onNavigate}
    >
      {logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- remote logo from the theme API */
        <img
          alt=""
          className="size-8 shrink-0 rounded-md object-contain"
          height={32}
          src={logoUrl}
          width={32}
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes aria-hidden className="size-4" />
        </span>
      )}
      <span className="truncate">{appName}</span>
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user: User | null;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      <div className="flex h-16 items-center px-5">
        <Brand onNavigate={onNavigate} />
      </div>

      <nav aria-label={t.shell.navLabel} className="flex-1 px-3 py-2">
        <ul className="grid gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  href={href}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden className="size-4" />
                  {t.shell[label]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-3 border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">{t.theme.label}</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t.language.label}
          </span>
          <LanguageSwitcher />
        </div>
        <UserMenu user={user} />
      </div>
    </>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function UserMenu({ user }: { user: User | null }) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
          type="button"
        >
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
          >
            {user ? initials(user.name) : "…"}
          </span>
          <span className="grid min-w-0 flex-1 text-sm leading-tight">
            {user ? (
              <>
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </>
            ) : (
              <>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-1 h-3 w-32" />
                <span className="sr-only">{t.shell.account}</span>
              </>
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" side="top">
        {user ? (
          <>
            <DropdownMenuLabel>
              <span className="block truncate font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={logout} variant="destructive">
          <LogOut aria-hidden />
          {t.shell.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShellSkeleton() {
  const { t } = useI18n();

  return (
    <div aria-busy className="min-h-screen bg-background lg:pl-64">
      <span className="sr-only">{t.common.loading}</span>
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar p-5 lg:block">
        <Skeleton className="h-8 w-36" />
        <div className="mt-8 grid gap-2">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
