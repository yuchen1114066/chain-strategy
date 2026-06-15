// Engine 4 — Time Coordination Engine（Timeline Graph）
//
// 真正核心問題：供應鏈本質是「時間錯配」
//   缺料 = 時間錯配（需要的時點 vs 到達的時點）
//   停線 = 時間錯配（產線需要的時間 vs 料件到的時間）
//   呆料 = 時間錯配（買進的時點 vs 用掉的時點）
//   急單 = 時間錯配（客戶要的時點 vs 我能交的時點）
//   空運 = 為了補時間差付的代價
//
// 未來真正核心資料結構：不是 PO / BOM，而是 Timeline Graph
//   · Node = 事件（在時間軸上的某個點）
//   · Edge = 時間依賴 / 因果關係
//   · AI 在 Graph 上推理（不是 table 查詢）
//
// 系統每天 ingest：ASN / ETA / IQC / OTD / Delay / Capacity / Cost / Commodity → 持續流動 → AI 越來越強

import { workOrders, today, models } from "./seed";
import { digitalPOs } from "./supplier-portal";
import { forecastAll } from "./otif";
import { etaForecastAll } from "./eta-forecast";

export type NodeKind =
  | "po_sent" | "po_acked"
  | "asn_filed" | "asn_eta" | "asn_actual_arrival"
  | "iqc_done"
  | "material_ready" | "line_start" | "line_end" | "pack_done" | "ship"
  | "customer_required" | "customer_received"
  | "commodity_event" | "delay_signal";

export type EntityKind = "supplier" | "po" | "wo" | "part" | "customer" | "commodity";

export type TimelineNode = {
  id: string;
  kind: NodeKind;
  entityKind: EntityKind;
  entityId: string;
  occurredAt: string;          // ISO datetime
  label: string;
  payload?: Record<string, unknown>;
  isFuture: boolean;            // 過去事實 vs 未來預測
};

export type EdgeRelation = "depends_on" | "causes" | "consumes" | "produces" | "blocks" | "predicts";

export type TimelineEdge = {
  fromNode: string;
  toNode: string;
  relation: EdgeRelation;
  weight?: number;              // 因果強度
};

// ============================================================
// 從現有 seed 建構 Timeline Graph
// ============================================================
function todayDt(): Date { return new Date(today + "T00:00:00Z"); }
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function isFutureIso(iso: string): boolean {
  return new Date(iso).getTime() > todayDt().getTime();
}

export function buildTimelineGraph(): { nodes: TimelineNode[]; edges: TimelineEdge[] } {
  const nodes: TimelineNode[] = [];
  const edges: TimelineEdge[] = [];

  // ① 從 digital POs 拉出事件
  for (const po of digitalPOs) {
    const nSent: TimelineNode = {
      id: `n-po-sent-${po.id}`, kind: "po_sent", entityKind: "po", entityId: po.id,
      occurredAt: po.sentAt, label: `PO ${po.poNo} 發出`, isFuture: false,
    };
    nodes.push(nSent);
    if (po.ackedAt) {
      const nAck: TimelineNode = {
        id: `n-po-acked-${po.id}`, kind: "po_acked", entityKind: "po", entityId: po.id,
        occurredAt: po.ackedAt, label: `供應商確認 ${po.poNo}`, isFuture: false,
      };
      nodes.push(nAck);
      edges.push({ fromNode: nSent.id, toNode: nAck.id, relation: "causes" });
    }
    if (po.asn) {
      const nAsn: TimelineNode = {
        id: `n-asn-${po.id}`, kind: "asn_filed", entityKind: "po", entityId: po.id,
        occurredAt: po.asn.filedAt, label: `ASN 提交 ${po.poNo}`,
        payload: { trackingNo: po.asn.trackingNo, etaDate: po.asn.etaDate }, isFuture: false,
      };
      const nEta: TimelineNode = {
        id: `n-asn-eta-${po.id}`, kind: "asn_eta", entityKind: "po", entityId: po.id,
        occurredAt: po.asn.etaDate + "T08:00:00Z", label: `預計到貨 ${po.poNo}`,
        isFuture: isFutureIso(po.asn.etaDate + "T08:00:00Z"),
      };
      nodes.push(nAsn, nEta);
      edges.push({ fromNode: nAsn.id, toNode: nEta.id, relation: "predicts" });
    }
    // production log → 事件
    for (const log of po.productionLog) {
      const kindMap: Record<string, NodeKind> = {
        material_ready: "material_ready",
        in_production: "line_start",
        packed: "pack_done",
        shipped: "ship",
        arrived: "asn_actual_arrival",
      };
      const k = kindMap[log.stage];
      if (k) {
        nodes.push({
          id: `n-log-${po.id}-${log.stage}`, kind: k,
          entityKind: "po", entityId: po.id,
          occurredAt: log.timestamp, label: `${log.stage} (${po.poNo})`, isFuture: false,
        });
      }
    }
  }

  // ② 從 work orders 拉客戶交期事件
  for (const wo of workOrders) {
    const m = models.find((x) => x.id === wo.modelId);
    const reqNode: TimelineNode = {
      id: `n-cust-req-${wo.id}`, kind: "customer_required", entityKind: "wo", entityId: wo.id,
      occurredAt: wo.shipDate + "T18:00:00Z",
      label: `客戶要求 ${wo.woNo} ${wo.customer} ${m?.code} × ${wo.qty}`,
      isFuture: isFutureIso(wo.shipDate + "T18:00:00Z"),
    };
    nodes.push(reqNode);
    // 工單 stages
    for (const s of wo.stages) {
      if (s.actualDate || s.plannedDate) {
        const at = s.actualDate ?? s.plannedDate;
        const k: NodeKind | null =
          s.stage === "material" ? "material_ready" :
          s.stage === "line" ? "line_start" :
          s.stage === "pack" ? "pack_done" :
          s.stage === "ship" ? "ship" :
          s.stage === "customer" ? "customer_received" : null;
        if (k) {
          const n: TimelineNode = {
            id: `n-wo-${wo.id}-${s.stage}`, kind: k,
            entityKind: "wo", entityId: wo.id,
            occurredAt: at + "T12:00:00Z",
            label: `${s.stage} (${wo.woNo})`,
            isFuture: !s.actualDate && isFutureIso(at + "T12:00:00Z"),
          };
          nodes.push(n);
        }
      }
    }
  }

  // ③ 從 OTIF forecast 拉未來 delay signals
  for (const f of forecastAll()) {
    if (f.light === "red") {
      const n: TimelineNode = {
        id: `n-delay-${f.wo.id}`, kind: "delay_signal", entityKind: "wo", entityId: f.wo.id,
        occurredAt: f.predictedShipDate + "T12:00:00Z",
        label: `🚨 ${f.wo.woNo} 預測延誤 ${-f.slackDays} 天`,
        isFuture: true,
      };
      nodes.push(n);
    }
  }

  // ④ 從 ETA forecast 拉未來 PO 風險
  for (const e of etaForecastAll()) {
    if (e.onTimeProbability < 60) {
      const n: TimelineNode = {
        id: `n-eta-risk-${e.poId}`, kind: "delay_signal", entityKind: "po", entityId: e.poId,
        occurredAt: e.predictedArrival + "T12:00:00Z",
        label: `🚨 ${e.poNo} 準時機率僅 ${e.onTimeProbability}%`,
        isFuture: true,
      };
      nodes.push(n);
    }
  }

  return {
    nodes: nodes.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    edges,
  };
}

// ============================================================
// 「時間錯配」偵測 — 真正核心問題
// ============================================================
export type TimeMismatch = {
  category: "shortage" | "stockout" | "deadstock" | "rush" | "air_freight";
  label: string;
  description: string;
  examples: number;
  mechanism: string;            // 為何發生（時間錯配的具體形式）
};

export function detectMismatches(): TimeMismatch[] {
  const forecasts = forecastAll();
  const etaList = etaForecastAll();
  const red = forecasts.filter((f) => f.light === "red").length;
  const yellow = forecasts.filter((f) => f.light === "yellow").length;
  const etaRisk = etaList.filter((e) => e.onTimeProbability < 60).length;

  return [
    {
      category: "shortage", label: "缺料",
      description: "需要料的時點 > 料到達的時點",
      examples: red + yellow,
      mechanism: "下游工單需求日 - 供應商到貨日 = 負值 → 時間錯配",
    },
    {
      category: "stockout", label: "停線",
      description: "產線需要的時間 > 料件到達的時間",
      examples: red,
      mechanism: "工單算料階段日期 - 料件實際 ETA = 缺口",
    },
    {
      category: "deadstock", label: "呆料",
      description: "買進的時點 < 用掉的時點（買太早）",
      examples: 0,
      mechanism: "進料時間 - 預期消耗時間 > 360 天 → 呆滯",
    },
    {
      category: "rush", label: "急單",
      description: "客戶要求的時點 < 系統能交付的時點",
      examples: etaRisk,
      mechanism: "客戶 ship_date - 系統 predicted_ship = 負值",
    },
    {
      category: "air_freight", label: "空運",
      description: "為了補時間差付的代價",
      examples: red,
      mechanism: "空運 = 把 leadDays 從 45 壓到 3，用錢買時間",
    },
  ];
}

// ============================================================
// 統計 / 摘要
// ============================================================
export function timelineStats(graph: { nodes: TimelineNode[]; edges: TimelineEdge[] }) {
  const past = graph.nodes.filter((n) => !n.isFuture).length;
  const future = graph.nodes.filter((n) => n.isFuture).length;
  const risks = graph.nodes.filter((n) => n.kind === "delay_signal").length;
  const byEntity = new Map<EntityKind, number>();
  for (const n of graph.nodes) {
    byEntity.set(n.entityKind, (byEntity.get(n.entityKind) ?? 0) + 1);
  }
  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    pastNodes: past,
    futureNodes: future,
    riskNodes: risks,
    byEntity: [...byEntity.entries()],
  };
}

// 取一段時間窗的事件（含過去 + 未來）
export function nodesInWindow(graph: { nodes: TimelineNode[] }, daysBack = 14, daysForward = 30): TimelineNode[] {
  const t0 = todayDt().getTime() - daysBack * 86_400_000;
  const t1 = todayDt().getTime() + daysForward * 86_400_000;
  return graph.nodes.filter((n) => {
    const t = new Date(n.occurredAt).getTime();
    return t >= t0 && t <= t1;
  });
}

// 持續流動的「每日 ingest」摘要
export const DAILY_INGEST_STREAMS = [
  { name: "ASN",       label: "出貨通知",   desc: "供應商上傳的 ASN → 累積 ETA 預測精度" },
  { name: "ETA",       label: "預計到貨",    desc: "ASN 與 PO 對比 + Twin baseline → 預測機率" },
  { name: "IQC",       label: "進料品質",    desc: "Cpk / 合格率 / 不良 → 供應商雷達餵料" },
  { name: "OTD",       label: "準時交貨率",  desc: "出貨日 vs 預定 → OTIF/OTD KPI" },
  { name: "Delay",     label: "延誤事件",    desc: "預測 vs 實際 → 修正 baseline" },
  { name: "Capacity",  label: "產能",        desc: "設備稼動率 + 工序時間 → 排程預測" },
  { name: "Cost",      label: "成本",        desc: "Should-Cost vs 實際結算 → 修正模型" },
  { name: "Commodity", label: "原物料",      desc: "LME / Brent / 中鋼 → SPC + 4 區判斷" },
];

export { addDays, isFutureIso };
