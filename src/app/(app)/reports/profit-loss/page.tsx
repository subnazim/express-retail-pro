import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

function parseRange(sp: { from?: string; to?: string }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = sp.from ? new Date(sp.from) : monthStart;
  const to = sp.to ? new Date(sp.to) : now;
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const sp = await searchParams;
  const { from, to } = parseRange(sp);

  const [salesAgg, saleItems, purchaseRetAgg, expenseAgg, salaryAgg, saleReturnsAgg] =
    await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true, discount: true, tax: true },
        where: { voided: false, date: { gte: from, lte: to } },
      }),
      prisma.saleItem.findMany({
        where: { sale: { voided: false, date: { gte: from, lte: to } } },
        include: { product: true },
      }),
      prisma.purchaseReturn.aggregate({
        _sum: { amount: true },
        where: { date: { gte: from, lte: to } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: from, lte: to } },
      }),
      prisma.salaryPayment.aggregate({
        _sum: { netAmount: true },
        where: {
          status: "PAID",
          paidDate: { gte: from, lte: to },
        },
      }),
      prisma.saleReturn.aggregate({
        _sum: { amount: true },
        where: { date: { gte: from, lte: to } },
      }),
    ]);

  const grossSales = salesAgg._sum.total ?? 0;
  const saleReturns = saleReturnsAgg._sum.amount ?? 0;
  const netSales = grossSales - saleReturns;
  const cogs = saleItems.reduce(
    (a, it) => a + it.quantity * (it.product?.costPrice ?? 0),
    0,
  );
  const purchaseReturns = purchaseRetAgg._sum.amount ?? 0;
  const grossProfit = netSales - cogs;
  const expenses = expenseAgg._sum.amount ?? 0;
  const salary = salaryAgg._sum.netAmount ?? 0;
  const netProfit = grossProfit - expenses - salary;

  const items = [
    { label: "Gross Sales", value: grossSales, sign: 1 },
    { label: "Sale Returns", value: saleReturns, sign: -1 },
    { label: "Net Sales", value: netSales, bold: true },
    { label: "Cost of Goods Sold", value: cogs, sign: -1 },
    { label: "Gross Profit", value: grossProfit, bold: true },
    { label: "Expenses", value: expenses, sign: -1 },
    { label: "Salary", value: salary, sign: -1 },
    { label: "Purchase Returns Recovery", value: purchaseReturns, sign: 1 },
    { label: "Net Profit", value: netProfit, bold: true, total: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.profit_loss")} />
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={from.toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={to.toISOString().slice(0, 10)}
              />
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.profit_loss")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {items.map((it, i) => (
              <div
                key={i}
                className={`flex justify-between py-2 ${it.total ? "border-t-2 border-slate-300 text-lg" : it.bold ? "border-t font-semibold" : ""}`}
              >
                <span>{it.label}</span>
                <span
                  className={
                    it.total
                      ? it.value >= 0
                        ? "text-emerald-600 font-bold"
                        : "text-red-600 font-bold"
                      : ""
                  }
                >
                  {(it.sign === -1 ? "- " : "") + money(Math.abs(it.value))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
