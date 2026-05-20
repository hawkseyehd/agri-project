export type CropSeasonStatusFilter = "ALL" | "PLANNED" | "ACTIVE" | "HARVESTED" | "CLOSED";

type CropSeasonSummary = {
  cropName: string;
  variety?: string | null;
  status: string;
  startDate: Date;
  endDate?: Date | null;
  block: {
    name: string;
    farm: {
      name: string;
    };
  };
  harvests: Array<{
    quantity: unknown;
  }>;
  expenses: Array<{
    amount: unknown;
  }>;
};

type ListingFilters = {
  query?: string;
  status?: CropSeasonStatusFilter;
};

const statusOrder = ["PLANNED", "ACTIVE", "HARVESTED", "CLOSED"];

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function decimalNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function filterCropSeasonSummaries<TSeason extends CropSeasonSummary>(seasons: TSeason[], filters: ListingFilters = {}) {
  const query = normalized(filters.query);
  const status = filters.status ?? "ALL";

  return seasons.filter((season) => {
    const searchable = [season.cropName, season.variety, season.block.name, season.block.farm.name].map(normalized).join(" ");
    return (!query || searchable.includes(query)) && (status === "ALL" || season.status === status);
  });
}

export function getCropSeasonListSummary(seasons: CropSeasonSummary[]) {
  const cropCounts = new Map<string, { activeCount: number; totalCount: number }>();

  let nearestHarvestDate: Date | null = null;
  let actualYield = 0;
  let expenseTotal = 0;
  let activeSeasonCount = 0;

  for (const season of seasons) {
    const cropCount = cropCounts.get(season.cropName) ?? { activeCount: 0, totalCount: 0 };
    cropCount.totalCount += 1;
    cropCount.activeCount += season.status === "ACTIVE" ? 1 : 0;
    cropCounts.set(season.cropName, cropCount);
    activeSeasonCount += season.status === "ACTIVE" ? 1 : 0;
    actualYield += season.harvests.reduce((total, harvest) => total + decimalNumber(harvest.quantity), 0);
    expenseTotal += season.expenses.reduce((total, expense) => total + decimalNumber(expense.amount), 0);

    if (season.endDate && (!nearestHarvestDate || season.endDate < nearestHarvestDate)) {
      nearestHarvestDate = season.endDate;
    }
  }

  const primaryCrop =
    [...cropCounts.entries()].sort(
      (left, right) =>
        right[1].activeCount - left[1].activeCount ||
        right[1].totalCount - left[1].totalCount ||
        left[0].localeCompare(right[0])
    )[0]?.[0] ?? "None";

  return {
    seasonCount: seasons.length,
    activeSeasonCount,
    primaryCrop,
    nearestHarvestDate,
    actualYield,
    expenseTotal
  };
}

export function getCropSeasonTimeline(season: Pick<CropSeasonSummary, "status">) {
  const currentIndex = statusOrder.indexOf(season.status);

  return statusOrder.map((status, index) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    complete: currentIndex >= index
  }));
}
