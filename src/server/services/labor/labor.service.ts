export type LaborWorkerRecord = {
  id: string;
  farmId?: string;
  name: string;
  workerType: string;
  phone?: string | null;
  entityKind?: string;
  employmentType?: string;
  activityType?: string;
  costUnit?: string;
  status: string;
  dailyWage: unknown;
  salaryAmount?: unknown;
  perAcreRate?: unknown;
  startDate?: Date | null;
  endDate?: Date | null;
  teamSize?: unknown;
  archivedAt?: Date | null;
};

export type LaborAttendanceRecord = {
  id: string;
  reportDate: Date;
  status: string;
  wageAmount: unknown;
  paidAmount: unknown;
  worker: {
    name: string;
  };
};

export type LaborOverviewInput = {
  workers: LaborWorkerRecord[];
  attendanceRecords: LaborAttendanceRecord[];
};

export type LaborCostInput = {
  entityKind: string;
  costUnit: string;
  dailyWage: unknown;
  perAcreRate: unknown;
  acresWorked: unknown;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toOptionalDateKey(date?: Date | null) {
  return date ? toDateKey(date) : null;
}

function isAttendanceRequired(worker: LaborWorkerRecord) {
  return (worker.entityKind ?? "INDIVIDUAL") === "INDIVIDUAL" && (worker.employmentType ?? "SALARY") === "SALARY";
}

function isReportSelectable(worker: LaborWorkerRecord) {
  if ((worker.entityKind ?? "INDIVIDUAL") === "TEAM") {
    return true;
  }

  return (worker.employmentType ?? "SALARY") !== "SALARY";
}

export function calculateLaborEntryCost(input: LaborCostInput) {
  if (input.entityKind === "TEAM" || input.costUnit === "PER_ACRE") {
    return toNumber(input.perAcreRate) * toNumber(input.acresWorked);
  }

  return toNumber(input.dailyWage);
}

export function buildLaborHistorySnapshot(worker: LaborWorkerRecord) {
  return {
    workerId: worker.id,
    farmId: worker.farmId ?? "",
    name: worker.name,
    entityKind: worker.entityKind ?? "INDIVIDUAL",
    employmentType: worker.employmentType ?? "SALARY",
    activityType: worker.activityType ?? "FIELD_LABOUR",
    costUnit: worker.costUnit ?? "DAILY_WAGE",
    dailyWage: toNumber(worker.dailyWage),
    salaryAmount: toNumber(worker.salaryAmount),
    perAcreRate: toNumber(worker.perAcreRate),
    startDate: toOptionalDateKey(worker.startDate),
    endDate: toOptionalDateKey(worker.endDate),
    teamSize: toNumber(worker.teamSize),
    phone: worker.phone ?? null,
    workerType: worker.workerType
  };
}

export function buildLaborOverview({ workers, attendanceRecords }: LaborOverviewInput) {
  const activeRegistryWorkers = workers.filter((worker) => !worker.archivedAt);

  return {
    workers: activeRegistryWorkers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      workerType: worker.workerType,
      entityKind: worker.entityKind ?? "INDIVIDUAL",
      employmentType: worker.employmentType ?? "SALARY",
      activityType: worker.activityType ?? "FIELD_LABOUR",
      costUnit: worker.costUnit ?? "DAILY_WAGE",
      status: worker.status,
      dailyWage: toNumber(worker.dailyWage),
      salaryAmount: toNumber(worker.salaryAmount),
      perAcreRate: toNumber(worker.perAcreRate),
      startDate: toOptionalDateKey(worker.startDate),
      endDate: toOptionalDateKey(worker.endDate),
      teamSize: toNumber(worker.teamSize),
      attendanceRequired: isAttendanceRequired(worker),
      reportSelectable: isReportSelectable(worker)
    })),
    attendanceRecords: attendanceRecords.map((attendance) => ({
      id: attendance.id,
      workerName: attendance.worker.name,
      reportDate: toDateKey(attendance.reportDate),
      status: attendance.status,
      wageAmount: toNumber(attendance.wageAmount)
    })),
    totals: {
      activeWorkers: activeRegistryWorkers.filter((worker) => worker.status === "ACTIVE").length,
      attendanceCount: attendanceRecords.length,
      wageTotal: attendanceRecords.reduce((total, attendance) => total + toNumber(attendance.wageAmount), 0),
      balanceTotal: attendanceRecords.reduce(
        (total, attendance) => total + Math.max(toNumber(attendance.wageAmount) - toNumber(attendance.paidAmount), 0),
        0
      )
    },
    schemaReady: true
  };
}
