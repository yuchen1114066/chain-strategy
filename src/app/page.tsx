import { redirect } from "next/navigation";

// chi-hua-ai-center 主域名直接跳轉到 CEO 戰情中心。
// 養生道首頁已搬到 /warmcare（如需保留），目前先不暴露。
export default function RootPage() {
  redirect("/erp/warroom");
}
