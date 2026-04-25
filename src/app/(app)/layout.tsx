import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const settings = await getSettings();
  const { locale, t } = await getT();
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar appName={settings.companyName} tagline={t("app.tagline")} t={t} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userName={user.name}
          userRole={user.role}
          locale={locale}
          t={t}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
