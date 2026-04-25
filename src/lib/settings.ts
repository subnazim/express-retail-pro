import { prisma } from "./prisma";

export async function getSettings() {
  let s = await prisma.setting.findFirst();
  if (!s) {
    s = await prisma.setting.create({ data: {} });
  }
  return s;
}
