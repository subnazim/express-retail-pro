import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

export type Locale = "en" | "bn";
export const locales: Locale[] = ["en", "bn"];
export const defaultLocale: Locale = "en";

export const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  bn,
};

export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
}
