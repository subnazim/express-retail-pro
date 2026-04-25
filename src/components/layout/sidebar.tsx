"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScanBarcode,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Warehouse,
  Banknote,
  Receipt,
  UserCog,
  Building2,
  Settings,
  Database,
  BarChart3,
  Tag,
  Ruler,
  ClipboardList,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  titleKey: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    titleKey: "",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/sales/pos", labelKey: "nav.pos", icon: ScanBarcode },
    ],
  },
  {
    titleKey: "Operations",
    items: [
      { href: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
      { href: "/purchases", labelKey: "nav.purchases", icon: Truck },
      { href: "/stock", labelKey: "nav.stock", icon: Warehouse },
      { href: "/stock/transfer", labelKey: "nav.stock_transfer", icon: ArrowLeftRight },
      { href: "/stock/adjust", labelKey: "nav.stock_adjust", icon: ClipboardList },
    ],
  },
  {
    titleKey: "Inventory",
    items: [
      { href: "/products", labelKey: "nav.products", icon: Package },
      { href: "/categories", labelKey: "nav.categories", icon: Tag },
      { href: "/units", labelKey: "nav.units", icon: Ruler },
    ],
  },
  {
    titleKey: "Parties",
    items: [
      { href: "/customers", labelKey: "nav.customers", icon: Users },
      { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
    ],
  },
  {
    titleKey: "Finance",
    items: [
      { href: "/expenses", labelKey: "nav.expenses", icon: Receipt },
      { href: "/expense-categories", labelKey: "nav.expense_categories", icon: Tag },
      { href: "/cashbank", labelKey: "nav.cashbank", icon: Wallet },
    ],
  },
  {
    titleKey: "HR",
    items: [
      { href: "/employees", labelKey: "nav.employees", icon: UserCog },
      { href: "/salary", labelKey: "nav.salary", icon: Banknote },
    ],
  },
  {
    titleKey: "Reports",
    items: [
      { href: "/reports/profit-loss", labelKey: "reports.profit_loss", icon: BarChart3 },
      { href: "/reports/sales", labelKey: "reports.sales", icon: BarChart3 },
      { href: "/reports/purchase", labelKey: "reports.purchase", icon: BarChart3 },
      { href: "/reports/stock", labelKey: "reports.stock", icon: BarChart3 },
      { href: "/reports/customer-due", labelKey: "reports.customer_due", icon: BarChart3 },
      { href: "/reports/supplier-due", labelKey: "reports.supplier_due", icon: BarChart3 },
      { href: "/reports/cash", labelKey: "reports.cash", icon: BarChart3 },
      { href: "/reports/bank", labelKey: "reports.bank", icon: BarChart3 },
    ],
  },
  {
    titleKey: "Admin",
    items: [
      { href: "/branches", labelKey: "nav.branches", icon: Building2 },
      { href: "/users", labelKey: "nav.users", icon: UserCog },
      { href: "/settings", labelKey: "nav.settings", icon: Settings },
      { href: "/backup", labelKey: "nav.backup", icon: Database },
    ],
  },
];

export function Sidebar({
  appName,
  tagline,
  t,
}: {
  appName: string;
  tagline: string;
  t: (key: string) => string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white sticky top-0 h-screen overflow-y-auto">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-blue-600 text-white grid place-items-center font-bold">
            ER
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-none">{appName}</div>
            <div className="text-xs text-slate-500 mt-1">{tagline}</div>
          </div>
        </div>
      </div>
      <nav className="px-2 py-3 flex-1 space-y-4">
        {groups.map((group, idx) => (
          <div key={idx}>
            {group.titleKey && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.titleKey}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                        active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
