import { errorResponse, getSupportNotificationService, json, requireRequestPrincipal } from "@/lib/server";
export async function GET(request: Request) { try { return json({ items: await getSupportNotificationService().listNotifications(await requireRequestPrincipal(request)) }); } catch (error) { return errorResponse(error); } }
