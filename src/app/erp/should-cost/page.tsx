import ShouldCostClient from "./ShouldCostClient";
import { parts } from "@/lib/erp/seed";
import { commodities, spc } from "@/lib/erp/commodities";

export default function ShouldCostPage() {
  // 預先生出可用 category 清單
  const categories = [...new Set(parts.map((p) => p.category))].sort();
  // 各原物料當前偏離（給漲價成分用）
  const commoditySnapshot = commodities.map((c) => {
    const s = spc(c);
    return { code: c.code, name: c.name, latest: s.latest, mean: s.mean, devPct: ((s.latest - s.mean) / s.mean) * 100 };
  });
  return <ShouldCostClient categories={categories} commoditySnapshot={commoditySnapshot} />;
}
