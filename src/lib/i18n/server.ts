import { cookies } from "next/headers";
import { defaultLocale, locales, t as tFn, type Locale } from "./dict";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("locale")?.value as Locale | undefined;
  return v && locales.includes(v) ? v : defaultLocale;
}

export async function getT() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string) => tFn(locale, key),
  };
}
