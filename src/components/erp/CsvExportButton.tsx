"use client";

import { useMemo } from "react";

type Cell = string | number | null | undefined;
type Row = Record<string, Cell>;

export default function CsvExportButton({
  filename,
  rows,
  columns,
  label = "📥 匯出 CSV",
}: {
  filename: string;
  rows: Row[];
  columns: { key: string; label: string }[];
  label?: string;
}) {
  const dataUrl = useMemo(() => {
    const header = columns.map((c) => escapeCsv(c.label)).join(",");
    const lines = rows.map((r) =>
      columns.map((c) => escapeCsv(r[c.key])).join(",")
    );
    const csv = "﻿" + [header, ...lines].join("\n"); // BOM for Excel utf-8
    return "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  }, [rows, columns]);

  return (
    <a
      href={dataUrl}
      download={filename}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 hover:border-cyan-400 text-slate-700"
    >
      {label}
    </a>
  );
}

function escapeCsv(v: Cell): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
