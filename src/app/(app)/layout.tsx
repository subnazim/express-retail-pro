import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { Sidebar } from "@/components/layout/sidebar";
import { NAV_GROUPS, SIDEBAR_LABEL_KEYS } from "@/components/layout/nav-config";
import { TopBar } from "@/components/layout/topbar";
import { isAllowed } from "@/lib/access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const settings = await getSettings();
  const { locale, t } = await getT();
  const sidebarLabels: Record<string, string> = {};
  for (const k of SIDEBAR_LABEL_KEYS) {
    sidebarLabels[k] = t(k);
  }
  const allowedHrefs: string[] = [];
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (isAllowed(user.role, item.href)) allowedHrefs.push(item.href);
    }
  }
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar
        appName={settings.companyName}
        tagline={t("app.tagline")}
        labels={sidebarLabels}
        allowedHrefs={allowedHrefs}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userName={user.name}
          roleLabel={t(`users.role.${user.role}`)}
          logoutLabel={t("auth.logout")}
          locale={locale}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
