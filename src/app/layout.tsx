import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { themeModeScript } from "@/components/theme/theme-mode";
import { Toaster } from "@/components/ui/toaster";
import { themeToCssVariables } from "@/lib/theme";
import { getTheme } from "@/lib/theme-server";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getTheme();

  return {
    title: { default: appName, template: `%s · ${appName}` },
    description: `Painel de gerenciamento do ${appName}`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html
      className={cn(geistSans.variable, "h-full antialiased")}
      lang="pt-BR"
      // Only validated hex/radius values (see themeToCssVariables).
      style={themeToCssVariables(theme) as CSSProperties}
      // The inline script below may add `.dark` before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeModeScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider appName={theme.appName} logoUrl={theme.logoUrl}>
          <AppShell>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
