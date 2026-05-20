import { spawn } from "node:child_process";

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
const nextCommand = process.platform === "win32" ? "next.cmd" : "next";

const child = spawn(nextCommand, ["dev", ...args], {
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
