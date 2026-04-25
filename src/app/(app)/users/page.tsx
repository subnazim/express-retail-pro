import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import type { UserRole } from "@prisma/client";

async function createUser(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "CASHIER") as UserRole;
  const branchId = String(formData.get("branchId") || "") || null;
  if (!name || !email || !password) return;
  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role, branchId },
  });
  revalidatePath("/users");
}

async function deleteUser(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") || "");
  await prisma.user.delete({ where: { id } }).catch(() => null);
  revalidatePath("/users");
}

async function toggleActive(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/users");
}

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const { t } = await getT();
  const [users, branches] = await Promise.all([
    prisma.user.findMany({ include: { branch: true }, orderBy: { createdAt: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.users")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("users.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">{t("users.role")}</Label>
                <Select id="role" name="role" defaultValue="CASHIER">
                  <option value="ADMIN">{t("users.role.ADMIN")}</option>
                  <option value="MANAGER">{t("users.role.MANAGER")}</option>
                  <option value="CASHIER">{t("users.role.CASHIER")}</option>
                  <option value="ACCOUNTANT">{t("users.role.ACCOUNTANT")}</option>
                </Select>
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
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("nav.users")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>{t("auth.email")}</TH>
                  <TH>{t("users.role")}</TH>
                  <TH>{t("common.branch")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge variant="info">{t(`users.role.${u.role}`)}</Badge>
                    </TD>
                    <TD>{u.branch?.name || "—"}</TD>
                    <TD>
                      <Badge variant={u.active ? "success" : "muted"}>
                        {u.active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TD>
                    <TD className="text-right space-x-2">
                      <form action={toggleActive} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <Button variant="outline" size="sm" type="submit">
                          {u.active ? t("common.inactive") : t("common.active")}
                        </Button>
                      </form>
                      <form action={deleteUser} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <Button variant="destructive" size="sm" type="submit">
                          {t("common.delete")}
                        </Button>
                      </form>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
