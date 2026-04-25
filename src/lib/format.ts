import { getSettings } from "./settings";
import { formatMoney as fm } from "./utils";

export async function getMoney() {
  const s = await getSettings();
  return (v: number | null | undefined) => fm(v, s.currencySymbol);
}
