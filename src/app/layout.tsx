import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { themeModeScript } from "@/components/theme/theme-mode";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary, getLocale } from "@/i18n/server";
import { themeToCssVariables } from "@/lib/theme";
import { getTheme } from "@/lib/theme-server";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const [{ appName }, t] = await Promise.all([getTheme(), getDictionary()]);

  return {
    title: { default: appName, template: `%s · ${appName}` },
    description: t.metadata.description(appName),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, locale] = await Promise.all([getTheme(), getLocale()]);

  return (
    <html
      className={cn(geistSans.variable, "h-full antialiased")}
      lang={locale}
      // Only validated hex/radius values (see themeToCssVariables).
      style={themeToCssVariables(theme) as CSSProperties}
      // The inline script below may add `.dark` before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeModeScript }} />
      </head>
      <body className="min-h-full">
        <I18nProvider initialLocale={locale}>
          <ThemeProvider appName={theme.appName} logoUrl={theme.logoUrl}>
            <AppShell>{children}</AppShell>
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
