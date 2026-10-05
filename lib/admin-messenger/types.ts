import type { SupportConversationView } from "@/lib/support";
import type { AdminTagAssignmentView, AdminTagView } from "@/lib/admin-tags";
import type { MarketCode } from "@/lib/domain/entities";

export const MESSENGER_GEOS = [{ code: "TR", label: "TR" }, { code: "AZ", label: "AZ" }, { code: "IR", label: "IRN" }] as const;
export function isMessengerGeo(value: unknown): value is MarketCode {
  return MESSENGER_GEOS.some(({ code }) => code === value);
}

export const ADMIN_MESSENGER_ROLES = ["PLAYER", "PARTNER"] as const;
export type AdminMessengerRole = (typeof ADMIN_MESSENGER_ROLES)[number];
export type AdminMessengerScope = "active" | "archive";

export function isAdminMessengerRole(value: string): value is AdminMessengerRole {
  return ADMIN_MESSENGER_ROLES.some((role) => role === value);
}

export type AdminMessengerPlayer = {
  userId: string;
  vxId: string;
  conversationId: string;
  name: string;
  email: string;
  avatarEmoji: string | null;
  market: string;
  marketCode: MarketCode;
  role: AdminMessengerRole;
  registeredAt: string;
  online: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  hasNotes: boolean;
  tags: AdminTagAssignmentView[];
};

export type AdminMessengerNote = {
  id: string;
  logicalId: string;
  body: string;
  author: string;
  createdAt: string;
  modifiedAt: string | null;
  edited: boolean;
};

export type AdminMessengerDetail = {
  player: AdminMessengerPlayer & {
    profileHref: string;
  };
  conversation: SupportConversationView;
  notes: AdminMessengerNote[];
};

export type AdminMessengerList = {
  items: AdminMessengerPlayer[];
  unreadCount: number;
  tags: AdminTagView[];
};
