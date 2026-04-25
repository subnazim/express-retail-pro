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

async function createUnit(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.unit.create({ data: { name } });
  revalidatePath("/units");
}

async function deleteUnit(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.unit.delete({ where: { id } }).catch(() => null);
  revalidatePath("/units");
}

export default async function UnitsPage() {
  await requireUser();
  const { t } = await getT();
  const items = await prisma.unit.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.units")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.add")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createUnit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required placeholder="pcs, kg, ltr…" />
              </div>
              <Button type="submit" className="w-full">
                {t("common.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("nav.units")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR>
                    <TD colSpan={2} className="text-center text-slate-500">
                      {t("common.no_data")}
                    </TD>
                  </TR>
                ) : (
                  items.map((u) => (
                    <TR key={u.id}>
                      <TD>{u.name}</TD>
                      <TD className="text-right">
                        <form action={deleteUnit} className="inline">
                          <input type="hidden" name="id" value={u.id} />
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
