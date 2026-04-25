import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

export default async function StockReportPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { stocks: true, unit: true },
    orderBy: { name: "asc" },
  });
  const rows = products.map((p) => {
    const qty = p.stocks.reduce((a, s) => a + s.quantity, 0);
    return { ...p, qty, value: qty * p.costPrice };
  });
  const grandValue = rows.reduce((a, r) => a + r.value, 0);
  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.stock")} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("products.sku")}</TH>
                <TH>{t("common.name")}</TH>
                <TH className="text-right">{t("products.cost_price")}</TH>
                <TH className="text-right">{t("common.qty")}</TH>
                <TH className="text-right">Stock Value</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-xs">{p.sku}</TD>
                  <TD>{p.name}</TD>
                  <TD className="text-right">{money(p.costPrice)}</TD>
                  <TD className="text-right">{p.qty}</TD>
                  <TD className="text-right">{money(p.value)}</TD>
                </TR>
              ))}
              <TR className="bg-slate-50 font-semibold">
                <TD colSpan={4}>Total Stock Value</TD>
                <TD className="text-right">{money(grandValue)}</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
