export type NavItemConfig = {
  href: string;
  labelKey: string;
  iconName: string;
};

export type NavGroupConfig = {
  titleKey: string;
  items: NavItemConfig[];
};

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    titleKey: "",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", iconName: "LayoutDashboard" },
      { href: "/sales/pos", labelKey: "nav.pos", iconName: "ScanBarcode" },
    ],
  },
  {
    titleKey: "Operations",
    items: [
      { href: "/sales", labelKey: "nav.sales", iconName: "ShoppingCart" },
      { href: "/purchases", labelKey: "nav.purchases", iconName: "Truck" },
      { href: "/stock", labelKey: "nav.stock", iconName: "Warehouse" },
      { href: "/stock/transfer", labelKey: "nav.stock_transfer", iconName: "ArrowLeftRight" },
      { href: "/stock/adjust", labelKey: "nav.stock_adjust", iconName: "ClipboardList" },
    ],
  },
  {
    titleKey: "Inventory",
    items: [
      { href: "/products", labelKey: "nav.products", iconName: "Package" },
      { href: "/categories", labelKey: "nav.categories", iconName: "Tag" },
      { href: "/units", labelKey: "nav.units", iconName: "Ruler" },
    ],
  },
  {
    titleKey: "Parties",
    items: [
      { href: "/customers", labelKey: "nav.customers", iconName: "Users" },
      { href: "/suppliers", labelKey: "nav.suppliers", iconName: "Truck" },
    ],
  },
  {
    titleKey: "Finance",
    items: [
      { href: "/expenses", labelKey: "nav.expenses", iconName: "Receipt" },
      { href: "/expense-categories", labelKey: "nav.expense_categories", iconName: "Tag" },
      { href: "/cashbank", labelKey: "nav.cashbank", iconName: "Wallet" },
    ],
  },
  {
    titleKey: "HR",
    items: [
      { href: "/employees", labelKey: "nav.employees", iconName: "UserCog" },
      { href: "/salary", labelKey: "nav.salary", iconName: "Banknote" },
    ],
  },
  {
    titleKey: "Reports",
    items: [
      { href: "/reports/profit-loss", labelKey: "reports.profit_loss", iconName: "BarChart3" },
      { href: "/reports/sales", labelKey: "reports.sales", iconName: "BarChart3" },
      { href: "/reports/purchase", labelKey: "reports.purchase", iconName: "BarChart3" },
      { href: "/reports/stock", labelKey: "reports.stock", iconName: "BarChart3" },
      { href: "/reports/customer-due", labelKey: "reports.customer_due", iconName: "BarChart3" },
      { href: "/reports/supplier-due", labelKey: "reports.supplier_due", iconName: "BarChart3" },
      { href: "/reports/cash", labelKey: "reports.cash", iconName: "BarChart3" },
      { href: "/reports/bank", labelKey: "reports.bank", iconName: "BarChart3" },
    ],
  },
  {
    titleKey: "Admin",
    items: [
      { href: "/branches", labelKey: "nav.branches", iconName: "Building2" },
      { href: "/users", labelKey: "nav.users", iconName: "UserCog" },
      { href: "/settings", labelKey: "nav.settings", iconName: "Settings" },
      { href: "/backup", labelKey: "nav.backup", iconName: "Database" },
    ],
  },
];

export const SIDEBAR_LABEL_KEYS: string[] = Array.from(
  new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.labelKey))),
);
