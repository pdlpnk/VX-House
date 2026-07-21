import type { Metadata } from "next";

import { AccessFlow } from "@/components/access/access-flow";

export const metadata: Metadata = {
  title: "Получение доступа",
  description:
    "Начало безопасного пути к личному пространству VX House.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessPage() {
  return <AccessFlow />;
}
