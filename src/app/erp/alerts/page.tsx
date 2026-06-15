import AlertList from "@/components/erp/AlertList";
import { computeAlerts } from "@/lib/erp/alerts";

export default function AlertsPage() {
  const alerts = computeAlerts();
  const red = alerts.filter((a) => a.severity === "red");
  const yellow = alerts.filter((a) => a.severity === "yellow");

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🚨 異常警訊</h1>
        <p className="text-sm text-slate-500 mt-1">
          規則引擎自動偵測：缺料 / 進度延遲 / 誤船風險 / 品質異常
        </p>
      </header>

      <section>
        <h2 className="font-bold mb-3 text-rose-700">🔴 紅燈（{red.length}）</h2>
        <AlertList alerts={red} />
      </section>

      <section>
        <h2 className="font-bold mb-3 text-amber-700">🟡 黃燈（{yellow.length}）</h2>
        <AlertList alerts={yellow} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 text-sm">
        <h3 className="font-bold mb-2">規則說明</h3>
        <ul className="space-y-1 text-slate-700">
          <li>· <b>缺料</b>：BOM 展開後 庫存 - 需求 &lt; 0 → 紅燈</li>
          <li>· <b>進度延遲</b>：計畫日已過但無實際完成日 → 黃燈</li>
          <li>· <b>誤船風險</b>：船期剩餘天數不足以走完未完成階段 → 視嚴重度紅/黃</li>
          <li>· <b>品質異常</b>：階段不良率 &gt; 3% → 紅燈</li>
        </ul>
      </section>
    </div>
  );
}
