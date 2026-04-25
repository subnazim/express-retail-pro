import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft, RotateCcw, Printer } from "lucide-react";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const settings = await getSettings();
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      branch: true,
      user: true,
      items: { include: { product: true } },
      returns: { include: { items: true } },
    },
  });
  if (!sale) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("sales.invoice")} ${sale.invoiceNo}`}
        description={formatDateTime(sale.date)}
        action={
          <div className="flex gap-2">
            <Link href="/sales">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            {!sale.voided ? (
              <Link href={`/sales/${sale.id}/return`}>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                  {t("sales.return")}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <Card className="print:shadow-none print:border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{settings.companyName}</div>
              {settings.address ? (
                <div className="text-sm text-slate-500">{settings.address}</div>
              ) : null}
              {settings.phone ? (
                <div className="text-sm text-slate-500">{settings.phone}</div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-slate-500">{t("sales.invoice")}</div>
              <div className="font-mono font-semibold">{sale.invoiceNo}</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatDateTime(sale.date)}
              </div>
              <div className="text-xs text-slate-500">{sale.branch.name}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <div className="text-xs uppercase text-slate-500">
                {t("sales.customer")}
              </div>
              <div className="font-medium">
                {sale.customer?.name || t("sales.walk_in")}
              </div>
              {sale.customer?.phone ? (
                <div className="text-slate-500">{sale.customer.phone}</div>
              ) : null}
            </div>
            <div className="text-right">
              <Badge
                variant={
                  sale.paymentStatus === "PAID"
                    ? "success"
                    : sale.paymentStatus === "DUE"
                      ? "danger"
                      : "warning"
                }
              >
                {sale.paymentStatus}
              </Badge>
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>{t("common.name")}</TH>
                <TH className="text-right">{t("common.qty")}</TH>
                <TH className="text-right">{t("common.price")}</TH>
                <TH className="text-right">{t("common.total")}</TH>
              </TR>
            </THead>
            <TBody>
              {sale.items.map((it, idx) => (
                <TR key={it.id}>
                  <TD>{idx + 1}</TD>
                  <TD>{it.product.name}</TD>
                  <TD className="text-right">{it.quantity}</TD>
                  <TD className="text-right">{money(it.price)}</TD>
                  <TD className="text-right">{money(it.total)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>{t("common.subtotal")}</span>
                <span>{money(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.tax")}</span>
                <span>{money(sale.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.discount")}</span>
                <span>-{money(sale.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1.5">
                <span>{t("common.total")}</span>
                <span>{money(sale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.paid")}</span>
                <span>{money(sale.paid)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t("common.due")}</span>
                <span>{money(sale.due)}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 no-print flex justify-end">
            <PrintButton label={t("common.print")} />
          </div>
        </CardContent>
      </Card>

      {sale.returns.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("sales.return")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.date")}</TH>
                  <TH className="text-right">{t("common.amount")}</TH>
                  <TH>{t("common.notes")}</TH>
                </TR>
              </THead>
              <TBody>
                {sale.returns.map((r) => (
                  <TR key={r.id}>
                    <TD>{formatDateTime(r.date)}</TD>
                    <TD className="text-right">{money(r.amount)}</TD>
                    <TD>{r.reason || "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PrintButton({ label }: { label: string }) {
  return (
    <form action="javascript:window.print()">
      <Button variant="outline" size="sm" type="submit">
        <Printer className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
