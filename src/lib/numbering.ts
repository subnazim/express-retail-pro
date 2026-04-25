import { prisma } from "./prisma";

export async function nextInvoiceNo(prefix: string) {
  const count = await prisma.sale.count();
  const n = String(count + 1).padStart(6, "0");
  return `${prefix}${n}`;
}

export async function nextPurchaseNo(prefix: string) {
  const count = await prisma.purchase.count();
  const n = String(count + 1).padStart(6, "0");
  return `${prefix}${n}`;
}
