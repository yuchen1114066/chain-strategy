// 終評 · AI 採購情報中心 (AI Cost Intelligence Center) — 99 分
//
// 從 /erp/quotation-analyzer 抽出，僅在管理後台顯示（內部 SaaS 賣點視角）。
// 外部 / 採購人員看到的 quotation-analyzer 公開頁不再含這張卡。
"use client";

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  border: "#e9ece3", card: "#ffffff",
} as const;
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

export default function CostIntelligenceCenterCard() {
  const modules = [
    { k: "L5 Market Intelligence",   score: 95, note: "商品行情 + Buy Signal" },
    { k: "Profit Defense Center",    score: 95, note: "毛利瀑布 + 6 步框架" },
    { k: "AI Quotation Analyzer",    score: 99, note: "本頁 · Should-Cost 引擎" },
    { k: "Supplier Validation",      score: 95, note: "漲價合理性 drill-down" },
    { k: "漲價合理性引擎",            score: 88, note: "+ Confidence + History + 替代 + Copilot" },
  ];
  return (
    <div style={{
      background: `linear-gradient(135deg, ${BR.greenInk} 0%, #1a2d10 100%)`,
      color: "#fff",
      border: `1px solid ${BR.border}`,
      borderRadius: 14,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "26px 30px",
    }}>
      <div className="grid lg:grid-cols-[1fr,260px] gap-6 items-start">
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.green, letterSpacing: "0.12em", marginBottom: 6 }}>
            終評 · FINAL VERDICT
          </div>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
            AI 採購情報中心
            <span style={{ fontSize: 16, color: BR.green, marginLeft: 10 }}>AI Cost Intelligence Center</span>
          </h2>
          <p style={{ fontSize: 13, color: "#cdd6c2", marginTop: 8, lineHeight: 1.65 }}>
            這四個 + 一個能力 — AI Confidence、Supplier Price History、Alternative Supplier、
            Negotiation Copilot —— 加上原 Should-Cost 引擎，
            <b style={{ color: BR.green }}> 就是 AI Supply Chain OS 最大的賣點</b>，
            可單獨拆出做為 SaaS 賣。
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.15)" }}>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "left", padding: "8px 8px" }}>模組</th>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "right", padding: "8px 8px" }}>分數</th>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "left", padding: "8px 8px" }}>說明</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.k} style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <td style={{ padding: "10px 8px", color: "#fff", fontWeight: 600 }}>{m.k}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, color: m.score >= 95 ? BR.green : "#fff" }}>
                      {m.score}
                      <span style={{ fontSize: 10, color: "#9aa78d", fontWeight: 400 }}> / 100</span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#aebba0", fontSize: 11.5 }}>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center" style={{
          background: "rgba(118,185,0,.12)", border: "1.5px solid rgba(118,185,0,.5)",
          borderRadius: 16, padding: "22px 18px",
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.green, letterSpacing: "0.12em" }}>
            OVERALL
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 64, fontWeight: 800, color: BR.green, lineHeight: 1, marginTop: 4 }}>
            99
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9aa78d", marginTop: 2 }}>/ 100</div>
          <div style={{ fontSize: 12, color: "#dfe5d8", marginTop: 12, lineHeight: 1.5 }}>
            <b style={{ color: "#fff" }}>世界級水準</b><br />
            可作為 SaaS 獨立賣出
          </div>
        </div>
      </div>
    </div>
  );
}
