import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

async function createCategory(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.category.create({ data: { name } });
  revalidatePath("/categories");
}

async function toggleCategory(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return;
  await prisma.category.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.category.delete({ where: { id } }).catch(() => null);
  revalidatePath("/categories");
}

export default async function CategoriesPage() {
  await requireUser();
  const { t } = await getT();
  const items = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.categories")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.add")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("nav.categories")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR>
                    <TD colSpan={3} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  items.map((c) => (
                    <TR key={c.id}>
                      <TD>{c.name}</TD>
                      <TD>
                        <Badge variant={c.active ? "success" : "muted"}>
                          {c.active ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </TD>
                      <TD className="text-right space-x-2">
                        <form action={toggleCategory} className="inline">
                          <input type="hidden" name="id" value={c.id} />
                          <Button variant="outline" size="sm" type="submit">
                            {c.active ? t("common.inactive") : t("common.active")}
                          </Button>
                        </form>
                        <form action={deleteCategory} className="inline">
                          <input type="hidden" name="id" value={c.id} />
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
