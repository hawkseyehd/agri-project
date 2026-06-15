export type YieldSummaryRange = {
  from?: Date;
  to?: Date;
};

export type YieldSummaryRecord = {
  cropName: string;
  quantity: number | string;
  unit: string;
  yieldDate: Date;
  city?: string | null;
  district?: string | null;
  farmId: string;
  ownerId?: string | null;
};

export type YieldGroup = {
  cropName: string;
  district: string;
  unit: string;
  totalQuantity: number;
  farmCount: number;
  ownerCount: number;
  recordCount: number;
};

function normalizeLabel(value: string | null | undefined, fallback: string) {
  const label = value?.trim();
  return label ? label : fallback;
}

function isWithinRange(record: YieldSummaryRecord, range: YieldSummaryRange) {
  const time = record.yieldDate.getTime();
  return (!range.from || time >= range.from.getTime()) && (!range.to || time <= range.to.getTime());
}

export function summarizeYieldRecords(records: YieldSummaryRecord[], range: YieldSummaryRange = {}) {
  const groups = new Map<string, YieldGroup & { farmIds: Set<string>; ownerIds: Set<string> }>();
  const filteredRecords = records.filter((record) => isWithinRange(record, range));

  for (const record of filteredRecords) {
    const cropName = normalizeLabel(record.cropName, "Unknown crop");
    const district = normalizeLabel(record.district ?? record.city, "Unknown district");
    const unit = normalizeLabel(record.unit, "Unit");
    const key = [cropName.toLowerCase(), district.toLowerCase(), unit.toLowerCase()].join("|");
    const current =
      groups.get(key) ??
      {
        cropName,
        district,
        unit,
        totalQuantity: 0,
        farmCount: 0,
        ownerCount: 0,
        recordCount: 0,
        farmIds: new Set<string>(),
        ownerIds: new Set<string>()
      };

    current.totalQuantity += Number(record.quantity);
    current.recordCount += 1;
    current.farmIds.add(record.farmId);
    if (record.ownerId) {
      current.ownerIds.add(record.ownerId);
    }

    current.farmCount = current.farmIds.size;
    current.ownerCount = current.ownerIds.size;
    groups.set(key, current);
  }

  const byDistrict = Array.from(groups.values())
    .map(({ farmIds: _farmIds, ownerIds: _ownerIds, ...group }) => group)
    .sort((a, b) => a.cropName.localeCompare(b.cropName) || a.district.localeCompare(b.district) || a.unit.localeCompare(b.unit));

  return {
    byDistrict,
    totals: {
      quantity: filteredRecords.reduce((total, record) => total + Number(record.quantity), 0),
      recordCount: filteredRecords.length,
      farmCount: new Set(filteredRecords.map((record) => record.farmId)).size,
      ownerCount: new Set(filteredRecords.map((record) => record.ownerId).filter(Boolean)).size
    }
  };
}
