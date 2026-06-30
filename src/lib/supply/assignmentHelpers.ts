/** Normalized material used item for display. */
export interface NormalizedMaterialUsed {
  materialId: number;
  stockId?: number;
  materialName?: string;
  qtyValue: number;
  qtyUnit: string;
}

interface MaterialsUsedRowRaw {
  materialId?: number;
  material_id?: number;
  stockId?: number | string;
  stock_id?: number | string;
  materialName?: string;
  material_name?: string;
  qtyValue?: number;
  qty_value?: number;
  qtyUnit?: string;
  qty_unit?: string;
  stockBatchNo?: string | null;
  stockExpiryDate?: string | null;
}

function coalesceMaterialsUsedItems(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      return coalesceMaterialsUsedItems(JSON.parse(t) as unknown);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") return [raw];
  return [];
}

function parseMaterialsUsedArray(raw: unknown): NormalizedMaterialUsed[] {
  const value = coalesceMaterialsUsedItems(raw);

  const out: NormalizedMaterialUsed[] = [];
  for (const item of value) {
    if (item == null || typeof item !== "object") continue;
    const m = item as MaterialsUsedRowRaw;
    const materialId = Number(m.materialId ?? m.material_id ?? 0);
    const sid = m.stockId ?? m.stock_id;
    const stockNum = sid == null ? NaN : Number(sid);
    const stockId = Number.isFinite(stockNum) ? stockNum : NaN;
    const qtyValue = Number(m.qtyValue ?? m.qty_value ?? 0);
    const qtyUnit = String(m.qtyUnit ?? m.qty_unit ?? "");
    const materialName = (m.materialName ?? m.material_name) as string | undefined;

    if (!Number.isFinite(materialId) || materialId < 0) continue;
    if (!Number.isFinite(qtyValue)) continue;

    out.push({
      materialId,
      stockId: Number.isFinite(stockId) ? stockId : undefined,
      materialName: materialName?.trim() ? materialName.trim() : undefined,
      qtyValue,
      qtyUnit,
    });
  }
  return out;
}

function parseMaterialsUsed(row: {
  materialsUsed?: unknown;
  materials_used?: unknown;
}): NormalizedMaterialUsed[] {
  const raw = row.materialsUsed ?? row.materials_used;
  return parseMaterialsUsedArray(raw);
}

export function getAssignmentMaterialsUsed(
  row: { materialsUsed?: unknown; materials_used?: unknown },
  materialsLookup?: { id: number; name: string }[]
): NormalizedMaterialUsed[] {
  const items = parseMaterialsUsed(row);
  if (!materialsLookup?.length) return items;
  const byId = new Map(materialsLookup.map((m) => [m.id, m.name]));
  return items.map((m) => ({
    ...m,
    materialName: m.materialName ?? byId.get(m.materialId) ?? undefined,
  }));
}
