import type { Metadata } from "next";

import { AccessFlow } from "@/components/access/access-flow";

export const metadata: Metadata = {
  title: "Access",
  description:
    "Create or access your private VX House account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessPage() {
  return <AccessFlow />;
}
