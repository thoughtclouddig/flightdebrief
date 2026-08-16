// Kills any process still listening on the dev port before `next dev` starts.
// Workflow restarts occasionally orphan an old dev server (e.g. when Next
// auto-restarts itself on a next.config change); without this the new run
// dies with EADDRINUSE. No lsof/fuser in this environment, so scan /proc.
import { readdirSync, readFileSync, readlinkSync } from "node:fs";

const port = Number(process.env.PORT || 3000);
const hexPort = port.toString(16).toUpperCase().padStart(4, "0");

// Collect socket inodes listening on the port (state 0A = LISTEN).
const inodes = new Set();
for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n").slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length > 9 && cols[1]?.endsWith(`:${hexPort}`) && cols[3] === "0A") {
        inodes.add(cols[9]);
      }
    }
  } catch { /* file may not exist */ }
}
if (inodes.size === 0) process.exit(0);

// Find owning PIDs via their fd symlinks, skipping our own process tree.
const self = new Set([String(process.pid), String(process.ppid)]);
for (const pid of readdirSync("/proc").filter((d) => /^\d+$/.test(d))) {
  if (self.has(pid)) continue;
  let fds = [];
  try { fds = readdirSync(`/proc/${pid}/fd`); } catch { continue; }
  for (const fd of fds) {
    try {
      const target = readlinkSync(`/proc/${pid}/fd/${fd}`);
      const m = target.match(/^socket:\[(\d+)\]$/);
      if (m && inodes.has(m[1])) {
        console.log(`[free-port] killing stale pid ${pid} holding port ${port}`);
        process.kill(Number(pid), "SIGKILL");
        break;
      }
    } catch { /* fd raced away */ }
  }
}
// Give the kernel a moment to release the socket.
await new Promise((r) => setTimeout(r, 500));
