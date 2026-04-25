"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar({
  userName,
  userRole,
  locale,
  t,
}: {
  userName: string;
  userRole: string;
  locale: "en" | "bn";
  t: (key: string) => string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setLocale(next: "en" | "bn") {
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    start(() => router.refresh());
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="text-sm text-slate-500">
        <span className="font-medium text-slate-900">{userName}</span>
        <span className="mx-2">·</span>
        <span>{t(`users.role.${userRole}`)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border bg-white text-xs">
          <button
            type="button"
            onClick={() => setLocale("en")}
            disabled={pending}
            className={`px-2 py-1 rounded-l-md ${locale === "en" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("bn")}
            disabled={pending}
            className={`px-2 py-1 rounded-r-md ${locale === "bn" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Globe className="inline h-3 w-3 mr-0.5" />
            বাংলা
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t("auth.logout")}
        </Button>
      </div>
    </header>
  );
}
