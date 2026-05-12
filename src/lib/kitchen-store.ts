import { getCurrentUser } from "@/lib/users-store";

export type KitchenAction = {
  id: string;
  at: number;
  ticketId: string;
  action: "start" | "ready" | "bump";
  userId?: string;
  userName?: string;
};

const KEY = "bj_kitchen_actions";
const MAX = 500;

export function getKitchenActions(): KitchenAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordKitchenAction(ticketId: string, action: KitchenAction["action"]) {
  if (typeof window === "undefined") return;
  const me = getCurrentUser();
  const list = getKitchenActions();
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    ticketId,
    action,
    userId: me?.id,
    userName: me?.name,
  });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
