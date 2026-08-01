import { createMonitoringSystem } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await createMonitoringSystem().health.run("readiness");
  return Response.json(report, {
    status: report.status === "healthy" ? 200 : 503,
    headers: {
      "cache-control": "no-store",
    },
  });
}
