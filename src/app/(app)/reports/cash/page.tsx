import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";

export default async function CashReportPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const accounts = await prisma.account.findMany({
    where: { type: "CASH", active: true },
    include: { txns: { select: { type: true, amount: true } } },
    orderBy: { name: "asc" },
  });
  const rows = accounts.map((a) => {
    const balance =
      a.openingBalance +
      a.txns.reduce((acc, t) => acc + (t.type === "DEBIT" ? t.amount : -t.amount), 0);
    return { ...a, balance };
  });
  const total = rows.reduce((a, r) => a + r.balance, 0);
  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.cash")} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("common.name")}</TH>
                <TH className="text-right">Balance</TH>
              </TR>
            </THead>
            <TBody>
              {rows.length === 0 ? (
                <TR>
                  <TD colSpan={2} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                rows.map((a) => (
                  <TR key={a.id}>
                    <TD>
                      <Link href={`/cashbank/${a.id}`} className="text-blue-600 hover:underline">
                        {a.name}
                      </Link>
                    </TD>
                    <TD className="text-right">{money(a.balance)}</TD>
                  </TR>
                ))
              )}
              <TR className="bg-slate-50 font-semibold">
                <TD>Total Cash</TD>
                <TD className="text-right">{money(total)}</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
