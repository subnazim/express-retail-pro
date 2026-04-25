import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

async function createBranch(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.branch.create({
    data: {
      name,
      address: String(formData.get("address") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      isMain: formData.get("isMain") === "on",
    },
  });
  revalidatePath("/branches");
}

async function deleteBranch(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.branch.delete({ where: { id } }).catch(() => null);
  revalidatePath("/branches");
}

export default async function BranchesPage() {
  await requireUser();
  const { t } = await getT();
  const items = await prisma.branch.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.branches")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("branches.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBranch} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Input id="address" name="address" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isMain" />
                {t("branches.main")}
              </label>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("nav.branches")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>{t("common.phone")}</TH>
                  <TH>{t("common.address")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  items.map((b) => (
                    <TR key={b.id}>
                      <TD className="font-medium">
                        {b.name}{" "}
                        {b.isMain ? (
                          <Badge variant="info" className="ml-1">
                            {t("branches.main")}
                          </Badge>
                        ) : null}
                      </TD>
                      <TD>{b.phone || "—"}</TD>
                      <TD>{b.address || "—"}</TD>
                      <TD className="text-right">
                        <form action={deleteBranch} className="inline">
                          <input type="hidden" name="id" value={b.id} />
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
