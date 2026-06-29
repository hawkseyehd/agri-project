import { describe, expect, it } from "vitest";

// @ts-expect-error The runtime launcher is intentionally a native ESM script.
import { getNextInvocation } from "../../scripts/dev-command.mjs";

describe("development server command", () => {
  it("launches Next through Node instead of a Windows command shim", () => {
    const invocation = getNextInvocation(["dev", "-p", "3000"]);

    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args[0]).toMatch(/next[\\/]dist[\\/]bin[\\/]next/);
    expect(invocation.args.slice(1)).toEqual(["dev", "-p", "3000"]);
  });
});
