// 多階 BOM 樹狀建構 + 遞迴成本 rollup
//
// 把 flat 的 bom[] (含 parentPartCode + level) 重組為 tree，並對自製件 /
// 虛設 / Feature / 託外加工件做 cost rollup：因為這些料 unitCost 通常為 0，
// 真實成本要從子件加總得到。

import { bom, parts } from "./seed";
import type { BomLine, Part } from "./types";

export type BomNode = {
  bomLine: BomLine;
  part: Part;
  // 此節點的「自身材料成本」= qtyPerUnit × part.unitCost
  ownCost: number;
  // 此節點的「總成本」= ownCost + 所有子孫 rolledUpCost
  rolledUpCost: number;
  children: BomNode[];
};

export function buildBomTree(modelId: string): BomNode[] {
  const lines = bom.filter((b) => b.modelId === modelId && b.isActive);
  // index by parent
  const byParent = new Map<string, BomLine[]>();
  for (const line of lines) {
    const key = line.parentPartCode ?? "__root__";
    const arr = byParent.get(key) ?? [];
    arr.push(line);
    byParent.set(key, arr);
  }

  function buildChildren(parentCode: string | undefined): BomNode[] {
    const key = parentCode ?? "__root__";
    const list = byParent.get(key) ?? [];
    const result: BomNode[] = [];
    for (const line of list) {
      const part = parts.find((p) => p.id === line.partId);
      if (!part) continue;
      const children = buildChildren(part.code);
      const ownCost = line.qtyPerUnit * (part.unitCost || 0);
      const childrenCost = children.reduce((s, c) => s + c.rolledUpCost, 0);
      // 自製件/虛設/Feature/Option：以子件加總為主；採購件/託外：以 ownCost 為主
      const useChildrenCost =
        part.kind === "self" || part.kind === "dummy" ||
        part.kind === "feature" || part.kind === "option";
      const rolledUpCost = useChildrenCost
        ? childrenCost + ownCost  // 加總都列入（ownCost 通常為 0）
        : ownCost + childrenCost;  // 採購件可能還有 outsource 子件
      result.push({ bomLine: line, part, ownCost, rolledUpCost, children });
    }
    return result;
  }

  return buildChildren(undefined);
}

// 整棵樹的總 rollup 成本
export function rolledUpCostFor(modelId: string): number {
  return buildBomTree(modelId).reduce((s, n) => s + n.rolledUpCost, 0);
}

// 把樹展平為「料件 → 累計用量」(for shortage simulation)
export function flattenLeaves(modelId: string): Map<string, { part: Part; totalQty: number }> {
  const tree = buildBomTree(modelId);
  const out = new Map<string, { part: Part; totalQty: number }>();
  function walk(nodes: BomNode[], multiplier: number) {
    for (const n of nodes) {
      const qty = n.bomLine.qtyPerUnit * multiplier;
      if (n.children.length === 0) {
        // 葉節點
        const ex = out.get(n.part.code) ?? { part: n.part, totalQty: 0 };
        ex.totalQty += qty;
        out.set(n.part.code, ex);
      } else {
        // 內部節點，下挖
        walk(n.children, qty);
      }
    }
  }
  walk(tree, 1);
  return out;
}
