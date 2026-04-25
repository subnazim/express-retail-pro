import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/layout/page-header";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const user = await requireUser();
  const { t } = await getT();
  const settings = await getSettings();

  const branches = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { isMain: "desc" },
  });
  if (branches.length === 0) {
    redirect("/branches");
  }
  const defaultBranchId = user.branchId || settings.defaultBranchId || branches[0].id;

  const [productsRaw, customers, accounts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { stocks: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const products = productsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    salePrice: p.salePrice,
    taxPercent: p.taxPercent,
    stock:
      p.stocks.find((s) => s.branchId === defaultBranchId)?.quantity ??
      p.stocks.reduce((a, s) => a + s.quantity, 0),
  }));

  const labels = {
    search: t("common.search"),
    cart: t("nav.pos"),
    walk_in: t("sales.walk_in"),
    cart_empty: t("sales.cart_empty"),
    subtotal: t("common.subtotal"),
    discount: t("common.discount"),
    tax: t("common.tax"),
    paid: t("common.paid"),
    total: t("common.total"),
    due: t("common.due"),
    complete: t("sales.complete"),
    no_data: t("common.no_data"),
    loading: t("common.loading"),
    stock: t("products.stock"),
  };

  return (
    <div>
      <PageHeader title={t("nav.pos")} />
      <PosClient
        products={products}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        defaultBranchId={defaultBranchId}
        currencySymbol={settings.currencySymbol}
        labels={labels}
      />
    </div>
  );
}
