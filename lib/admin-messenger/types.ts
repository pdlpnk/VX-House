import type { SupportConversationView } from "@/lib/support";

export type AdminMessengerPlayer = {
  userId: string;
  conversationId: string;
  name: string;
  email: string;
  initials: string;
  market: string;
  role: "PLAYER";
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
