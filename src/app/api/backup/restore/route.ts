import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

type AnyRow = Record<string, unknown> & { id: string };

async function upsertMany<T extends AnyRow>(
  tx: Prisma.TransactionClient,
  modelName: keyof Prisma.TransactionClient,
  rows: T[],
) {
  if (!rows?.length) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (tx as any)[modelName];
  for (const row of rows) {
    const data = { ...row };
    await model.upsert({
      where: { id: row.id },
      create: data,
      update: data,
    });
  }
}

export async function POST(req: NextRequest) {
  await requireRole(["ADMIN"]);
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }
  if (!payload || typeof payload !== "object" || !("version" in payload)) {
    return NextResponse.json(
      { ok: false, error: "Backup file missing version field" },
      { status: 400 },
    );
  }

  const get = <T extends AnyRow>(key: string): T[] => {
    const v = (payload as Record<string, unknown>)[key];
    return Array.isArray(v) ? (v as T[]) : [];
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        // Independent / parent tables first
        await upsertMany(tx, "setting", get("settings"));
        await upsertMany(tx, "branch", get("branches"));
        await upsertMany(tx, "category", get("categories"));
        await upsertMany(tx, "unit", get("units"));
        // Users: backup excludes passwordHash for safety, so only update
        // existing rows; new users in the backup are skipped.
        for (const row of get("users")) {
          const existing = await tx.user.findUnique({ where: { id: row.id } });
          if (!existing) continue;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...rest } = row;
          await tx.user.update({
            where: { id: row.id },
            data: rest as Prisma.UserUpdateInput,
          });
        }
        await upsertMany(tx, "product", get("products"));
        await upsertMany(tx, "productStock", get("productStocks"));
        await upsertMany(tx, "customer", get("customers"));
        await upsertMany(tx, "supplier", get("suppliers"));
        await upsertMany(tx, "account", get("accounts"));
        await upsertMany(tx, "expenseCategory", get("expenseCategories"));
        await upsertMany(tx, "employee", get("employees"));

        // Transactional tables
        await upsertMany(tx, "customerLedger", get("customerLedger"));
        await upsertMany(tx, "supplierLedger", get("supplierLedger"));
        await upsertMany(tx, "sale", get("sales"));
        await upsertMany(tx, "saleItem", get("saleItems"));
        await upsertMany(tx, "saleReturn", get("saleReturns"));
        await upsertMany(tx, "saleReturnItem", get("saleReturnItems"));
        await upsertMany(tx, "purchase", get("purchases"));
        await upsertMany(tx, "purchaseItem", get("purchaseItems"));
        await upsertMany(tx, "purchaseReturn", get("purchaseReturns"));
        await upsertMany(tx, "purchaseReturnItem", get("purchaseReturnItems"));
        await upsertMany(tx, "stockMove", get("stockMoves"));
        await upsertMany(tx, "stockTransfer", get("stockTransfers"));
        await upsertMany(tx, "stockAdjustment", get("stockAdjustments"));
        await upsertMany(tx, "expense", get("expenses"));
        await upsertMany(tx, "accountTxn", get("accountTxns"));
        await upsertMany(tx, "salaryPayment", get("salaryPayments"));
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Restore failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
