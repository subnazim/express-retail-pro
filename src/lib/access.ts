import type { UserRole } from "@prisma/client";

export const ALL_ROLES: UserRole[] = [
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "ACCOUNTANT",
];

/**
 * Path-prefix → allowed roles. The longest matching prefix wins, so put
 * deeper paths above their parents. Anything not matched falls back to
 * "any authenticated user" (gated by the auth cookie check).
 */
const RULES: Array<{ prefix: string; roles: UserRole[] }> = [
  // Admin-only
  { prefix: "/branches", roles: ["ADMIN"] },
  { prefix: "/users", roles: ["ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN"] },
  { prefix: "/backup", roles: ["ADMIN"] },
  { prefix: "/api/backup", roles: ["ADMIN"] },

  // Inventory / catalog management — admin + manager
  { prefix: "/products", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/categories", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/units", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/stock", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/purchases", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/employees", roles: ["ADMIN", "MANAGER"] },

  // POS + sales — admin, manager, cashier
  { prefix: "/sales", roles: ["ADMIN", "MANAGER", "CASHIER"] },

  // Customer-facing — admin, manager, cashier, accountant
  { prefix: "/customers", roles: ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"] },

  // Finance — admin + accountant
  { prefix: "/cashbank", roles: ["ADMIN", "ACCOUNTANT"] },
  { prefix: "/salary", roles: ["ADMIN", "ACCOUNTANT"] },
  { prefix: "/suppliers", roles: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
  { prefix: "/expenses", roles: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
  { prefix: "/expense-categories", roles: ["ADMIN", "MANAGER", "ACCOUNTANT"] },

  // Reports — admin, manager, accountant
  { prefix: "/reports", roles: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
];

export function rolesForPath(pathname: string): UserRole[] {
  const sorted = [...RULES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const r of sorted) {
    if (pathname === r.prefix || pathname.startsWith(r.prefix + "/")) {
      return r.roles;
    }
  }
  return ALL_ROLES;
}

export function isAllowed(role: UserRole, pathname: string): boolean {
  return rolesForPath(pathname).includes(role);
}
