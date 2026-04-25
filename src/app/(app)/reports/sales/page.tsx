import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const sp = await searchParams;
  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = sp.to ? new Date(sp.to) : now;
  to.setHours(23, 59, 59, 999);
  const sales = await prisma.sale.findMany({
    where: { voided: false, date: { gte: from, lte: to } },
    orderBy: { date: "desc" },
    include: { customer: true, branch: true },
  });
  const totals = sales.reduce(
    (a, s) => ({
      total: a.total + s.total,
      paid: a.paid + s.paid,
      due: a.due + s.due,
    }),
    { total: 0, paid: 0, due: 0 },
  );
  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.sales")} />
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={from.toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={to.toISOString().slice(0, 10)} />
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.sales")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("sales.invoice_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.branch")}</TH>
                <TH>{t("sales.customer")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.paid")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
              </TR>
            </THead>
            <TBody>
              {sales.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline">
                      {s.invoiceNo}
                    </Link>
                  </TD>
                  <TD>{formatDate(s.date)}</TD>
                  <TD>{s.branch.name}</TD>
                  <TD>{s.customer?.name || "—"}</TD>
                  <TD className="text-right">{money(s.total)}</TD>
                  <TD className="text-right">{money(s.paid)}</TD>
                  <TD className="text-right">{money(s.due)}</TD>
                </TR>
              ))}
              <TR className="bg-slate-50 font-semibold">
                <TD colSpan={4}>Total</TD>
                <TD className="text-right">{money(totals.total)}</TD>
                <TD className="text-right">{money(totals.paid)}</TD>
                <TD className="text-right">{money(totals.due)}</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
