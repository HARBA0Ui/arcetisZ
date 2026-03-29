const { spawnSync, spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "apps", "frontend");
const lockPath = path.join(frontendDir, ".next", "dev", "lock");
const rootEnvPath = path.join(rootDir, ".env");

function loadRootEnv() {
  if (!fs.existsSync(rootEnvPath) || typeof process.loadEnvFile !== "function") {
    return;
  }

  try {
    process.loadEnvFile(rootEnvPath);
  } catch (error) {
    safeWrite(process.stderr, `Failed to load ${rootEnvPath}: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    ...options
  });
}

function getWindowsNodeProcesses() {
  const script = [
    "$ErrorActionPreference='Stop'",
    "$items = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine } | Select-Object ProcessId,ParentProcessId,CommandLine",
    "$items | ConvertTo-Json -Compress"
  ].join("; ");

  const result = run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
  if (result.status !== 0 || !result.stdout.trim()) {
    return [];
  }

  const parsed = JSON.parse(result.stdout.trim());
  return Array.isArray(parsed) ? parsed : [parsed];
}

function stopExistingDevProcesses() {
  if (process.platform !== "win32") {
    return;
  }

  const normalizedFrontendDir = frontendDir.toLowerCase();
  const candidates = getWindowsNodeProcesses().filter((proc) => {
    const commandLine = String(proc.CommandLine || "").toLowerCase();
    return (
      (commandLine.includes(normalizedFrontendDir) &&
        (commandLine.includes("next\\dist\\bin\\next") || commandLine.includes("start-server.js"))) ||
      commandLine.includes("run dev --workspace=frontend")
    );
  });

  const seen = new Set();
  for (const proc of candidates) {
    const pid = Number(proc.ProcessId);
    if (!pid || seen.has(pid)) {
      continue;
    }

    seen.add(pid);
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
  }
}

function clearStaleLock() {
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath, { force: true });
  }
}

let didWarmRoutes = false;

function safeWrite(stream, text) {
  if (!stream || stream.destroyed || !stream.writable) {
    return;
  }

  try {
    stream.write(text);
  } catch {
    // Ignore broken pipe errors when the parent process is interrupted.
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestUrl(url) {
  return new Promise((resolve) => {
    const request = http.get(
      url,
      {
        headers: {
          "user-agent": "arcetis-dev-warmup"
        }
      },
      (response) => {
        response.resume();
        response.on("end", resolve);
      }
    );

    request.on("error", resolve);
    request.setTimeout(3000, () => {
      request.destroy();
      resolve();
    });
  });
}

async function warmDevRoutes(baseUrl) {
  if (didWarmRoutes) {
    return;
  }

  didWarmRoutes = true;
  const routes = ["/", "/login", "/register", "/tasks", "/rewards", "/spin"];
  safeWrite(process.stdout, "\nPrewarming core routes for faster first loads...\n");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await requestUrl(`${baseUrl}/`);
      break;
    } catch {
      await wait(500);
    }
  }

  for (const route of routes) {
    await requestUrl(`${baseUrl}${route}`);
  }

  safeWrite(process.stdout, "Core routes prewarmed.\n\n");
}

function startDevServer() {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev:workspace"], {
          cwd: rootDir,
          stdio: ["ignore", "pipe", "pipe"],
          env: process.env
        })
      : spawn("npm", ["run", "dev:workspace"], {
          cwd: rootDir,
          stdio: ["ignore", "pipe", "pipe"],
          env: process.env
        });

  const handleChunk = (chunk, stream) => {
    const text = chunk.toString();
    safeWrite(stream, text);

    if (!didWarmRoutes && text.includes("Ready in")) {
      void warmDevRoutes("http://127.0.0.1:3000");
    }
  };

  child.stdout.on("data", (chunk) => handleChunk(chunk, process.stdout));
  child.stderr.on("data", (chunk) => handleChunk(chunk, process.stderr));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

stopExistingDevProcesses();
clearStaleLock();
loadRootEnv();
startDevServer();
