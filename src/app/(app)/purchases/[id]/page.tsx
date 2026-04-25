import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft, RotateCcw } from "lucide-react";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const { id } = await params;
  const p = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      branch: true,
      items: { include: { product: true } },
      returns: true,
    },
  });
  if (!p) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("purchases.po_no")} ${p.poNo}`}
        description={formatDateTime(p.date)}
        action={
          <div className="flex gap-2">
            <Link href="/purchases">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            {!p.voided ? (
              <Link href={`/purchases/${p.id}/return`}>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                  {t("sales.return")}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">{t("purchases.supplier")}</div>
              <div className="font-medium text-lg">{p.supplier.name}</div>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>{t("common.name")}</TH>
                <TH className="text-right">{t("common.qty")}</TH>
                <TH className="text-right">{t("common.cost")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
              </TR>
            </THead>
            <TBody>
              {p.items.map((it, i) => (
                <TR key={it.id}>
                  <TD>{i + 1}</TD>
                  <TD>{it.product.name}</TD>
                  <TD className="text-right">{it.quantity}</TD>
                  <TD className="text-right">{money(it.cost)}</TD>
                  <TD className="text-right">{money(it.total)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>{t("common.subtotal")}</span>
                <span>{money(p.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.discount")}</span>
                <span>-{money(p.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1.5">
                <span>{t("common.total")}</span>
                <span>{money(p.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.paid")}</span>
                <span>{money(p.paid)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t("common.due")}</span>
                <span>{money(p.due)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
