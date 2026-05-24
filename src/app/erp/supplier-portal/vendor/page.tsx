import Link from "next/link";
import { digitalPOs } from "@/lib/erp/supplier-portal";
import { suppliers, parts, today } from "@/lib/erp/seed";

// 供應商提交入口 — 給供應商業務用的視角（vendor-side）
// 設計改自宏匯集團 B2B 投標模組（navy hero + amber/teal + lock-in 機制）
// 對應我們的 4 真實流程：PO 確認 → 生產進度 → ASN 出貨 → 鎖定送出

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿", sent: "待確認", acked: "已確認", in_production: "生產中",
  shipped: "已出貨", received: "已到貨", closed: "已結案", rejected: "已拒絕",
};
const STATUS_TONE: Record<string, string> = {
  draft: "#94A3B8", sent: "#E87D09", acked: "#0056B3", in_production: "#1A7ABF",
  shipped: "#1A7A40", received: "#007C6E", closed: "#94A3B8", rejected: "#C0392B",
};

export default async function VendorLanding({ searchParams }: { searchParams: Promise<{ supplier?: string }> }) {
  const { supplier: supplierId } = await searchParams;
  const selectedSupplier = supplierId ? suppliers.find((s) => s.id === supplierId) : null;
  const myPOs = selectedSupplier
    ? digitalPOs.filter((p) => p.supplierId === selectedSupplier.id)
    : digitalPOs;
  const supplierOptions = suppliers.filter((s) => digitalPOs.some((p) => p.supplierId === s.id));

  return (
    <div style={{ background: "#F4F7FA", minHeight: "100vh", fontFamily: "Noto Sans TC, system-ui, sans-serif" }}>
      {/* === Hero（改自宏匯 B2B：navy gradient + 祺驊 amber/teal）=== */}
      <div style={{ background: "linear-gradient(140deg, #0A1628 0%, #0D2E55 55%, #0A3D30 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "32px 24px 22px" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#dc2626,#F5A623)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Barlow Condensed,sans-serif", fontSize: 24, fontWeight: 900, color: "#fff", boxShadow: "0 4px 16px rgba(220,38,38,.4)" }}>祺</div>
              <div>
                <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: ".04em", lineHeight: 1.1 }}>祺驊 CHI HUA · Supplier Portal</div>
                <div style={{ fontSize: 10, color: "#5DADE2", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 2 }}>供應商提交入口 · Vendor Submission Portal</div>
              </div>
            </div>
            <Link href="/erp/supplier-portal" style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#8AAAC8", fontSize: 11, fontWeight: 600 }}>
              ← ERP 採購端
            </Link>
          </div>
          <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 8 }}>
            供應商<span style={{ color: "#F5A623" }}> 線上提交</span>系統
          </div>
          <div style={{ fontSize: 13, color: "#8AAAC8", lineHeight: 1.9, maxWidth: 720 }}>
            歡迎供應商業務登入，完成 <strong style={{ color: "#fff" }}>PO 確認 → 生產進度 → ASN 出貨</strong> 三大流程。
            <strong style={{ color: "#fff" }}>送出後立即鎖定，不可自行修改</strong>。如需修訂請 Email 採購方代為處理。
          </div>
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,176,155,.15)", border: "1px solid rgba(0,176,155,.35)", borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "#2DD4BF", fontWeight: 700, letterSpacing: ".05em" }}>
            <span style={{ fontSize: 8 }}>●</span> 系統開放中 · 同步鼎新 ERP iGP
          </div>
        </div>
      </div>

      {/* === 主體 === */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 24px" }}>
        <div className="bg-white rounded-xl border p-4 mb-4" style={{ borderColor: "#E2E8F0" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#1E3050", fontFamily: "Barlow Condensed,sans-serif", letterSpacing: ".04em" }}>
            選擇您的身份（Demo — 正式版以供應商 token 登入）
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/erp/supplier-portal/vendor" className={`px-3 py-1.5 rounded text-xs font-semibold ${!supplierId ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              全部 PO（{digitalPOs.length}）
            </Link>
            {supplierOptions.map((s) => (
              <Link key={s.id} href={`/erp/supplier-portal/vendor?supplier=${s.id}`}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${supplierId === s.id ? "text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                style={supplierId === s.id ? { background: "#0056B3" } : undefined}>
                {s.name}（{digitalPOs.filter((p) => p.supplierId === s.id).length}）
              </Link>
            ))}
          </div>
        </div>

        {myPOs.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-4xl mb-2">📭</div>
            <div className="text-slate-500">目前沒有需處理的 PO</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myPOs.map((po) => {
              const supplier = suppliers.find((s) => s.id === po.supplierId);
              const part = parts.find((p) => p.id === po.partId);
              const tone = STATUS_TONE[po.status];
              const needsAction =
                (po.status === "sent" && !po.ackedAt) ? "👉 點此確認 PO" :
                (po.status === "acked" || po.status === "in_production") && !po.asn ? "👉 更新進度 / 填 ASN" :
                po.status === "shipped" ? "🚚 運送中" :
                po.status === "received" ? "✅ 已結案" : "";
              const shipPlanned = new Date(po.expectedShipDate + "T00:00:00Z").getTime();
              const todayMs = new Date(today + "T00:00:00Z").getTime();
              const daysToShip = Math.round((shipPlanned - todayMs) / 86_400_000);
              return (
                <Link key={po.id} href={`/erp/supplier-portal/vendor/${po.id}`}
                  className="block bg-white rounded-xl p-4 transition-shadow hover:shadow-md"
                  style={{ border: "1px solid #E2E8F0" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ fontFamily: "DM Mono,monospace", fontSize: 12, fontWeight: 700, color: "#0056B3" }}>{po.poNo}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 12, background: `${tone}1a`, color: tone }}>
                      ● {STATUS_LABEL[po.status]}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-800">{part?.name ?? po.partId}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{supplier?.name}　·　{part?.code}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[9px] text-slate-500">數量</div>
                      <div className="font-bold tabular-nums">{po.qty} {part?.unit}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">單價</div>
                      <div className="font-bold tabular-nums">${po.unitCost.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">預定出貨</div>
                      <div className={`font-bold tabular-nums ${daysToShip < 0 ? "text-rose-600" : daysToShip <= 7 ? "text-amber-600" : "text-slate-700"}`}>
                        {daysToShip >= 0 ? `T-${daysToShip}d` : `逾${-daysToShip}d`}
                      </div>
                    </div>
                  </div>
                  {needsAction && (
                    <div className="mt-3 pt-3 border-t text-xs font-bold" style={{ color: needsAction.includes("確認") ? "#E87D09" : needsAction.includes("ASN") ? "#0056B3" : "#1A7A40", borderColor: "#E2E8F0" }}>
                      {needsAction}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card title="① PO 數位化確認" tone="#E87D09" desc="48hr 內必須在系統按確認，逾時系統 push 採購主管。" />
          <Card title="② 生產進度更新" tone="#0056B3" desc="已備料 / 生產中 / 已包裝 / 已出貨 — 每步系統記錄時間，累積為您的數位分身。" />
          <Card title="③ ASN 出貨通知" tone="#1A7A40" desc="出貨前必填：出貨日 / 貨運單號 / 預計到貨日。沒填 = 副總收到延誤預警。" />
        </div>

        <div style={{ marginTop: 18, background: "#FFF8E1", border: "1.5px solid #E87D09", borderRadius: 9, padding: "13px 16px", fontSize: 12, color: "#7A4000", lineHeight: 1.8 }}>
          🔒 <strong>送出後立即鎖定</strong> — 各步驟確認送出後即刻鎖定，不可自行修改。如需修訂請 Email <strong>procurement@chihua.com.tw</strong> 由採購方代為處理。
          <br />您的所有操作都記入「Supplier Digital Twin」(供應商數位分身)，影響未來的議價與選商。
        </div>

        <div style={{ textAlign: "center", padding: 18, fontSize: 11, color: "#94A3B8", borderTop: "1px solid #E2E8F0", marginTop: 24, lineHeight: 1.9 }}>
          <strong>祺驊 CHI HUA GROUP</strong> · 供應商協作平台 Supplier Collaboration Portal · v1.0
        </div>
      </div>
    </div>
  );
}

function Card({ title, tone, desc }: { title: string; tone: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E2E8F0", borderLeft: `4px solid ${tone}` }}>
      <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontWeight: 800, fontSize: 14, color: tone, letterSpacing: ".04em" }}>{title}</div>
      <div className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">{desc}</div>
    </div>
  );
}
