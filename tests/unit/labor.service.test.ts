import { describe, expect, it } from "vitest";

import { buildLaborHistorySnapshot, buildLaborOverview, calculateLaborEntryCost } from "@/server/services/labor/labor.service";

describe("labor service", () => {
  it("builds worker, attendance, and wage totals from labor records", () => {
    const overview = buildLaborOverview({
      workers: [
        {
          id: "worker_1",
          farmId: "farm_1",
          name: "Ali Raza",
          workerType: "Field Worker",
          entityKind: "INDIVIDUAL",
          employmentType: "SALARY",
          activityType: "FIELD_LABOUR",
          costUnit: "DAILY_WAGE",
          status: "ACTIVE",
          dailyWage: 1500,
          salaryAmount: null,
          perAcreRate: null,
          startDate: null,
          endDate: null,
          teamSize: null,
          archivedAt: null
        },
        {
          id: "worker_2",
          farmId: "farm_1",
          name: "Naveed Iqbal",
          workerType: "Tractor Driver",
          entityKind: "INDIVIDUAL",
          employmentType: "DAILY_WAGE",
          activityType: "TRACTOR_WORK",
          costUnit: "DAILY_WAGE",
          status: "INACTIVE",
          dailyWage: 2200,
          salaryAmount: null,
          perAcreRate: null,
          startDate: null,
          endDate: null,
          teamSize: null,
          archivedAt: null
        }
      ],
      attendanceRecords: [
        {
          id: "attendance_1",
          reportDate: new Date("2026-04-28"),
          status: "PRESENT",
          wageAmount: 1500,
          paidAmount: 1000,
          worker: {
            name: "Ali Raza"
          }
        },
        {
          id: "attendance_2",
          reportDate: new Date("2026-04-28"),
          status: "HALF_DAY",
          wageAmount: 1100,
          paidAmount: 1100,
          worker: {
            name: "Naveed Iqbal"
          }
        }
      ]
    });

    expect(overview).toEqual({
      workers: [
        {
          id: "worker_1",
          name: "Ali Raza",
          workerType: "Field Worker",
          entityKind: "INDIVIDUAL",
          employmentType: "SALARY",
          activityType: "FIELD_LABOUR",
          costUnit: "DAILY_WAGE",
          status: "ACTIVE",
          dailyWage: 1500,
          salaryAmount: 0,
          perAcreRate: 0,
          startDate: null,
          endDate: null,
          teamSize: 0,
          attendanceRequired: true,
          reportSelectable: false
        },
        {
          id: "worker_2",
          name: "Naveed Iqbal",
          workerType: "Tractor Driver",
          entityKind: "INDIVIDUAL",
          employmentType: "DAILY_WAGE",
          activityType: "TRACTOR_WORK",
          costUnit: "DAILY_WAGE",
          status: "INACTIVE",
          dailyWage: 2200,
          salaryAmount: 0,
          perAcreRate: 0,
          startDate: null,
          endDate: null,
          teamSize: 0,
          attendanceRequired: false,
          reportSelectable: true
        }
      ],
      attendanceRecords: [
        {
          id: "attendance_1",
          workerName: "Ali Raza",
          reportDate: "2026-04-28",
          status: "PRESENT",
          wageAmount: 1500
        },
        {
          id: "attendance_2",
          workerName: "Naveed Iqbal",
          reportDate: "2026-04-28",
          status: "HALF_DAY",
          wageAmount: 1100
        }
      ],
      totals: {
        activeWorkers: 1,
        attendanceCount: 2,
        wageTotal: 2600,
        balanceTotal: 500
      },
      schemaReady: true
    });
  });

  it("keeps archived labor out of the active registry overview", () => {
    const overview = buildLaborOverview({
      workers: [
        {
          id: "active_team",
          farmId: "farm_1",
          name: "Leaf cutting team",
          workerType: "Leaf cutting",
          entityKind: "TEAM",
          employmentType: "TEMPORARY",
          activityType: "LEAF_CUTTING",
          costUnit: "PER_ACRE",
          status: "ACTIVE",
          dailyWage: 0,
          salaryAmount: null,
          perAcreRate: 4500,
          startDate: new Date("2026-05-01"),
          endDate: new Date("2026-05-10"),
          teamSize: 8,
          archivedAt: null
        },
        {
          id: "archived_worker",
          farmId: "farm_1",
          name: "Old temporary worker",
          workerType: "Harvesting",
          entityKind: "INDIVIDUAL",
          employmentType: "TEMPORARY",
          activityType: "HARVESTING",
          costUnit: "DAILY_WAGE",
          status: "INACTIVE",
          dailyWage: 1800,
          salaryAmount: null,
          perAcreRate: null,
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-15"),
          teamSize: null,
          archivedAt: new Date("2026-04-16")
        }
      ],
      attendanceRecords: []
    });

    expect(overview.workers).toHaveLength(1);
    expect(overview.workers[0]).toMatchObject({
      id: "active_team",
      entityKind: "TEAM",
      attendanceRequired: false,
      reportSelectable: true,
      perAcreRate: 4500
    });
  });

  it("calculates individual daily wage and team per-acre report costs", () => {
    expect(
      calculateLaborEntryCost({
        entityKind: "INDIVIDUAL",
        costUnit: "DAILY_WAGE",
        dailyWage: 1750,
        perAcreRate: null,
        acresWorked: null
      })
    ).toBe(1750);

    expect(
      calculateLaborEntryCost({
        entityKind: "TEAM",
        costUnit: "PER_ACRE",
        dailyWage: null,
        perAcreRate: 5200,
        acresWorked: 3.5
      })
    ).toBe(18200);
  });

  it("builds a history snapshot when labor is archived", () => {
    const snapshot = buildLaborHistorySnapshot({
      id: "worker_1",
      farmId: "farm_1",
      name: "Temporary planter",
      phone: "0300-0000000",
      workerType: "Planting",
      entityKind: "INDIVIDUAL",
      employmentType: "TEMPORARY",
      activityType: "PLANTING",
      costUnit: "DAILY_WAGE",
      status: "ACTIVE",
      dailyWage: 1600,
      salaryAmount: null,
      perAcreRate: null,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-05"),
      teamSize: null,
      archivedAt: null
    });

    expect(snapshot).toEqual({
      workerId: "worker_1",
      farmId: "farm_1",
      name: "Temporary planter",
      entityKind: "INDIVIDUAL",
      employmentType: "TEMPORARY",
      activityType: "PLANTING",
      costUnit: "DAILY_WAGE",
      dailyWage: 1600,
      salaryAmount: 0,
      perAcreRate: 0,
      startDate: "2026-05-01",
      endDate: "2026-05-05",
      teamSize: 0,
      phone: "0300-0000000",
      workerType: "Planting"
    });
  });
});
