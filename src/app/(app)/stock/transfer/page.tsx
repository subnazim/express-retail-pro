import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { applyStockMove } from "@/lib/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";

async function createTransfer(formData: FormData) {
  "use server";
  const user = await requireUser();
  const productId = String(formData.get("productId") || "");
  const fromBranchId = String(formData.get("fromBranchId") || "");
  const toBranchId = String(formData.get("toBranchId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const notes = String(formData.get("notes") || "") || null;
  if (!productId || !fromBranchId || !toBranchId || quantity <= 0) return;
  if (fromBranchId === toBranchId) return;
  await prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.create({
      data: {
        productId,
        fromBranchId,
        toBranchId,
        quantity,
        notes,
        userId: user.id,
      },
    });
    await applyStockMove(tx, {
      productId,
      branchId: fromBranchId,
      quantity: -quantity,
      reason: "TRANSFER_OUT",
      refId: transfer.id,
    });
    await applyStockMove(tx, {
      productId,
      branchId: toBranchId,
      quantity,
      reason: "TRANSFER_IN",
      refId: transfer.id,
    });
  });
  revalidatePath("/stock/transfer");
}

export default async function StockTransferPage() {
  await requireUser();
  const { t } = await getT();
  const [products, branches, transfers] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.stockTransfer.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { product: true, fromBranch: true, toBranch: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.stock_transfer")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.stock_transfer")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTransfer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="productId">{t("common.name")}</Label>
              <Select id="productId" name="productId" required>
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fromBranchId">From</Label>
              <Select id="fromBranchId" name="fromBranchId" required>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toBranchId">To</Label>
              <Select id="toBranchId" name="toBranchId" required>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{t("common.qty")}</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Input id="notes" name="notes" />
            </div>
            <div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transfers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.name")}</TH>
                <TH>From</TH>
                <TH>To</TH>
                <TH className="text-right">{t("common.qty")}</TH>
              </TR>
            </THead>
            <TBody>
              {transfers.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                transfers.map((tr) => (
                  <TR key={tr.id}>
                    <TD>{formatDate(tr.date)}</TD>
                    <TD>{tr.product.name}</TD>
                    <TD>{tr.fromBranch.name}</TD>
                    <TD>{tr.toBranch.name}</TD>
                    <TD className="text-right">{tr.quantity}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
