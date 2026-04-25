import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { getMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

async function deleteProduct(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.product.delete({ where: { id } }).catch(() => null);
  revalidatePath("/products");
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const money = await getMoney();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { category: true, unit: true, stocks: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products.title")}
        action={
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("products.new")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("products.title")}</CardTitle>
          <form className="mt-2">
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("common.search")}
              className="max-w-md"
            />
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t("products.sku")}</TH>
                <TH>{t("common.name")}</TH>
                <TH>{t("common.category")}</TH>
                <TH className="text-right">{t("products.cost_price")}</TH>
                <TH className="text-right">{t("products.sale_price")}</TH>
                <TH className="text-right">{t("products.stock")}</TH>
                <TH className="text-right">{t("common.actions")}</TH>
              </TR>
            </THead>
            <TBody>
              {products.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-slate-500">
                    {t("common.no_data")}
                  </TD>
                </TR>
              ) : (
                products.map((p) => {
                  const stock = p.stocks.reduce((a, s) => a + s.quantity, 0);
                  const low = p.reorderLevel > 0 && stock <= p.reorderLevel;
                  return (
                    <TR key={p.id}>
                      <TD className="font-mono text-xs">{p.sku}</TD>
                      <TD className="font-medium">{p.name}</TD>
                      <TD>{p.category?.name || "—"}</TD>
                      <TD className="text-right">{money(p.costPrice)}</TD>
                      <TD className="text-right">{money(p.salePrice)}</TD>
                      <TD className="text-right">
                        <Badge variant={low ? "warning" : "muted"}>{stock}</Badge>
                      </TD>
                      <TD className="text-right space-x-1">
                        <Link href={`/products/${p.id}`}>
                          <Button variant="outline" size="sm">
                            {t("common.edit")}
                          </Button>
                        </Link>
                        <form action={deleteProduct} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <Button variant="destructive" size="sm" type="submit">
                            {t("common.delete")}
                          </Button>
                        </form>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
