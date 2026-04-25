import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";

async function saveSettings(formData: FormData) {
  "use server";
  await requireRole(["ADMIN", "MANAGER"]);
  const s = await getSettings();
  await prisma.setting.update({
    where: { id: s.id },
    data: {
      companyName: String(formData.get("companyName") || s.companyName),
      currency: String(formData.get("currency") || s.currency),
      currencySymbol: String(formData.get("currencySymbol") || s.currencySymbol),
      language: String(formData.get("language") || s.language),
      invoicePrefix: String(formData.get("invoicePrefix") || s.invoicePrefix),
      purchasePrefix: String(formData.get("purchasePrefix") || s.purchasePrefix),
      vatPercent: Number(formData.get("vatPercent") || 0),
      address: String(formData.get("address") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export default async function SettingsPage() {
  await requireRole(["ADMIN", "MANAGER"]);
  const { t } = await getT();
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.settings")} description={t("app.tagline")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">{t("settings.company_name")}</Label>
              <Input id="companyName" name="companyName" defaultValue={s.companyName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("common.phone")}</Label>
              <Input id="phone" name="phone" defaultValue={s.phone || ""} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">{t("common.address")}</Label>
              <Input id="address" name="address" defaultValue={s.address || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" name="email" type="email" defaultValue={s.email || ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t("settings.currency")}</Label>
              <Input id="currency" name="currency" defaultValue={s.currency} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currencySymbol">{t("settings.currency_symbol")}</Label>
              <Input id="currencySymbol" name="currencySymbol" defaultValue={s.currencySymbol} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">{t("settings.language")}</Label>
              <Select id="language" name="language" defaultValue={s.language}>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoicePrefix">{t("settings.invoice_prefix")}</Label>
              <Input id="invoicePrefix" name="invoicePrefix" defaultValue={s.invoicePrefix} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrefix">{t("settings.purchase_prefix")}</Label>
              <Input id="purchasePrefix" name="purchasePrefix" defaultValue={s.purchasePrefix} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vatPercent">{t("settings.vat_percent")}</Label>
              <Input
                id="vatPercent"
                name="vatPercent"
                type="number"
                step="0.01"
                defaultValue={s.vatPercent}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
