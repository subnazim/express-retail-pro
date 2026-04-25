import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSession, createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const { t } = await getT();
  const sp = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    if (!email || !password) {
      redirect("/login?error=invalid");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) redirect("/login?error=invalid");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) redirect("/login?error=invalid");
    await createSession({ userId: user.id, role: user.role });
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-md bg-blue-600 text-white grid place-items-center font-bold">
              ER
            </div>
            <div>
              <div className="font-semibold text-slate-900">{t("app.name")}</div>
              <div className="text-xs text-slate-500">{t("app.tagline")}</div>
            </div>
          </div>
          <CardTitle>{t("auth.welcome")}</CardTitle>
          <CardDescription>{t("auth.sub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="admin@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="admin123"
                autoComplete="current-password"
              />
            </div>
            {sp.error ? (
              <p className="text-sm text-red-600">{t("auth.invalid")}</p>
            ) : null}
            <Button type="submit" className="w-full">
              {t("auth.login")}
            </Button>
            <p className="text-xs text-slate-500 pt-2 text-center">
              Default: admin@example.com / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
