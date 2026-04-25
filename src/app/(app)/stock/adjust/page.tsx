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

async function createAdjust(formData: FormData) {
  "use server";
  const user = await requireUser();
  const productId = String(formData.get("productId") || "");
  const branchId = String(formData.get("branchId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const reason = String(formData.get("reason") || "") || null;
  if (!productId || !branchId || quantity === 0) return;
  await prisma.$transaction(async (tx) => {
    const adj = await tx.stockAdjustment.create({
      data: { productId, branchId, quantity, reason, userId: user.id },
    });
    await applyStockMove(tx, {
      productId,
      branchId,
      quantity,
      reason: "ADJUSTMENT",
      refId: adj.id,
      notes: reason ?? undefined,
    });
  });
  revalidatePath("/stock/adjust");
}

export default async function StockAdjustPage() {
  await requireUser();
  const { t } = await getT();
  const [products, branches, adjs] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.stockAdjustment.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { product: true, branch: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.stock_adjust")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.stock_adjust")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAdjust} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
              <Label htmlFor="branchId">{t("common.branch")}</Label>
              <Select id="branchId" name="branchId" required>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">
                {t("common.qty")} (+/-)
              </Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">{t("common.notes")}</Label>
              <Input id="reason" name="reason" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">{t("common.create")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent adjustments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.name")}</TH>
                <TH>{t("common.branch")}</TH>
                <TH className="text-right">{t("common.qty")}</TH>
                <TH>{t("common.notes")}</TH>
              </TR>
            </THead>
            <TBody>
              {adjs.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                adjs.map((a) => (
                  <TR key={a.id}>
                    <TD>{formatDate(a.date)}</TD>
                    <TD>{a.product.name}</TD>
                    <TD>{a.branch.name}</TD>
                    <TD className="text-right">{a.quantity}</TD>
                    <TD>{a.reason || "—"}</TD>
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
