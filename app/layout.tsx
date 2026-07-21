import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "VX House — платформа лояльности и сотрудничества",
    template: "%s | VX House",
  },
  description:
    "VX House объединяет персональные условия, понятные инструкции, проверку результатов и сотрудничество с партнёрскими сервисами для совершеннолетних пользователей в Турции и Азербайджане.",
  applicationName: "VX House",
  keywords: [
    "VX House",
    "платформа лояльности",
    "партнёрские сервисы",
    "персональные условия",
    "Турция",
    "Азербайджан",
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
    title: "VX House — платформа лояльности и сотрудничества",
    description:
      "Понятный путь от доступной возможности до проверенного результата — для совершеннолетних пользователей и партнёров в Турции и Азербайджане.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "VX House — платформа лояльности и сотрудничества",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VX House — платформа лояльности и сотрудничества",
    description:
      "Понятный путь от доступной возможности до проверенного результата для пользователей и партнёров.",
    images: ["/og.png"],
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
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background font-sans text-foreground antialiased`}
      >
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
