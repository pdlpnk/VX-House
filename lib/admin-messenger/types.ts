import type { SupportConversationView } from "@/lib/support";

export const ADMIN_MESSENGER_ROLES = ["PLAYER", "PARTNER"] as const;
export type AdminMessengerRole = (typeof ADMIN_MESSENGER_ROLES)[number];

export function isAdminMessengerRole(value: string): value is AdminMessengerRole {
  return ADMIN_MESSENGER_ROLES.some((role) => role === value);
}

export type AdminMessengerPlayer = {
  userId: string;
  conversationId: string;
  name: string;
  email: string;
  initials: string;
  market: string;
  role: AdminMessengerRole;
  registeredAt: string;
  online: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  hasNotes: boolean;
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
    rank: string;
    points: number;
    currentTask: string;
    lastAction: string;
    profileHref: string;
  };
  conversation: SupportConversationView;
  notes: AdminMessengerNote[];
};

export type AdminMessengerList = {
  items: AdminMessengerPlayer[];
  unreadCount: number;
};
