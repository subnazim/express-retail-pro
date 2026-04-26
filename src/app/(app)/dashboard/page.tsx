import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMoney } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";
import {
  ShoppingCart,
  Truck,
  Receipt,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { t } = await getT();
  const { denied } = await searchParams;
  const money = await getMoney();
  const today = startOfDay();
  const month = startOfMonth();

  const [
    todaySalesAgg,
    todayPurchaseAgg,
    todayExpenseAgg,
    monthSalesAgg,
    monthSaleItems,
    customerDueAgg,
    supplierDueAgg,
    lowStock,
    recentSales,
    recentPurchases,
  ] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { voided: false, date: { gte: today } },
    }),
    prisma.purchase.aggregate({
      _sum: { total: true },
      where: { voided: false, date: { gte: today } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: today } },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { voided: false, date: { gte: month } },
    }),
    prisma.saleItem.findMany({
      where: { sale: { voided: false, date: { gte: month } } },
      include: { product: true },
    }),
    prisma.sale.aggregate({
      _sum: { due: true },
      where: { voided: false },
    }),
    prisma.purchase.aggregate({
      _sum: { due: true },
      where: { voided: false },
    }),
    prisma.product.findMany({
      where: { active: true, reorderLevel: { gt: 0 } },
      include: { stocks: true },
      take: 50,
    }),
    prisma.sale.findMany({
      where: { voided: false },
      orderBy: { date: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.purchase.findMany({
      where: { voided: false },
      orderBy: { date: "desc" },
      take: 5,
      include: { supplier: true },
    }),
  ]);

  // approximate today's profit: today's sales - today's COGS (sum of sale items cost)
  const todaySaleItems = await prisma.saleItem.findMany({
    where: { sale: { voided: false, date: { gte: today } } },
    include: { product: true },
  });
  const todayCogs = todaySaleItems.reduce(
    (acc, it) => acc + it.quantity * (it.product?.costPrice ?? 0),
    0,
  );
  const todayProfit = (todaySalesAgg._sum.total ?? 0) - todayCogs;

  const monthCogs = monthSaleItems.reduce(
    (acc, it) => acc + it.quantity * (it.product?.costPrice ?? 0),
    0,
  );
  const monthProfit = (monthSalesAgg._sum.total ?? 0) - monthCogs;

  const lowStockItems = lowStock
    .map((p) => {
      const total = p.stocks.reduce((a, s) => a + s.quantity, 0);
      return { ...p, totalStock: total };
    })
    .filter((p) => p.totalStock <= p.reorderLevel)
    .slice(0, 8);

  const stats = [
    {
      label: t("dashboard.today_sales"),
      value: money(todaySalesAgg._sum.total ?? 0),
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      label: t("dashboard.today_purchase"),
      value: money(todayPurchaseAgg._sum.total ?? 0),
      icon: Truck,
      color: "bg-amber-500",
    },
    {
      label: t("dashboard.today_expense"),
      value: money(todayExpenseAgg._sum.amount ?? 0),
      icon: Receipt,
      color: "bg-rose-500",
    },
    {
      label: t("dashboard.today_profit"),
      value: money(todayProfit),
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      label: t("dashboard.month_sales"),
      value: money(monthSalesAgg._sum.total ?? 0),
      icon: ShoppingCart,
      color: "bg-blue-600",
    },
    {
      label: t("dashboard.month_profit"),
      value: money(monthProfit),
      icon: TrendingUp,
      color: "bg-emerald-600",
    },
    {
      label: t("dashboard.customer_due"),
      value: money(customerDueAgg._sum.due ?? 0),
      icon: Users,
      color: "bg-orange-500",
    },
    {
      label: t("dashboard.supplier_due"),
      value: money(supplierDueAgg._sum.due ?? 0),
      icon: Truck,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.dashboard")} />
      {denied && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don&apos;t have access to <code className="font-mono">{denied}</code>.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-md ${s.color} text-white grid place-items-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                  <div className="text-lg font-semibold">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.recent_sales")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("sales.invoice_no")}</TH>
                  <TH>{t("common.date")}</TH>
                  <TH>{t("sales.customer")}</TH>
                  <TH className="text-right">{t("common.total")}</TH>
                  <TH className="text-right">{t("common.due")}</TH>
                </TR>
              </THead>
              <TBody>
                {recentSales.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  recentSales.map((s) => (
                    <TR key={s.id}>
                      <TD>
                        <Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline">
                          {s.invoiceNo}
                        </Link>
                      </TD>
                      <TD>{formatDate(s.date)}</TD>
                      <TD>{s.customer?.name || t("sales.walk_in")}</TD>
                      <TD className="text-right">{money(s.total)}</TD>
                      <TD className="text-right">{money(s.due)}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("dashboard.low_stock")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH className="text-right">{t("products.stock")}</TH>
                </TR>
              </THead>
              <TBody>
                {lowStockItems.length === 0 ? (
                  <TR>
                    <TD colSpan={2} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  lowStockItems.map((p) => (
                    <TR key={p.id}>
                      <TD>{p.name}</TD>
                      <TD className="text-right">
                        <Badge variant="warning">{p.totalStock}</Badge>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recent_purchases")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("purchases.po_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH>{t("purchases.supplier")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
              </TR>
            </THead>
            <TBody>
              {recentPurchases.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                recentPurchases.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/purchases/${p.id}`} className="text-blue-600 hover:underline">
                        {p.poNo}
                      </Link>
                    </TD>
                    <TD>{formatDate(p.date)}</TD>
                    <TD>{p.supplier?.name}</TD>
                    <TD className="text-right">{money(p.total)}</TD>
                    <TD className="text-right">{money(p.due)}</TD>
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
