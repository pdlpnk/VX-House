import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "VX House — специальные условия и вознаграждения",
    template: "%s | VX House",
  },
  description:
    "Получайте доступ к специальным условиям, заданиям, программам лояльности и вознаграждениям от партнёров в VX House.",
  applicationName: "VX House",
  keywords: [
    "VX House",
    "специальные условия",
    "программы лояльности",
    "задания",
    "вознаграждения",
  ],
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
    locale: "ru_RU",
    siteName: "VX House",
    title: "VX House — специальные условия и вознаграждения",
    description:
      "Специальные условия, задания, программы лояльности и вознаграждения от партнёров — с правилами и сроками заранее.",
    images: [
      {
        url: "/og-landing-v2.png",
        width: 1536,
        height: 1024,
        alt: "VX House — специальные условия и вознаграждения",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VX House — специальные условия и вознаграждения",
    description:
      "Специальные условия, задания, программы лояльности и вознаграждения от партнёров.",
    images: ["/og-landing-v2.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background font-sans text-foreground antialiased`}
      >
        <I18nProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
