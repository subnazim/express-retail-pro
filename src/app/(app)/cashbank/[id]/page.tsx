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
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

async function recordTxn(formData: FormData) {
  "use server";
  await requireUser();
  const accountId = String(formData.get("accountId") || "");
  const type = String(formData.get("type") || "DEBIT") as "DEBIT" | "CREDIT";
  const amount = Number(formData.get("amount") || 0);
  if (!accountId || amount <= 0) return;
  await prisma.accountTxn.create({
    data: {
      accountId,
      type,
      amount,
      refType: type === "DEBIT" ? "DEPOSIT" : "WITHDRAW",
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath(`/cashbank/${accountId}`);
  revalidatePath("/cashbank");
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const { id } = await params;
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      txns: { orderBy: { date: "desc" }, take: 200 },
    },
  });
  if (!account) notFound();
  const balance =
    account.openingBalance +
    account.txns.reduce(
      (a, t) => a + (t.type === "DEBIT" ? t.amount : -t.amount),
      0,
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        description={`${account.type}${account.bankName ? ` · ${account.bankName}` : ""}`}
        action={
          <Link href="/cashbank">
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
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{money(balance)}</div>
            <p className="text-sm text-slate-500 mt-1">
              Opening: {money(account.openingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={recordTxn} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <input type="hidden" name="accountId" value={account.id} />
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="DEBIT">
                  <option value="DEBIT">Deposit (+)</option>
                  <option value="CREDIT">Withdraw (-)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">{t("common.amount")}</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Input id="notes" name="notes" />
              </div>
              <div className="md:col-span-3">
                <Button type="submit">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>Type</TH>
                <TH>Ref</TH>
                <TH className="text-right">{t("common.amount")}</TH>
                <TH>{t("common.notes")}</TH>
              </TR>
            </THead>
            <TBody>
              {account.txns.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                account.txns.map((tx) => (
                  <TR key={tx.id}>
                    <TD>{formatDateTime(tx.date)}</TD>
                    <TD>{tx.type}</TD>
                    <TD>{tx.refType || "—"}</TD>
                    <TD
                      className={`text-right font-medium ${tx.type === "DEBIT" ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {tx.type === "DEBIT" ? "+" : "-"}
                      {money(tx.amount)}
                    </TD>
                    <TD>{tx.notes || "—"}</TD>
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
