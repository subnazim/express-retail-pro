import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Database, Download } from "lucide-react";

export default async function BackupPage() {
  await requireRole(["ADMIN"]);
  const { t } = await getT();
  const counts = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.sale.count(),
    prisma.purchase.count(),
    prisma.expense.count(),
  ]);
  const [products, customers, suppliers, sales, purchases, expenses] = counts;
  return (
    <div className="space-y-6">
      <PageHeader title={t("backup.title")} description={t("backup.desc")} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Snapshot
          </CardTitle>
          <CardDescription>
            Exports all tables as a single JSON file. Use it for offline
            archiving or to restore via the Prisma seed pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Stat label="Products" value={products} />
            <Stat label="Customers" value={customers} />
            <Stat label="Suppliers" value={suppliers} />
            <Stat label="Sales" value={sales} />
            <Stat label="Purchases" value={purchases} />
            <Stat label="Expenses" value={expenses} />
          </div>
          <a href="/api/backup" download>
            <Button>
              <Download className="h-4 w-4" />
              {t("backup.export")}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
