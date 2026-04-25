import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronLeft } from "lucide-react";

async function createProduct(formData: FormData) {
  "use server";
  await requireUser();
  const sku = String(formData.get("sku") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!sku || !name) return;
  await prisma.product.create({
    data: {
      sku,
      name,
      barcode: String(formData.get("barcode") || "") || null,
      description: String(formData.get("description") || "") || null,
      categoryId: String(formData.get("categoryId") || "") || null,
      unitId: String(formData.get("unitId") || "") || null,
      costPrice: Number(formData.get("costPrice") || 0),
      salePrice: Number(formData.get("salePrice") || 0),
      taxPercent: Number(formData.get("taxPercent") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
    },
  });
  redirect("/products");
}

export default async function NewProductPage() {
  await requireUser();
  const { t } = await getT();
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products.new")}
        action={
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("products.new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku">{t("products.sku")} *</Label>
              <Input id="sku" name="sku" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("common.name")} *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">{t("products.barcode")}</Label>
              <Input id="barcode" name="barcode" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">{t("common.category")}</Label>
              <Select id="categoryId" name="categoryId">
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
              <Select id="unitId" name="unitId">
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
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salePrice">{t("products.sale_price")}</Label>
              <Input id="salePrice" name="salePrice" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxPercent">{t("products.tax_percent")}</Label>
              <Input id="taxPercent" name="taxPercent" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reorderLevel">{t("products.reorder_level")}</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                step="0.01"
                defaultValue="0"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">{t("common.create")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
