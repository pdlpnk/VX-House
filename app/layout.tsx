import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cache } from "react";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import {
  fromDatabaseLanguage,
  languagesFromAcceptLanguage,
  LOCALE_COOKIE,
  resolveLocalePriority,
  translate,
  type Locale,
} from "@/lib/i18n";
import { getIdentitySystem } from "@/lib/server/identity-delivery";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  applicationName: "VX House",
  authors: [{ name: "VX House" }],
  creator: "VX House",
  publisher: "VX House",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "VX House",
    images: [
      {
        url: "/og-landing-v2.png",
        width: 1536,
        height: 1024,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-landing-v2.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const openGraphLocales: Readonly<Record<Locale, string>> = {
  en: "en_US",
  ru: "ru_RU",
  tr: "tr_TR",
  az: "az_AZ",
};

const metadataKeywords: Readonly<Record<Locale, string[]>> = {
  en: ["VX House", "special terms", "loyalty programs", "tasks", "rewards"],
  ru: ["VX House", "специальные условия", "программы лояльности", "задания", "вознаграждения"],
  tr: ["VX House", "özel koşullar", "sadakat programları", "görevler", "ödüller"],
  az: ["VX House", "xüsusi şərtlər", "loyallıq proqramları", "tapşırıqlar", "mükafatlar"],
};

function cookieValue(cookieHeader: string | null, name: string) {
  for (const part of cookieHeader?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

async function profileLocale(requestHeaders: Headers): Promise<Locale | null> {
  try {
    const request = new Request("https://vxhouse.online/", { headers: requestHeaders });
    const system = getIdentitySystem();
    const authentication = await system.authentication.authenticate(system.cookies.read(request));
    if (!authentication.ok || authentication.principal.roleKeys.includes("admin")) return null;
    const snapshot = await system.onboarding.getSnapshot(authentication.principal);
    return snapshot.profile ? fromDatabaseLanguage(snapshot.profile.preferredLanguage) : null;
  } catch {
    return null;
  }
}

const requestLocale = cache(async () => {
  const requestHeaders = await headers();
  return resolveLocalePriority({
    profileValue: await profileLocale(requestHeaders),
    savedValue: cookieValue(requestHeaders.get("cookie"), LOCALE_COOKIE),
    browserLanguages: languagesFromAcceptLanguage(requestHeaders.get("accept-language")),
  });
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requestLocale();
  const title = `VX House — ${translate(locale, "hero.badge")}`;
  const description = translate(locale, "hero.description");

  return {
    ...baseMetadata,
    title: { default: title, template: "%s | VX House" },
    description,
    keywords: metadataKeywords[locale],
    openGraph: {
      ...baseMetadata.openGraph,
      locale: openGraphLocales[locale],
      title,
      description,
      images: [{ url: "/og-landing-v2.png", width: 1536, height: 1024, alt: title }],
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resolution = await requestLocale();

  return (
    <html lang={resolution.locale} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background font-sans text-foreground antialiased`}
      >
        <I18nProvider initialLocale={resolution.locale} initialSource={resolution.source}>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
