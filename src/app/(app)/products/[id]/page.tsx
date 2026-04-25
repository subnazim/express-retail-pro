import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronLeft } from "lucide-react";

async function updateProduct(formData: FormData) {
  "use server";
  await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.product.update({
    where: { id },
    data: {
      sku: String(formData.get("sku") || ""),
      name: String(formData.get("name") || ""),
      barcode: String(formData.get("barcode") || "") || null,
      categoryId: String(formData.get("categoryId") || "") || null,
      unitId: String(formData.get("unitId") || "") || null,
      costPrice: Number(formData.get("costPrice") || 0),
      salePrice: Number(formData.get("salePrice") || 0),
      taxPercent: Number(formData.get("taxPercent") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
      active: formData.get("active") === "on",
    },
  });
  revalidatePath(`/products/${id}`);
  redirect("/products");
}

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { t } = await getT();
  const { id } = await params;
  const [p, categories, units, branches] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { stocks: { include: { branch: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!p) notFound();
  const stockByBranch = new Map(p.stocks.map((s) => [s.branchId, s.quantity]));
  return (
    <div className="space-y-6">
      <PageHeader
        title={p.name}
        description={p.sku}
        action={
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("common.edit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" name="id" value={p.id} />
              <div className="space-y-1.5">
                <Label htmlFor="sku">{t("products.sku")}</Label>
                <Input id="sku" name="sku" defaultValue={p.sku} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" name="name" defaultValue={p.name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="barcode">{t("products.barcode")}</Label>
                <Input id="barcode" name="barcode" defaultValue={p.barcode || ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">{t("common.category")}</Label>
                <Select id="categoryId" name="categoryId" defaultValue={p.categoryId || ""}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitId">{t("common.unit")}</Label>
                <Select id="unitId" name="unitId" defaultValue={p.unitId || ""}>
                  <option value="">—</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="costPrice">{t("products.cost_price")}</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  defaultValue={p.costPrice}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salePrice">{t("products.sale_price")}</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  defaultValue={p.salePrice}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxPercent">{t("products.tax_percent")}</Label>
                <Input
                  id="taxPercent"
                  name="taxPercent"
                  type="number"
                  step="0.01"
                  defaultValue={p.taxPercent}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reorderLevel">{t("products.reorder_level")}</Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  step="0.01"
                  defaultValue={p.reorderLevel}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={p.active} />
                {t("common.active")}
              </label>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("products.stock")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>{t("common.branch")}</TH>
                  <TH className="text-right">{t("common.qty")}</TH>
                </TR>
              </THead>
              <TBody>
                {branches.map((b) => (
                  <TR key={b.id}>
                    <TD>{b.name}</TD>
                    <TD className="text-right">{stockByBranch.get(b.id) ?? 0}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
