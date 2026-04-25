import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { applyStockMove } from "@/lib/stock";
import { nextInvoiceNo } from "@/lib/numbering";

const SaleSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().nullable().optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).default(0),
  paid: z.number().min(0).default(0),
  accountId: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
        price: z.number().min(0),
        discount: z.number().min(0).default(0),
        taxPercent: z.number().min(0).default(0),
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
  const parsed = SaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const data = parsed.data;
  const settings = await getSettings();

  const subtotal = data.items.reduce(
    (a, it) => a + it.quantity * it.price - (it.discount || 0),
    0,
  );
  const tax = data.items.reduce(
    (a, it) =>
      a +
      ((it.quantity * it.price - (it.discount || 0)) * (it.taxPercent || 0)) / 100,
    0,
  );
  const total = Math.max(0, subtotal + tax - (data.discount || 0));
  const paid = Math.min(total, data.paid || 0);
  const due = total - paid;
  const paymentStatus = due === 0 ? "PAID" : paid === 0 ? "DUE" : "PARTIAL";

  const sale = await prisma.$transaction(async (tx) => {
    const invoiceNo = await nextInvoiceNo(settings.invoicePrefix);
    const created = await tx.sale.create({
      data: {
        invoiceNo,
        branchId: data.branchId,
        customerId: data.customerId || null,
        userId: user.id,
        subtotal,
        discount: data.discount || 0,
        tax,
        total,
        paid,
        due,
        paymentStatus,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
            discount: it.discount || 0,
            taxPercent: it.taxPercent || 0,
            total:
              it.quantity * it.price -
              (it.discount || 0) +
              ((it.quantity * it.price - (it.discount || 0)) *
                (it.taxPercent || 0)) /
                100,
          })),
        },
      },
    });

    // Stock movements (out of branch)
    for (const it of data.items) {
      await applyStockMove(tx, {
        productId: it.productId,
        branchId: data.branchId,
        quantity: -it.quantity,
        reason: "SALE",
        refId: created.id,
      });
    }

    // Customer ledger
    if (data.customerId) {
      if (total > 0) {
        await tx.customerLedger.create({
          data: {
            customerId: data.customerId,
            refType: "SALE",
            refId: created.id,
            debit: total,
            notes: `Sale ${invoiceNo}`,
          },
        });
      }
      if (paid > 0) {
        await tx.customerLedger.create({
          data: {
            customerId: data.customerId,
            refType: "PAYMENT",
            refId: created.id,
            credit: paid,
            notes: `Payment for ${invoiceNo}`,
          },
        });
      }
    }

    // Cash/Bank entry
    if (paid > 0 && data.accountId) {
      await tx.accountTxn.create({
        data: {
          accountId: data.accountId,
          type: "DEBIT",
          amount: paid,
          refType: "SALE",
          refId: created.id,
          saleId: created.id,
          notes: `Sale ${invoiceNo}`,
        },
      });
    }

    return created;
  });

  return NextResponse.json({ id: sale.id, invoiceNo: sale.invoiceNo });
}
