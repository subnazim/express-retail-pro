import type { Prisma, StockMoveReason } from "@prisma/client";

/**
 * Apply a stock movement: upsert ProductStock and create a StockMove row.
 * `quantity` is signed (positive = in, negative = out).
 */
export async function applyStockMove(
  tx: Prisma.TransactionClient,
  args: {
    productId: string;
    branchId: string;
    quantity: number;
    reason: StockMoveReason;
    refId?: string;
    notes?: string;
    date?: Date;
  },
) {
  const { productId, branchId, quantity, reason, refId, notes, date } = args;
  await tx.productStock.upsert({
    where: { productId_branchId: { productId, branchId } },
    create: { productId, branchId, quantity },
    update: { quantity: { increment: quantity } },
  });
  await tx.stockMove.create({
    data: {
      productId,
      branchId,
      quantity,
      reason,
      refId,
      notes,
      date: date ?? new Date(),
    },
  });
}
