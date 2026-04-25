import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronLeft } from "lucide-react";
import { PurchaseClient } from "./purchase-client";

export default async function NewPurchasePage() {
  const user = await requireUser();
  const { t } = await getT();
  const settings = await getSettings();
  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { isMain: "desc" },
  });
  if (branches.length === 0) redirect("/branches");
  const defaultBranchId = user.branchId || settings.defaultBranchId || branches[0].id;
  const [products, suppliers, accounts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      take: 1000,
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("purchases.new")}
        action={
          <Link href="/purchases">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <PurchaseClient
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          costPrice: p.costPrice,
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        defaultBranchId={defaultBranchId}
        currencySymbol={settings.currencySymbol}
        labels={{
          name: t("common.name"),
          qty: t("common.qty"),
          cost: t("common.cost"),
          total: t("common.total"),
          subtotal: t("common.subtotal"),
          discount: t("common.discount"),
          paid: t("common.paid"),
          due: t("common.due"),
          notes: t("common.notes"),
          branch: t("common.branch"),
          supplier: t("purchases.supplier"),
          summary: t("common.total"),
          create: t("common.create"),
          loading: t("common.loading"),
        }}
      />
    </div>
  );
}
