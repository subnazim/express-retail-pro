import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { applyStockMove } from "@/lib/stock";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronLeft } from "lucide-react";

async function processReturn(formData: FormData) {
  "use server";
  await requireUser();
  const purchaseId = String(formData.get("purchaseId") || "");
  const reason = String(formData.get("reason") || "") || null;
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });
  if (!purchase) return;
  const lines = purchase.items
    .map((it) => {
      const qty = Number(formData.get(`qty_${it.id}`) || 0);
      return { item: it, qty: Math.max(0, Math.min(qty, it.quantity)) };
    })
    .filter((x) => x.qty > 0);
  if (lines.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const totalAmt = lines.reduce((a, l) => a + l.qty * l.item.cost, 0);
    const ret = await tx.purchaseReturn.create({
      data: {
        purchaseId,
        amount: totalAmt,
        reason,
        items: {
          create: lines.map((l) => ({
            productId: l.item.productId,
            quantity: l.qty,
            cost: l.item.cost,
            total: l.qty * l.item.cost,
          })),
        },
      },
    });
    for (const l of lines) {
      await applyStockMove(tx, {
        productId: l.item.productId,
        branchId: purchase.branchId,
        quantity: -l.qty,
        reason: "PURCHASE_RETURN",
        refId: ret.id,
      });
    }
    await tx.supplierLedger.create({
      data: {
        supplierId: purchase.supplierId,
        refType: "RETURN",
        refId: ret.id,
        debit: totalAmt,
        notes: `Purchase return ${purchase.poNo}`,
      },
    });
  });

  redirect(`/purchases/${purchaseId}`);
}

export default async function PurchaseReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const { id } = await params;
  const p = await prisma.purchase.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!p) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("sales.return")} - ${p.poNo}`}
        action={
          <Link href={`/purchases/${p.id}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <form action={processReturn} className="space-y-4">
            <input type="hidden" name="purchaseId" value={p.id} />
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH className="text-right">Bought {t("common.qty")}</TH>
                  <TH className="text-right">{t("common.cost")}</TH>
                  <TH className="text-right">Return {t("common.qty")}</TH>
                </TR>
              </THead>
              <TBody>
                {p.items.map((it) => (
                  <TR key={it.id}>
                    <TD>{it.product.name}</TD>
                    <TD className="text-right">{it.quantity}</TD>
                    <TD className="text-right">{money(it.cost)}</TD>
                    <TD className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        max={it.quantity}
                        defaultValue="0"
                        name={`qty_${it.id}`}
                        className="w-24 ml-auto"
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
