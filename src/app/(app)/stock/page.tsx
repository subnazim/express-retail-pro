import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function StockPage() {
  await requireUser();
  const { t } = await getT();
  const [products, branches] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { stocks: true, unit: true, category: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("stock.report")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("stock.report")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("products.sku")}</TH>
                <TH>{t("common.name")}</TH>
                {branches.map((b) => (
                  <TH key={b.id} className="text-right">
                    {b.name}
                  </TH>
                ))}
                <TH className="text-right">{t("common.total")}</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((p) => {
                const totals = branches.map(
                  (b) => p.stocks.find((s) => s.branchId === b.id)?.quantity ?? 0,
                );
                const total = totals.reduce((a, n) => a + n, 0);
                const low = p.reorderLevel > 0 && total <= p.reorderLevel;
                return (
                  <TR key={p.id}>
                    <TD className="font-mono text-xs">{p.sku}</TD>
                    <TD>{p.name}</TD>
                    {totals.map((q, i) => (
                      <TD key={i} className="text-right">
                        {q}
                      </TD>
                    ))}
                    <TD className="text-right">
                      <Badge variant={low ? "warning" : "muted"}>{total}</Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
