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

async function createEmployee(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.employee.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      designation: String(formData.get("designation") || "") || null,
      address: String(formData.get("address") || "") || null,
      branchId: String(formData.get("branchId") || "") || null,
      baseSalary: Number(formData.get("baseSalary") || 0),
    },
  });
  revalidatePath("/employees");
}

async function deleteEmployee(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.employee.delete({ where: { id } }).catch(() => null);
  revalidatePath("/employees");
}

export default async function EmployeesPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const [employees, branches] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { name: "asc" },
      include: { branch: true },
    }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("employees.title")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("employees.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEmployee} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designation">{t("employees.designation")}</Label>
                <Input id="designation" name="designation" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Input id="address" name="address" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branchId">{t("common.branch")}</Label>
                <Select id="branchId" name="branchId">
                  <option value="">—</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="baseSalary">{t("employees.base_salary")}</Label>
                <Input
                  id="baseSalary"
                  name="baseSalary"
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
            <CardTitle>{t("employees.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>{t("employees.designation")}</TH>
                  <TH>{t("common.branch")}</TH>
                  <TH className="text-right">{t("employees.base_salary")}</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {employees.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  employees.map((e) => (
                    <TR key={e.id}>
                      <TD className="font-medium">{e.name}</TD>
                      <TD>{e.designation || "—"}</TD>
                      <TD>{e.branch?.name || "—"}</TD>
                      <TD className="text-right">{money(e.baseSalary)}</TD>
                      <TD className="text-right">
                        <form action={deleteEmployee} className="inline">
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
