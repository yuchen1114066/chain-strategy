"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 font-semibold"
    >
      🖨️ 列印 / 匯出 PDF
    </button>
  );
}
