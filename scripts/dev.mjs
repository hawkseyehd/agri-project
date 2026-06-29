import { spawn } from "node:child_process";

import { getNextInvocation } from "./dev-command.mjs";

const args = process.argv.slice(2);

function readPort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if ((arg === "-p" || arg === "--port") && argv[index + 1]) {
      return argv[index + 1];
    }

    if (arg.startsWith("--port=")) {
      return arg.slice("--port=".length);
    }
  }

  return process.env.PORT ?? "3000";
}

const port = readPort(args);
const origin = `http://localhost:${port}`;
const nextInvocation = getNextInvocation(["dev", ...args]);

const child = spawn(nextInvocation.command, nextInvocation.args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    AUTH_URL: origin,
    NEXTAUTH_URL: origin,
    PORT: port
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
