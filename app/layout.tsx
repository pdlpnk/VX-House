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
    default: "VX House",
    template: "%s | VX House",
  },
  description:
    "VX House — приватная игровая экосистема с особыми условиями, вознаграждениями и персональным сопровождением.",
  applicationName: "VX House",
  keywords: [
    "VX House",
    "игровая платформа",
    "приватная экосистема",
    "премиальное сообщество",
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
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "VX House",
    title: "VX House",
    description:
      "Приватная игровая экосистема с особыми условиями и персональным сопровождением.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VX House",
    description:
      "Приватная игровая экосистема с особыми условиями и персональным сопровождением.",
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
