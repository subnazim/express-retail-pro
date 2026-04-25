import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

export default async function CustomerDuePage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const customers = await prisma.customer.findMany({
    include: { ledger: { select: { debit: true, credit: true } } },
    orderBy: { name: "asc" },
  });
  const rows = customers
    .map((c) => ({
      ...c,
      due: c.ledger.reduce((a, l) => a + l.debit - l.credit, 0),
    }))
    .filter((c) => c.due > 0)
    .sort((a, b) => b.due - a.due);
  const total = rows.reduce((a, c) => a + c.due, 0);
  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.customer_due")} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.name")}</TH>
                <TH>{t("common.phone")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <TR>
                  <TD colSpan={3} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                rows.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                        {c.name}
                      </Link>
                    </TD>
                    <TD>{c.phone || "—"}</TD>
                    <TD className="text-right text-red-600">{money(c.due)}</TD>
                  </TR>
                ))
              )}
              <TR className="bg-slate-50 font-semibold">
                <TD colSpan={2}>Total Due</TD>
                <TD className="text-right">{money(total)}</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
