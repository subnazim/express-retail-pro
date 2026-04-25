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

async function createCustomer(formData: FormData) {
  "use server";
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const openingDue = Number(formData.get("openingDue") || 0);
  const c = await prisma.customer.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      openingDue,
    },
  });
  if (openingDue > 0) {
    await prisma.customerLedger.create({
      data: {
        customerId: c.id,
        refType: "OPENING",
        debit: openingDue,
        notes: "Opening balance",
      },
    });
  }
  revalidatePath("/customers");
}

async function deleteCustomer(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.customer.delete({ where: { id } }).catch(() => null);
  revalidatePath("/customers");
}

export default async function CustomersPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      sales: { where: { voided: false }, select: { due: true } },
      ledger: { select: { debit: true, credit: true } },
    },
  });
  const rows = customers.map((c) => {
    const dueFromLedger = c.ledger.reduce((a, l) => a + l.debit - l.credit, 0);
    return { ...c, due: dueFromLedger };
  });
  return (
    <div className="space-y-6">
      <PageHeader title={t("customers.title")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("customers.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCustomer} className="space-y-3">
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
                <Label htmlFor="openingDue">{t("customers.opening_due")}</Label>
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
            <CardTitle>{t("customers.title")}</CardTitle>
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
                  rows.map((c) => (
                    <TR key={c.id}>
                      <TD>
                        <Link
                          href={`/customers/${c.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TD>
                      <TD>{c.phone || "—"}</TD>
                      <TD className="text-right">{money(c.due)}</TD>
                      <TD className="text-right">
                        <form action={deleteCustomer} className="inline">
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
