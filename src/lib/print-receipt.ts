import type { CartLine } from "@/components/pos/Cart";
import { getSettings } from "./settings-store";

export type ReceiptOptions = {
  orderNo: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  orderType?: string;
  width?: "58mm" | "80mm";
  shopName?: string;
  shopTagline?: string;
  shopAddress?: string;
  shopPhone?: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

export function printThermalReceipt(opts: ReceiptOptions) {
  const s = getSettings();
  const {
    orderNo,
    lines,
    subtotal,
    tax,
    total,
    orderType = "Dine-in",
    width = "80mm",
    shopName = s.shopName,
    shopTagline = s.shopTagline,
    shopAddress = s.shopAddress,
    shopPhone = s.shopPhone,
  } = opts;
  const vatLabel = `VAT (${s.vatPct}%)`;
  const footer = s.receiptFooter;

  const date = new Date();
  const dateStr = date.toLocaleString();

  const rows = lines
    .map((l) => {
      const name = escapeHtml(l.item.name);
      const qty = l.qty;
      const price = (l.item.price * l.qty).toFixed(2);
      return `
        <tr>
          <td class="qty">${qty}×</td>
          <td class="name">${name}</td>
          <td class="amt">${price}</td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt #${escapeHtml(orderNo)}</title>
<style>
  @page { size: ${width} auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body {
    font-family: "Courier New", ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.35;
    width: ${width};
    padding: 6px 8px 14px;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .lg { font-size: 16px; }
  .xl { font-size: 20px; letter-spacing: 1px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 2px 0; }
  td.qty { width: 28px; }
  td.amt { width: 56px; text-align: right; white-space: nowrap; }
  td.name { word-break: break-word; }
  .totals td { padding: 1px 0; }
  .totals .label { text-align: left; }
  .totals .val { text-align: right; white-space: nowrap; }
  .grand { font-size: 16px; font-weight: 700; }
  .meta { font-size: 11px; }
  .footer { margin-top: 8px; font-size: 11px; }
  @media print { body { width: ${width}; } }
</style>
</head>
<body>
  ${s.logoDataUrl ? `<div class="center"><img src="${s.logoDataUrl}" alt="logo" style="max-width:60%;max-height:80px;object-fit:contain;margin:0 auto 4px;" /></div>` : ""}
  <div class="center xl bold">${escapeHtml(shopName)}</div>
  <div class="center meta">${escapeHtml(shopTagline)}</div>
  <div class="center meta">${escapeHtml(shopAddress)}</div>
  <div class="center meta">Tel: ${escapeHtml(shopPhone)}</div>
  <hr />
  <div class="meta">Order #: <span class="bold">BJ-${escapeHtml(orderNo)}</span></div>
  <div class="meta">Type  : ${escapeHtml(orderType)}</div>
  <div class="meta">Date  : ${escapeHtml(dateStr)}</div>
  <hr />
  <table>${rows}</table>
  <hr />
  <table class="totals">
    <tr><td class="label">Subtotal</td><td class="val">${subtotal.toFixed(2)}</td></tr>
    <tr><td class="label">${escapeHtml(vatLabel)}</td><td class="val">${tax.toFixed(2)}</td></tr>
    <tr><td class="label grand">TOTAL</td><td class="val grand">${total.toFixed(2)}</td></tr>
  </table>
  <hr />
  <div class="center footer bold">${escapeHtml(footer)}</div>
</body>
</html>`;

  // Try a hidden iframe first (cleaner UX); fall back to a popup window.
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    const w = window.open("", "PRINT", "height=600,width=400");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => iframe.remove(), 1000);
    }
  }, 250);
}
