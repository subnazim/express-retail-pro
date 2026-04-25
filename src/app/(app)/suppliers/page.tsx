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
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

async function createSupplier(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const openingDue = Number(formData.get("openingDue") || 0);
  const s = await prisma.supplier.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      openingDue,
    },
  });
  if (openingDue > 0) {
    await prisma.supplierLedger.create({
      data: {
        supplierId: s.id,
        refType: "OPENING",
        credit: openingDue,
        notes: "Opening balance (we owe)",
      },
    });
  }
  revalidatePath("/suppliers");
}

async function deleteSupplier(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.supplier.delete({ where: { id } }).catch(() => null);
  revalidatePath("/suppliers");
}

export default async function SuppliersPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { ledger: { select: { debit: true, credit: true } } },
  });
  const rows = suppliers.map((s) => {
    const due = s.ledger.reduce((a, l) => a + l.credit - l.debit, 0);
    return { ...s, due };
  });
  return (
    <div className="space-y-6">
      <PageHeader title={t("suppliers.title")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("suppliers.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSupplier} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" required />
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
                <Label htmlFor="openingDue">{t("suppliers.opening_due")}</Label>
                <Input
                  id="openingDue"
                  name="openingDue"
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
            <CardTitle>{t("suppliers.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.name")}</TH>
                  <TH>{t("common.phone")}</TH>
                  <TH className="text-right">{t("common.due")}</TH>
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
                  rows.map((s) => (
                    <TR key={s.id}>
                      <TD>
                        <Link
                          href={`/suppliers/${s.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {s.name}
                        </Link>
                      </TD>
                      <TD>{s.phone || "—"}</TD>
                      <TD className="text-right">{money(s.due)}</TD>
                      <TD className="text-right">
                        <form action={deleteSupplier} className="inline">
                          <input type="hidden" name="id" value={s.id} />
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
