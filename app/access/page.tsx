import type { Metadata } from "next";

import { AccessFlow } from "@/components/access/access-flow";

export const metadata: Metadata = {
  title: "Получение доступа",
  description:
    "Выберите роль, страну и языковое предпочтение, чтобы подготовить сценарий получения доступа к VX House.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessPage() {
  return <AccessFlow />;
}
