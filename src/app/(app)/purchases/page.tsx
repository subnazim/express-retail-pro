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
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function PurchasesPage() {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const purchases = await prisma.purchase.findMany({
    orderBy: { date: "desc" },
    take: 200,
    include: { supplier: true, branch: true },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.title")}
        action={
          <Link href="/purchases/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("purchases.new")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("purchases.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("purchases.po_no")}</TH>
                <TH>{t("common.date")}</TH>
                <TH>{t("common.branch")}</TH>
                <TH>{t("purchases.supplier")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
                <TH className="text-right">{t("common.due")}</TH>
                <TH>{t("common.status")}</TH>
              </TR>
            </THead>
            <TBody>
              {purchases.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                purchases.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/purchases/${p.id}`} className="text-blue-600 hover:underline">
                        {p.poNo}
                      </Link>
                    </TD>
                    <TD>{formatDate(p.date)}</TD>
                    <TD>{p.branch.name}</TD>
                    <TD>{p.supplier.name}</TD>
                    <TD className="text-right">{money(p.total)}</TD>
                    <TD className="text-right">{money(p.due)}</TD>
                    <TD>
                      <Badge
                        variant={
                          p.paymentStatus === "PAID"
                            ? "success"
                            : p.paymentStatus === "DUE"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {p.paymentStatus}
                      </Badge>
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
