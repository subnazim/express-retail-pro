import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

async function recordPayment(formData: FormData) {
  "use server";
  await requireUser();
  const customerId = String(formData.get("customerId") || "");
  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("accountId") || "") || null;
  if (!customerId || amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.customerLedger.create({
      data: {
        customerId,
        refType: "PAYMENT",
        credit: amount,
        notes: "Payment received",
      },
    });
    if (accountId) {
      await tx.accountTxn.create({
        data: {
          accountId,
          type: "DEBIT",
          amount,
          refType: "CUSTOMER_PAYMENT",
          notes: `Payment from customer ${customerId}`,
        },
      });
    }
  });
  revalidatePath(`/customers/${customerId}`);
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const { id } = await params;
  const c = await prisma.customer.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { date: "desc" }, take: 100 },
      sales: { where: { voided: false }, orderBy: { date: "desc" }, take: 50 },
    },
  });
  if (!c) notFound();
  const accounts = await prisma.account.findMany({ where: { active: true } });
  const totalDue = c.ledger.reduce((a, l) => a + l.debit - l.credit, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title={c.name}
        description={c.phone || c.email || ""}
        action={
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.due")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{money(totalDue)}</div>
            <p className="text-sm text-slate-500 mt-1">{t("customers.opening_due")}: {money(c.openingDue)}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receive Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={recordPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <input type="hidden" name="customerId" value={c.id} />
              <div className="space-y-1.5">
                <Label htmlFor="amount">{t("common.amount")}</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountId">Account</Label>
                <select
                  id="accountId"
                  name="accountId"
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">{t("common.save")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>Type</TH>
                <TH className="text-right">Debit</TH>
                <TH className="text-right">Credit</TH>
                <TH>{t("common.notes")}</TH>
              </TR>
            </THead>
            <TBody>
              {c.ledger.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                c.ledger.map((l) => (
                  <TR key={l.id}>
                    <TD>{formatDate(l.date)}</TD>
                    <TD>{l.refType}</TD>
                    <TD className="text-right">{money(l.debit)}</TD>
                    <TD className="text-right">{money(l.credit)}</TD>
                    <TD>{l.notes || "—"}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("nav.sales")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("sales.invoice_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
              </TR>
            </THead>
            <TBody>
              {c.sales.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                c.sales.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline">
                        {s.invoiceNo}
                      </Link>
                    </TD>
                    <TD>{formatDate(s.date)}</TD>
                    <TD className="text-right">{money(s.total)}</TD>
                    <TD className="text-right">{money(s.due)}</TD>
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
