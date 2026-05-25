// 伺服器端讀取 cookie 取得當前語系
import { cookies } from "next/headers";
import { DICTS, type Lang, type Dict } from "./i18n";

export async function getLang(): Promise<Lang> {
  try {
    const c = await cookies();
    const v = c.get("gascc_lang")?.value;
    if (v === "zh-CN" || v === "en" || v === "vi" || v === "zh-TW") return v;
  } catch {}
  return "zh-TW";
}

export async function getDict(): Promise<Dict> {
  const l = await getLang();
  return DICTS[l];
}
