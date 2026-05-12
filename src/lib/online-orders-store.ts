import type { MenuItem } from "./menu-data";

export type OnlineOrderType = "Delivery" | "Pickup" | "Dine-in";
export type OnlineOrderStatus =
  | "New"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Out for Delivery"
  | "Completed"
  | "Cancelled";

export type OnlineOrderLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type OnlineOrder = {
  id: string;
  customer: string;
  phone: string;
  address?: string;
  type: OnlineOrderType;
  notes?: string;
  lines: OnlineOrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: OnlineOrderStatus;
  createdAt: number;
};

const KEY = "bj_online_orders";
const EVT = "bj:online-orders-changed";

export function getOnlineOrders(): OnlineOrder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(list: OnlineOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function placeOnlineOrder(args: {
  customer: string;
  phone: string;
  address?: string;
  type: OnlineOrderType;
  notes?: string;
  lines: { item: MenuItem; qty: number }[];
  vatPct?: number;
}): OnlineOrder {
  const subtotal = args.lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const tax = subtotal * ((args.vatPct ?? 5) / 100);
  const order: OnlineOrder = {
    id: `OL-${Math.floor(Date.now() / 1000) % 100000}`,
    customer: args.customer,
    phone: args.phone,
    address: args.address,
    type: args.type,
    notes: args.notes,
    lines: args.lines.map((l) => ({
      id: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
    })),
    subtotal,
    tax,
    total: subtotal + tax,
    status: "New",
    createdAt: Date.now(),
  };
  const list = getOnlineOrders();
  persist([order, ...list]);
  return order;
}

export function updateOnlineOrderStatus(id: string, status: OnlineOrderStatus) {
  const list = getOnlineOrders().map((o) => (o.id === id ? { ...o, status } : o));
  persist(list);
}

export function deleteOnlineOrder(id: string) {
  persist(getOnlineOrders().filter((o) => o.id !== id));
}

export function onOnlineOrdersChange(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

// Push an accepted online delivery order into the rider trips queue
export function pushToDeliveryTrips(order: OnlineOrder, assignedBy?: string | null) {
  if (typeof window === "undefined") return;
  if (order.type !== "Delivery") return;
  type Trip = {
    id: string;
    customer: string;
    phone: string;
    addr: string;
    amount: number;
    riderId: string | null;
    assignedBy?: string | null;
    stage: "Pending" | "Assigned" | "Picked Up" | "On the Way" | "Delivered" | "Cancelled";
    eta: number;
    createdAt: number;
  };
  let existing: Trip[] = [];
  try {
    existing = JSON.parse(localStorage.getItem("bj_trips") || "[]");
  } catch {
    existing = [];
  }
  if (existing.some((t) => t.id === order.id)) return;
  const trip: Trip = {
    id: order.id,
    customer: order.customer,
    phone: order.phone,
    addr: order.address || "—",
    amount: order.total,
    riderId: null,
    assignedBy: assignedBy ?? null,
    stage: "Pending",
    eta: 30,
    createdAt: Date.now(),
  };
  localStorage.setItem("bj_trips", JSON.stringify([trip, ...existing]));
}
