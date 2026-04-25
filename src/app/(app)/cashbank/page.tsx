import Link from "next/link";
import { revalidatePath } from "next/cache";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import type { AccountType } from "@prisma/client";

async function createAccount(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "CASH") as AccountType;
  if (!name) return;
  await prisma.account.create({
    data: {
      name,
      type,
      bankName: String(formData.get("bankName") || "") || null,
      accountNumber: String(formData.get("accountNumber") || "") || null,
      openingBalance: Number(formData.get("openingBalance") || 0),
    },
  });
  revalidatePath("/cashbank");
}

async function deleteAccount(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.account.delete({ where: { id } }).catch(() => null);
  revalidatePath("/cashbank");
}

export default async function CashBankPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
    include: { txns: { select: { type: true, amount: true } } },
  });
  const rows = accounts.map((a) => {
    const balance =
      a.openingBalance +
      a.txns.reduce(
        (acc, txn) => acc + (txn.type === "DEBIT" ? txn.amount : -txn.amount),
        0,
      );
    return { ...a, balance };
  });
  return (
    <div className="space-y-6">
      <PageHeader title={t("cashbank.title")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("cashbank.new_account")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAccount} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  name="openingBalance"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("cashbank.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>Type</TH>
                  <TH className="text-right">Balance</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {rows.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  rows.map((a) => (
                    <TR key={a.id}>
                      <TD>
                        <Link
                          href={`/cashbank/${a.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {a.name}
                        </Link>
                      </TD>
                      <TD>
                        <Badge variant={a.type === "CASH" ? "warning" : "info"}>
                          {a.type}
                        </Badge>
                      </TD>
                      <TD className="text-right font-medium">{money(a.balance)}</TD>
                      <TD className="text-right">
                        <form action={deleteAccount} className="inline">
                          <input type="hidden" name="id" value={a.id} />
                          <Button variant="destructive" size="sm" type="submit">
                            {t("common.delete")}
                          </Button>
                        </form>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
