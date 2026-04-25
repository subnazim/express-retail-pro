import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";
import { ScanBarcode } from "lucide-react";

export default async function SalesPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: 200,
    include: { customer: true, branch: true, user: true },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.title")}
        action={
          <Link href="/sales/pos">
            <Button>
              <ScanBarcode className="h-4 w-4" />
              {t("nav.pos")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("sales.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("sales.invoice_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.branch")}</TH>
                <TH>{t("sales.customer")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.paid")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {sales.length === 0 ? (
                <TR>
                  <TD colSpan={8} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                sales.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <Link href={`/sales/${s.id}`} className="text-blue-600 hover:underline">
                        {s.invoiceNo}
                      </Link>
                    </TD>
                    <TD>{formatDateTime(s.date)}</TD>
                    <TD>{s.branch.name}</TD>
                    <TD>{s.customer?.name || t("sales.walk_in")}</TD>
                    <TD className="text-right">{money(s.total)}</TD>
                    <TD className="text-right">{money(s.paid)}</TD>
                    <TD className="text-right">{money(s.due)}</TD>
                    <TD>
                      <Badge
                        variant={
                          s.paymentStatus === "PAID"
                            ? "success"
                            : s.paymentStatus === "DUE"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {s.paymentStatus}
                      </Badge>
                      {s.voided ? (
                        <Badge variant="muted" className="ml-1">
                          VOID
                        </Badge>
                      ) : null}
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
