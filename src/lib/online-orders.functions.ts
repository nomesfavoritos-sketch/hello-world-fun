import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { OnlineOrder, OnlineOrderLine, OnlineOrderStatus, OnlineOrderType } from "./online-orders-store";

const lineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

const statusSchema = z.enum(["New", "Accepted", "Preparing", "Ready", "Out for Delivery", "Completed", "Cancelled"]);

type OnlineOrderRow = {
  id: string;
  customer: string;
  phone: string;
  address: string | null;
  type: string;
  notes: string | null;
  lines: unknown;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  status: string;
  created_at: string;
};

function toOrder(row: OnlineOrderRow): OnlineOrder {
  return {
    id: row.id,
    customer: row.customer,
    phone: row.phone,
    address: row.address || undefined,
    type: row.type as OnlineOrderType,
    notes: row.notes || undefined,
    lines: (Array.isArray(row.lines) ? row.lines : []) as OnlineOrderLine[],
    subtotal: Number(row.subtotal) || 0,
    tax: Number(row.tax) || 0,
    total: Number(row.total) || 0,
    status: row.status as OnlineOrderStatus,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const fetchOnlineOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("online_orders")
    .select("id,customer,phone,address,type,notes,lines,subtotal,tax,total,status,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => toOrder(row as OnlineOrderRow));
});

export const createOnlineOrder = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        customer: z.string().trim().min(2),
        phone: z.string().trim().min(6),
        address: z.string().trim().optional(),
        type: z.enum(["Delivery", "Pickup", "Dine-in"]),
        notes: z.string().trim().optional(),
        lines: z.array(lineSchema).min(1),
        vatPct: z.number().min(0).max(100).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const subtotal = data.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const tax = subtotal * ((data.vatPct ?? 5) / 100);
    const total = subtotal + tax;
    const orderId = `OL-${Date.now().toString(36).toUpperCase()}`;

    const { data: inserted, error } = await supabaseAdmin
      .from("online_orders")
      .insert({
        id: orderId,
        customer: data.customer,
        phone: data.phone,
        address: data.address || null,
        type: data.type,
        notes: data.notes || null,
        lines: data.lines,
        subtotal,
        tax,
        total,
        status: "New",
      })
      .select("id,customer,phone,address,type,notes,lines,subtotal,tax,total,status,created_at")
      .single();

    if (error) throw new Error(error.message);
    return toOrder(inserted as OnlineOrderRow);
  });

export const setOnlineOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1), status: statusSchema }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("online_orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeOnlineOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("online_orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });