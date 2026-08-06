import { disconnectDatabase } from "../lib/db/index.ts";
import { getAnalyticsSystem } from "../lib/server/analytics.ts";

try {
  const result = await getAnalyticsSystem().service.deliverPending(100);
  console.info(JSON.stringify({ component: "analytics-outbox", ...result }));
} finally {
  await disconnectDatabase();
}

