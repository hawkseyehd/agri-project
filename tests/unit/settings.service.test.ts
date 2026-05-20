import { PermissionPage } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { setUserPagePermissions } from "@/server/services/settings/settings.service";

describe("settings service permissions", () => {
  it("replaces a user's page permission matrix", async () => {
    const db = {
      userPagePermission: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 })
      }
    };

    await setUserPagePermissions(
      "user_1",
      [
        {
          page: PermissionPage.FARMS,
          canView: true,
          canCreate: true,
          canEdit: false,
          canDelete: false
        },
        {
          page: PermissionPage.REPORTS,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      ],
      db as never
    );

    expect(db.userPagePermission.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1"
      }
    });
    expect(db.userPagePermission.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          page: PermissionPage.FARMS,
          canView: true,
          canCreate: true,
          canEdit: false,
          canDelete: false
        },
        {
          userId: "user_1",
          page: PermissionPage.REPORTS,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      ],
      skipDuplicates: true
    });
  });
});
