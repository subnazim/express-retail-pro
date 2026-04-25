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
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/utils";

async function createExpense(formData: FormData) {
  "use server";
  const user = await requireUser();
  const amount = Number(formData.get("amount") || 0);
  const categoryId = String(formData.get("categoryId") || "");
  const branchId = String(formData.get("branchId") || "");
  const accountId = String(formData.get("accountId") || "") || null;
  if (amount <= 0 || !categoryId || !branchId) return;
  await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.create({
      data: {
        amount,
        categoryId,
        branchId,
        userId: user.id,
        accountId,
        notes: String(formData.get("notes") || "") || null,
      },
    });
    if (accountId) {
      await tx.accountTxn.create({
        data: {
          accountId,
          type: "CREDIT",
          amount,
          refType: "EXPENSE",
          refId: exp.id,
          notes: String(formData.get("notes") || "") || "Expense",
        },
      });
    }
  });
  revalidatePath("/expenses");
}

async function deleteExpense(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.expense.delete({ where: { id } }).catch(() => null);
  revalidatePath("/expenses");
}

export default async function ExpensesPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const [expenses, categories, branches, accounts] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { category: true, branch: true },
    }),
    prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("expenses.title")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("expenses.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createExpense} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">{t("common.amount")}</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">{t("common.category")}</Label>
                <Select id="categoryId" name="categoryId" required>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branchId">{t("common.branch")}</Label>
                <Select id="branchId" name="branchId" required>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountId">Account</Label>
                <Select id="accountId" name="accountId">
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("expenses.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.date")}</TH>
                  <TH>{t("common.category")}</TH>
                  <TH>{t("common.branch")}</TH>
                  <TH className="text-right">{t("common.amount")}</TH>
                  <TH>{t("common.notes")}</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {expenses.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  expenses.map((e) => (
                    <TR key={e.id}>
                      <TD>{formatDate(e.date)}</TD>
                      <TD>{e.category?.name || "—"}</TD>
                      <TD>{e.branch.name}</TD>
                      <TD className="text-right font-medium">{money(e.amount)}</TD>
                      <TD>{e.notes || "—"}</TD>
                      <TD className="text-right">
                        <form action={deleteExpense} className="inline">
                          <input type="hidden" name="id" value={e.id} />
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
