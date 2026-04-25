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
import { NAV_GROUPS } from "./nav-config";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

export function Sidebar({
  appName,
  tagline,
  labels,
}: {
  appName: string;
  tagline: string;
  labels: Record<string, string>;
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
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx}>
            {group.titleKey && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.titleKey}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.iconName] ?? Package;
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
                      <span className="truncate">
                        {labels[item.labelKey] ?? item.labelKey}
                      </span>
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
