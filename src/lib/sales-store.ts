import type { CartLine } from "@/components/pos/Cart";
import { getCurrentUser } from "@/lib/users-store";

export type SaleRecord = {
  id: string;
  orderNo: string;
  at: number; // timestamp
  type: string; // Dine-in / Takeaway / Delivery / Dine-in · Table X
  lines: { id: string; name: string; category: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  userId?: string;
  userName?: string;
  userRole?: string;
};

const KEY = "bj_sales";
const MAX = 500;

export function getSales(): SaleRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordSale(args: {
  orderNo: string;
  type: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  userId?: string;
  userName?: string;
  userRole?: string;
}) {
  if (typeof window === "undefined") return;
  const me = getCurrentUser();
  const list = getSales();
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderNo: args.orderNo,
    at: Date.now(),
    type: args.type,
    lines: args.lines.map((l) => ({
      id: l.item.id,
      name: l.item.name,
      category: l.item.category,
      qty: l.qty,
      price: l.item.price,
    })),
    subtotal: args.subtotal,
    tax: args.tax,
    total: args.total,
    userId: args.userId ?? me?.id,
    userName: args.userName ?? me?.name,
    userRole: args.userRole ?? me?.role,
  });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearSales() {
  localStorage.removeItem(KEY);
}
