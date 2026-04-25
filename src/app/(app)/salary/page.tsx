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
import { formatDate } from "@/lib/utils";

async function paySalary(formData: FormData) {
  "use server";
  await requireUser();
  const employeeId = String(formData.get("employeeId") || "");
  const monthYear = String(formData.get("monthYear") || "");
  const amount = Number(formData.get("amount") || 0);
  const bonus = Number(formData.get("bonus") || 0);
  const deduction = Number(formData.get("deduction") || 0);
  const accountId = String(formData.get("accountId") || "") || null;
  const netAmount = amount + bonus - deduction;
  if (!employeeId || !monthYear || amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    const sp = await tx.salaryPayment.upsert({
      where: { employeeId_monthYear: { employeeId, monthYear } },
      create: {
        employeeId,
        monthYear,
        amount,
        bonus,
        deduction,
        netAmount,
        status: "PAID",
        paidDate: new Date(),
        accountId,
        notes: String(formData.get("notes") || "") || null,
      },
      update: {
        amount,
        bonus,
        deduction,
        netAmount,
        status: "PAID",
        paidDate: new Date(),
        accountId,
      },
    });
    if (accountId) {
      await tx.accountTxn.create({
        data: {
          accountId,
          type: "CREDIT",
          amount: netAmount,
          refType: "SALARY",
          refId: sp.id,
          notes: `Salary ${monthYear} for employee ${employeeId}`,
        },
      });
    }
  });
  revalidatePath("/salary");
}

export default async function SalaryPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const [employees, payments, accounts] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.salaryPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { employee: true },
    }),
    prisma.account.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t("salary.title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("salary.pay")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={paySalary} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">{t("employees.title")}</Label>
              <Select id="employeeId" name="employeeId" required>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthYear">{t("salary.month")}</Label>
              <Input
                id="monthYear"
                name="monthYear"
                type="month"
                defaultValue={defaultMonth}
                required
              />
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
              <Label htmlFor="amount">{t("salary.amount")}</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bonus">{t("salary.bonus")}</Label>
              <Input id="bonus" name="bonus" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deduction">{t("salary.deduction")}</Label>
              <Input
                id="deduction"
                name="deduction"
                type="number"
                step="0.01"
                defaultValue="0"
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">{t("salary.pay")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("salary.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.date")}</TH>
                <TH>{t("employees.title")}</TH>
                <TH>{t("salary.month")}</TH>
                <TH className="text-right">Net</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {payments.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                payments.map((p) => (
                  <TR key={p.id}>
                    <TD>{p.paidDate ? formatDate(p.paidDate) : "—"}</TD>
                    <TD>{p.employee.name}</TD>
                    <TD>{p.monthYear}</TD>
                    <TD className="text-right">{money(p.netAmount)}</TD>
                    <TD>
                      <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                        {p.status}
                      </Badge>
                    </TD>
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
