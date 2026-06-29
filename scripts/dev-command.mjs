import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function getNextInvocation(args) {
  return {
    command: process.execPath,
    args: [require.resolve("next/dist/bin/next"), ...args]
  };
}
