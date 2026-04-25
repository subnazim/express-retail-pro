import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { applyStockMove } from "@/lib/stock";
import { nextPurchaseNo } from "@/lib/numbering";

const Schema = z.object({
  branchId: z.string().min(1),
  supplierId: z.string().min(1),
  notes: z.string().optional(),
  discount: z.number().min(0).default(0),
  paid: z.number().min(0).default(0),
  accountId: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
        cost: z.number().min(0),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const user = await requireUser();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const data = parsed.data;
  const settings = await getSettings();

  const subtotal = data.items.reduce((a, it) => a + it.quantity * it.cost, 0);
  const total = Math.max(0, subtotal - (data.discount || 0));
  const paid = Math.min(total, data.paid || 0);
  const due = total - paid;
  const paymentStatus = due === 0 ? "PAID" : paid === 0 ? "DUE" : "PARTIAL";

  const purchase = await prisma.$transaction(async (tx) => {
    const poNo = await nextPurchaseNo(settings.purchasePrefix);
    const created = await tx.purchase.create({
      data: {
        poNo,
        branchId: data.branchId,
        supplierId: data.supplierId,
        userId: user.id,
        subtotal,
        discount: data.discount || 0,
        tax: 0,
        total,
        paid,
        due,
        paymentStatus,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            cost: it.cost,
            total: it.quantity * it.cost,
          })),
        },
      },
    });
    for (const it of data.items) {
      await applyStockMove(tx, {
        productId: it.productId,
        branchId: data.branchId,
        quantity: it.quantity,
        reason: "PURCHASE",
        refId: created.id,
      });
      // Update product cost price to latest cost
      await tx.product.update({
        where: { id: it.productId },
        data: { costPrice: it.cost },
      });
    }
    if (total > 0) {
      await tx.supplierLedger.create({
        data: {
          supplierId: data.supplierId,
          refType: "PURCHASE",
          refId: created.id,
          credit: total,
          notes: `Purchase ${poNo}`,
        },
      });
    }
    if (paid > 0) {
      await tx.supplierLedger.create({
        data: {
          supplierId: data.supplierId,
          refType: "PAYMENT",
          refId: created.id,
          debit: paid,
          notes: `Payment for ${poNo}`,
        },
      });
    }
    if (paid > 0 && data.accountId) {
      await tx.accountTxn.create({
        data: {
          accountId: data.accountId,
          type: "CREDIT",
          amount: paid,
          refType: "PURCHASE",
          refId: created.id,
          purchaseId: created.id,
          notes: `Purchase ${poNo}`,
        },
      });
    }
    return created;
  });

  return NextResponse.json({ id: purchase.id, poNo: purchase.poNo });
}
