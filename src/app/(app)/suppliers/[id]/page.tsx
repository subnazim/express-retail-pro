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
  const supplierId = String(formData.get("supplierId") || "");
  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("accountId") || "") || null;
  if (!supplierId || amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.supplierLedger.create({
      data: {
        supplierId,
        refType: "PAYMENT",
        debit: amount,
        notes: "Payment to supplier",
      },
    });
    if (accountId) {
      await tx.accountTxn.create({
        data: {
          accountId,
          type: "CREDIT",
          amount,
          refType: "SUPPLIER_PAYMENT",
          notes: `Payment to supplier ${supplierId}`,
        },
      });
    }
  });
  revalidatePath(`/suppliers/${supplierId}`);
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const { id } = await params;
  const s = await prisma.supplier.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { date: "desc" }, take: 100 },
      purchases: { where: { voided: false }, orderBy: { date: "desc" }, take: 50 },
    },
  });
  if (!s) notFound();
  const accounts = await prisma.account.findMany({ where: { active: true } });
  const totalDue = s.ledger.reduce((a, l) => a + l.credit - l.debit, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={s.phone || s.email || ""}
        action={
          <Link href="/suppliers">
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
            <p className="text-sm text-slate-500 mt-1">{t("suppliers.opening_due")}: {money(s.openingDue)}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pay Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={recordPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <input type="hidden" name="supplierId" value={s.id} />
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
                <TH className="text-right">Debit (we paid)</TH>
                <TH className="text-right">Credit (we owe)</TH>
                <TH>{t("common.notes")}</TH>
              </TR>
            </THead>
            <TBody>
              {s.ledger.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                s.ledger.map((l) => (
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
          <CardTitle>{t("nav.purchases")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("purchases.po_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
              </TR>
            </THead>
            <TBody>
              {s.purchases.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                s.purchases.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/purchases/${p.id}`} className="text-blue-600 hover:underline">
                        {p.poNo}
                      </Link>
                    </TD>
                    <TD>{formatDate(p.date)}</TD>
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
