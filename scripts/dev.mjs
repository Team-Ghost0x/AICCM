import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BACKEND_DIR = resolve(ROOT, "backend");
const FRONTEND_DIR = resolve(ROOT, "frontend");

const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const magenta = (text) => `\x1b[35m${text}\x1b[0m`;
const gray = (text) => `\x1b[90m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;

console.log(green("=================================================="));
console.log(green(" 🚀 Starting Retake Platform (Backend & Frontend)"));
console.log(green("=================================================="));
console.log(`- Backend API:  ${cyan("http://localhost:3001")}`);
console.log(`- Frontend App: ${magenta("http://localhost:3002")}`);
console.log(gray("Press Ctrl+C at any time to stop both servers.\n"));

const children = [];

function startProcess(name, colorFn, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  children.push(child);

  const prefix = colorFn(`[${name}] `);

  child.stdout.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stdout.write(`${prefix}${line}\n`);
      }
    }
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stderr.write(`${prefix}${line}\n`);
      }
    }
  });

  child.on("close", (code) => {
    console.log(`${prefix}exited with code ${code}`);
  });

  return child;
}

startProcess("backend", cyan, "npm", ["run", "dev"], BACKEND_DIR);
startProcess("frontend", magenta, "npm", ["run", "dev"], FRONTEND_DIR);

function cleanup() {
  console.log("\nShutting down dev servers...");
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {}
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
