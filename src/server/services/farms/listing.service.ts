export type SeasonStateFilter = "all" | "active" | "idle";

type FarmSummary = {
  name: string;
  location?: string | null;
  address?: string | null;
  managers: Array<{
    manager: {
      name: string;
      email?: string | null;
    };
  }>;
  blocks: Array<{
    areaAcres?: unknown;
    seasons: Array<{
      status: string;
    }>;
  }>;
};

type LandBlockSummary = {
  name: string;
  areaAcres?: unknown;
  farm: {
    name: string;
  };
  seasons: Array<{
    status: string;
  }>;
};

type ListingFilters = {
  query?: string;
  seasonState?: SeasonStateFilter;
};

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function decimalNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function hasActiveSeason(seasons: Array<{ status: string }>) {
  return seasons.some((season) => season.status === "ACTIVE");
}

function matchesSeasonState(hasActive: boolean, seasonState: SeasonStateFilter = "all") {
  if (seasonState === "active") {
    return hasActive;
  }

  if (seasonState === "idle") {
    return !hasActive;
  }

  return true;
}

export function filterFarmSummaries<TFarm extends FarmSummary>(farms: TFarm[], filters: ListingFilters = {}) {
  const query = normalized(filters.query);

  return farms.filter((farm) => {
    const active = farm.blocks.some((block) => hasActiveSeason(block.seasons));
    const searchable = [
      farm.name,
      farm.address,
      farm.location,
      ...farm.managers.flatMap((assignment) => [assignment.manager.name, assignment.manager.email])
    ]
      .map(normalized)
      .join(" ");

    return (!query || searchable.includes(query)) && matchesSeasonState(active, filters.seasonState);
  });
}

export function getFarmListSummary(farms: FarmSummary[]) {
  return farms.reduce(
    (summary, farm) => {
      summary.farmCount += 1;

      for (const block of farm.blocks) {
        summary.blockCount += 1;
        summary.totalArea += decimalNumber(block.areaAcres);
        summary.activeSeasonCount += block.seasons.filter((season) => season.status === "ACTIVE").length;
      }

      return summary;
    },
    {
      farmCount: 0,
      blockCount: 0,
      totalArea: 0,
      activeSeasonCount: 0
    }
  );
}

export function filterLandBlockSummaries<TBlock extends LandBlockSummary>(blocks: TBlock[], filters: ListingFilters = {}) {
  const query = normalized(filters.query);

  return blocks.filter((block) => {
    const searchable = [block.name, block.farm.name].map(normalized).join(" ");
    return (!query || searchable.includes(query)) && matchesSeasonState(hasActiveSeason(block.seasons), filters.seasonState);
  });
}

export function getLandBlockListSummary(blocks: LandBlockSummary[]) {
  return blocks.reduce(
    (summary, block) => {
      summary.blockCount += 1;
      summary.totalArea += decimalNumber(block.areaAcres);
      summary.activeBlockCount += hasActiveSeason(block.seasons) ? 1 : 0;
      return summary;
    },
    {
      blockCount: 0,
      totalArea: 0,
      activeBlockCount: 0
    }
  );
}
