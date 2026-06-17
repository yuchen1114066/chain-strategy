"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// 4 step：① PO 確認  ② 生產進度更新  ③ ASN 出貨通知  ④ 確認鎖定送出
//   設計改自宏匯集團 B2B（navy hero + amber/teal + 4-step + lock-in）

type POSummary = {
  id: string; poNo: string; qty: number; unitCost: number;
  sentAt: string; ackDeadline: string; ackedAt?: string;
  expectedShipDate: string; expectedArrival: string;
  status: string;
  asnAlreadyFiled: boolean;
  lastProductionStage: string | null;
};

const STEPS = [
  { n: 1, label: "PO 確認", labelEn: "PO Acknowledge" },
  { n: 2, label: "生產進度", labelEn: "Production Update" },
  { n: 3, label: "ASN 出貨通知", labelEn: "Shipping Notice" },
  { n: 4, label: "確認鎖定送出", labelEn: "Lock & Submit" },
];

const PRODUCTION_STAGES = [
  { key: "material_ready", label: "已備料 Material Ready", icon: "📦" },
  { key: "in_production", label: "生產中 In Production", icon: "🏭" },
  { key: "packed", label: "已包裝 Packed", icon: "📮" },
  { key: "shipped", label: "已出貨 Shipped", icon: "🚚" },
];

export default function VendorFlowClient({ po, supplierName, partName, partCode, partUnit }: {
  po: POSummary;
  supplierName: string;
  partName: string;
  partCode: string;
  partUnit: string;
}) {
  // 自動跳到第一個未完成的步驟
  const initialStep = !po.ackedAt ? 1 : !po.lastProductionStage ? 2 : !po.asnAlreadyFiled ? 3 : 4;
  const [step, setStep] = useState<number>(initialStep);

  // form state
  const [ackName, setAckName] = useState("");
  const [ackNote, setAckNote] = useState("");
  const [stageKey, setStageKey] = useState(po.lastProductionStage ?? "material_ready");
  const [stageNote, setStageNote] = useState("");
  const [shipDate, setShipDate] = useState(po.expectedShipDate);
  const [trackingNo, setTrackingNo] = useState("");
  const [etaDate, setEtaDate] = useState(po.expectedArrival);
  const [carrier, setCarrier] = useState("");
  const [asnRemark, setAsnRemark] = useState("");
  const [agreeLock, setAgreeLock] = useState(false);
  const [submitted, setSubmitted] = useState<{ ref: string; ts: string } | null>(null);

  // 載入本機已暫存
  useEffect(() => {
    const restore = () => {
      const k = `gascc.vendorflow.${po.id}`;
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(k) : null;
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        if (s.submitted) setSubmitted(s.submitted);
        if (s.form) {
          setAckName(s.form.ackName ?? "");
          setAckNote(s.form.ackNote ?? "");
          setStageKey(s.form.stageKey ?? "material_ready");
          setStageNote(s.form.stageNote ?? "");
          setShipDate(s.form.shipDate ?? po.expectedShipDate);
          setTrackingNo(s.form.trackingNo ?? "");
          setEtaDate(s.form.etaDate ?? po.expectedArrival);
          setCarrier(s.form.carrier ?? "");
          setAsnRemark(s.form.asnRemark ?? "");
        }
      } catch {}
    };
    restore();
  }, [po.id, po.expectedShipDate, po.expectedArrival]);

  const progress = useMemo(() => (step / 4) * 100, [step]);

  function saveDraft() {
    if (typeof window === "undefined") return;
    const k = `gascc.vendorflow.${po.id}`;
    window.localStorage.setItem(k, JSON.stringify({
      form: { ackName, ackNote, stageKey, stageNote, shipDate, trackingNo, etaDate, carrier, asnRemark },
      submitted,
    }));
  }

  function nextStep(n: number) {
    saveDraft();
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep1() {
    if (!ackName.trim()) { alert("請填寫您的姓名+職稱"); return; }
    nextStep(2);
  }
  function validateStep2() {
    if (!stageKey) { alert("請選擇目前生產階段"); return; }
    nextStep(3);
  }
  function validateStep3() {
    if (!shipDate) { alert("請填寫出貨日"); return; }
    if (!trackingNo.trim()) { alert("請填寫貨運單號"); return; }
    if (!etaDate) { alert("請填寫預計到貨日"); return; }
    if (!carrier.trim()) { alert("請填寫承運商"); return; }
    nextStep(4);
  }
  function submitFinal() {
    if (!agreeLock) { alert("請勾選聲明確認"); return; }
    const ref = `SUB-${Date.now().toString(36).toUpperCase()}`;
    const ts = new Date().toISOString();
    const result = { ref, ts };
    setSubmitted(result);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`gascc.vendorflow.${po.id}`, JSON.stringify({
        form: { ackName, ackNote, stageKey, stageNote, shipDate, trackingNo, etaDate, carrier, asnRemark },
        submitted: result,
      }));
    }
  }

  // === 成功頁面 ===
  if (submitted) {
    return (
      <div style={{ background: "#F4F7FA", minHeight: "100vh", fontFamily: "Noto Sans TC, system-ui, sans-serif" }}>
        <Hero />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
            提交已鎖定 · Submission Locked
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.9, marginBottom: 18 }}>
            您的 PO 確認 / 進度 / ASN 已全部送出且立刻鎖定<br />
            All submissions are sealed and immutable.
          </div>
          <div style={{ display: "inline-block", background: "#E8F8EE", border: "2px solid #1A7A40", borderRadius: 8, padding: "10px 28px", fontFamily: "DM Mono,monospace", fontSize: 15, fontWeight: 700, color: "#1A7A40", marginBottom: 18, letterSpacing: ".07em" }}>
            {submitted.ref}
          </div>

          <div style={{ background: "linear-gradient(90deg,#1A7A40,#007C6E)", borderRadius: 9, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔒</div>
            <div style={{ textAlign: "left", color: "#fff" }}>
              <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: ".04em" }}>SUBMISSION SEALED · 已封存</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", marginTop: 2 }}>
                送出時間 {new Date(submitted.ts).toLocaleString("zh-TW", { hour12: false })}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid #E87D09", borderRadius: 10, padding: "16px 18px", marginTop: 14, textAlign: "left", maxWidth: 560, margin: "14px auto" }}>
            <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 14, fontWeight: 800, color: "#E87D09", letterSpacing: ".04em", marginBottom: 10 }}>
              ✏ 需要修改？· Need to Amend?
            </div>
            <div style={{ fontSize: 12, color: "#1E3050", lineHeight: 1.8 }}>
              已鎖定，無法自行更改。請 Email <strong>procurement@chihua.com.tw</strong>，主旨「申請修訂 {po.poNo} / {submitted.ref}」，採購人員會代為處理。
            </div>
          </div>

          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "18px 20px", textAlign: "left", maxWidth: 500, margin: "22px auto", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>後續流程 · What&apos;s Next</div>
            {["採購人員收到您的確認 / ASN（自動同步戰情室）",
              "本系統開始追蹤您的承諾 ETA，逾時 push 採購主管",
              "進料後品保上傳檢驗結果，您可在系統查看",
              "結果將計入您的「Supplier Digital Twin」分身，影響下次議價"].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 9, fontSize: 12.5, color: "#1E3050", lineHeight: 1.6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: "#0056B3", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/erp/supplier-portal/vendor" className="btn-outline">⬅ 回 PO 列表</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F4F7FA", minHeight: "100vh", fontFamily: "Noto Sans TC, system-ui, sans-serif" }}>
      <Hero />

      {/* 進度條 */}
      <div style={{ background: "rgba(255,255,255,.06)", height: 4, marginTop: -4 }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#E87D09,#2DD4BF)", width: `${progress}%`, transition: "width .5s ease" }} />
      </div>

      {/* 步驟條 */}
      <div style={{ background: "rgba(0,0,0,.85)", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ flex: 1, padding: "12px 0 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: step === s.n ? "3px solid #E87D09" : "3px solid transparent" }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999,
                background: s.n < step ? "#1A7A40" : s.n === step ? "#E87D09" : "rgba(255,255,255,.1)",
                color: s.n <= step ? "#fff" : "#7A9ABB",
                fontFamily: "Barlow Condensed,sans-serif", fontSize: 12, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{s.n < step ? "✓" : s.n}</div>
              <div>
                <div style={{ fontSize: 11.5, color: s.n === step ? "#fff" : "#5A7090", fontWeight: s.n === step ? 700 : 600 }}>{s.label}</div>
                <div style={{ fontSize: 9.5, color: s.n === step ? "#8AAAC8" : "#3A5070" }}>{s.labelEn}</div>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,.07)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* 主體 */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "22px 24px" }}>
        {/* PO 概覽（每步都顯示） */}
        <div className="bg-white rounded-xl p-4 mb-4" style={{ border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div style={{ fontFamily: "DM Mono,monospace", fontSize: 12, fontWeight: 700, color: "#0056B3" }}>{po.poNo}</div>
              <div className="font-bold mt-0.5">{partName}</div>
              <div className="text-xs text-slate-500">{supplierName}　·　{partCode}</div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-500">數量 / 單價</div>
              <div className="font-bold tabular-nums">{po.qty.toLocaleString()} {partUnit} × ${po.unitCost.toLocaleString()}</div>
              <div className="text-slate-500 mt-1">預定出貨 / 到貨</div>
              <div className="font-bold tabular-nums">{po.expectedShipDate} → {po.expectedArrival}</div>
            </div>
          </div>
        </div>

        {/* === Step 1: PO 確認 === */}
        {step === 1 && (
          <div>
            <Panel icon="🏭" title="① PO 數位化確認" subtitle="48hr 內必須確認，逾時系統會 push 採購主管">
              <div style={{ background: "#EAF3FF", border: "1.5px solid #0056B3", borderRadius: 9, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#0056B3", lineHeight: 1.8 }}>
                請確認上方 PO 內容（料件 / 數量 / 單價 / 預定交期）皆與您的接單條件一致。<br />
                Please confirm the PO details above match your accepted order terms.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <Field label="您的姓名+職稱" required>
                  <input className="fld" value={ackName} onChange={(e) => setAckName(e.target.value)} placeholder="e.g. 陳工程師 / 業務經理" />
                </Field>
                <Field label="預計開工日（選填）">
                  <input type="date" className="fld" />
                </Field>
              </div>
              <Field label="確認備註（如需協商價格 / 數量 / 交期，請說明）">
                <textarea className="fld" rows={3} value={ackNote} onChange={(e) => setAckNote(e.target.value)} placeholder="無備註則直接送出..." />
              </Field>
            </Panel>
            <NavBar onNext={validateStep1} nextLabel="下一步：生產進度 →" />
          </div>
        )}

        {/* === Step 2: 生產進度 === */}
        {step === 2 && (
          <div>
            <Panel icon="🏭" title="② 生產進度更新" subtitle="每步狀態系統自動記錄時間（累積為您的數位分身）">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {PRODUCTION_STAGES.map((s) => (
                  <button key={s.key} type="button" onClick={() => setStageKey(s.key)}
                    className="rounded-lg p-3 text-left transition-colors"
                    style={{
                      background: stageKey === s.key ? "#0056B3" : "#F8FAFC",
                      color: stageKey === s.key ? "#fff" : "#1E3050",
                      border: `1.5px solid ${stageKey === s.key ? "#0056B3" : "#E2E8F0"}`,
                    }}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xs font-bold">{s.label}</div>
                  </button>
                ))}
              </div>
              <Field label="進度備註（如有異常 / 延遲，請說明）">
                <textarea className="fld" rows={3} value={stageNote} onChange={(e) => setStageNote(e.target.value)} placeholder="無備註則直接下一步..." />
              </Field>
              <div style={{ background: "#FEF3E2", border: "1.5px solid #E87D09", borderRadius: 9, padding: "11px 14px", marginTop: 12, fontSize: 12, color: "#7A4000", lineHeight: 1.8 }}>
                ⏱ 您此 PO 的當前階段 baseline（依您過去 PO 累積）：祺驊系統會比對 baseline 偵測偏離 → 若超過 baseline + 2σ，AI 會將其列為「預警前兆」push 給採購主管。
              </div>
            </Panel>
            <NavBar onPrev={() => nextStep(1)} onNext={validateStep2} nextLabel="下一步：填 ASN →" />
          </div>
        )}

        {/* === Step 3: ASN 出貨通知 === */}
        {step === 3 && (
          <div>
            <Panel icon="🚚" title="③ ASN 出貨通知（Advanced Shipping Notice）" subtitle="出貨前必填，沒填 = 副總會收到延誤預警">
              <div style={{ background: "#FDECEA", border: "1.5px solid #C0392B", borderRadius: 9, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#8B1010", lineHeight: 1.8 }}>
                ⚠ <strong>預防性檢測啟動中</strong> — 若您未在預定出貨前 3 天填妥 ASN，本系統會 push 採購主管；逾預定出貨日仍未填 → 副總收到「即將延誤」紅燈警示。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <Field label="實際出貨日" required>
                  <input type="date" className="fld" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
                </Field>
                <Field label="預計到貨日" required>
                  <input type="date" className="fld" value={etaDate} onChange={(e) => setEtaDate(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <Field label="貨運單號 / Tracking No." required>
                  <input className="fld" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="e.g. TW-EXP-7782 / VN-HPH-441890" />
                </Field>
                <Field label="承運商 / Carrier" required>
                  <input className="fld" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. 新竹貨運 / Yang Ming Marine" />
                </Field>
              </div>
              <Field label="出貨備註（船期延遲 / 拆櫃 / 特殊事項）">
                <textarea className="fld" rows={3} value={asnRemark} onChange={(e) => setAsnRemark(e.target.value)} placeholder="例：船期延後 2 天（紅海危機影響）..." />
              </Field>

              <div style={{ marginTop: 14, padding: 14, background: "#F8FAFC", borderRadius: 9, border: "1px dashed #E2E8F0" }}>
                <div className="text-xs font-bold text-slate-700 mb-2">📎 附件上傳（選填）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <UploadStub label="出貨單 / Packing List" icon="📋" />
                  <UploadStub label="成績單 / CoA" icon="🔬" />
                  <UploadStub label="提單 / B/L" icon="🚢" />
                </div>
              </div>
            </Panel>
            <NavBar onPrev={() => nextStep(2)} onNext={validateStep3} nextLabel="下一步：確認鎖定 →" />
          </div>
        )}

        {/* === Step 4: 確認鎖定送出 === */}
        {step === 4 && (
          <div>
            <div style={{ background: "#FFF8E1", border: "1.5px solid #E87D09", borderRadius: 9, padding: "13px 16px", marginBottom: 16, fontSize: 12.5, color: "#7A4000", lineHeight: 1.8 }}>
              <span style={{ fontSize: 20, float: "left", marginRight: 10 }}>🔒</span>
              <strong>送出後立即鎖定 · Locked Upon Submission</strong><br />
              三步資料送出後即刻鎖定，不可自行修改。如需修訂請 Email <strong>procurement@chihua.com.tw</strong> 由採購方代為處理。
            </div>
            <Panel icon="🔍" title="提交內容確認 · Review" subtitle="請仔細核對所有資訊">
              <ReviewGrid items={[
                ["步驟 ① PO 確認人", ackName || "—"],
                ["PO 備註", ackNote || "—"],
                ["步驟 ② 當前生產階段", PRODUCTION_STAGES.find((x) => x.key === stageKey)?.label ?? stageKey],
                ["進度備註", stageNote || "—"],
                ["步驟 ③ 實際出貨日", shipDate],
                ["預計到貨日", etaDate],
                ["貨運單號", trackingNo],
                ["承運商", carrier],
                ["出貨備註", asnRemark || "—"],
              ]} />
            </Panel>
            <Panel icon="✅" title="聲明確認 · Declaration">
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12.5, color: "#1E3050", lineHeight: 1.8 }}>
                <input type="checkbox" checked={agreeLock} onChange={(e) => setAgreeLock(e.target.checked)} style={{ marginTop: 3, width: 15, height: 15, accentColor: "#0056B3" }} />
                <span>本公司確認所填報之 PO 確認 / 生產進度 / ASN 出貨資料均為真實正確。本提交送出後即<strong>立刻鎖定</strong>，內容不可自行修改，如需更改須由採購方代為處理。所有資料同步至祺驊 ERP 戰情室及 Supplier Digital Twin 數位分身。</span>
              </label>
            </Panel>
            <div className="flex justify-between mt-4">
              <button onClick={() => nextStep(3)} className="btn-outline">← 上一步</button>
              <button onClick={submitFinal} disabled={!agreeLock}
                style={{ background: agreeLock ? "#E87D09" : "#cbd5e1", color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: agreeLock ? "pointer" : "not-allowed", border: "none" }}>
                🔒 確認鎖定並提交 · Lock & Submit
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fld {
          width: 100%; border: 1.5px solid #E2E8F0; border-radius: 7px;
          padding: 9px 11px; font-family: inherit; font-size: 13px; color: #0A1628;
          background: #fff; outline: none; transition: border .2s, box-shadow .2s;
        }
        .fld:focus { border-color: #0056B3; box-shadow: 0 0 0 3px rgba(0,86,179,.1); }
        textarea.fld { resize: vertical; min-height: 68px; }
        .btn-outline {
          padding: 10px 22px; border-radius: 8px; font-size: 13.5px; font-weight: 700;
          background: #fff; border: 1.5px solid #E2E8F0; color: #1E3050; cursor: pointer;
        }
        .btn-outline:hover { border-color: #0056B3; color: #0056B3; }
      `}</style>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ background: "linear-gradient(140deg, #0A1628 0%, #0D2E55 55%, #0A3D30 100%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#dc2626,#F5A623)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Barlow Condensed,sans-serif", fontSize: 20, fontWeight: 900, color: "#fff" }}>祺</div>
          <div>
            <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: ".04em" }}>祺驊 CHI HUA · Vendor Submission</div>
            <div style={{ fontSize: 10, color: "#5DADE2", letterSpacing: ".1em", textTransform: "uppercase" }}>PO 確認 → 進度 → ASN → 鎖定送出</div>
          </div>
        </div>
        <Link href="/erp/supplier-portal/vendor" style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#8AAAC8", fontSize: 11, fontWeight: 600 }}>
          ← 回 PO 列表
        </Link>
      </div>
    </div>
  );
}

function Panel({ icon, title, subtitle, children }: { icon: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl mb-4" style={{ border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}>
      <div style={{ padding: "13px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
        <div>
          <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: ".04em" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label style={{ fontSize: 11, fontWeight: 700, color: "#1E3050" }}>
        {label} {required && <span style={{ color: "#E87D09" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function UploadStub({ label, icon }: { label: string; icon: string }) {
  return (
    <button type="button" style={{ border: "2px dashed #E2E8F0", borderRadius: 9, padding: 14, textAlign: "center", background: "#F8FAFC", cursor: "pointer", transition: "all .2s" }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#94A3B8" }}>{label}</div>
    </button>
  );
}

function NavBar({ onPrev, onNext, nextLabel }: { onPrev?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex justify-between mt-4">
      {onPrev ? (
        <button onClick={onPrev} className="btn-outline">← 上一步</button>
      ) : <div />}
      <button onClick={onNext} style={{ background: "#0056B3", color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer" }}>
        {nextLabel}
      </button>
    </div>
  );
}

function ReviewGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map(([k, v], i) => (
        <div key={i} style={{ background: "#F8FAFC", borderRadius: 7, padding: "9px 12px" }}>
          <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2, fontWeight: 600 }}>{k}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}
