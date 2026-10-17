// The board's data lives in data/board.json, not in the browser: the dev server reads and writes it, and tells open
// pages to reload it whenever it changes on disk (a status tapped on a phone, or a plan script adding jobs).
import { defineConfig } from "vite";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const DATA = resolve(import.meta.dirname, "data/board.json");
const REPO = resolve(import.meta.dirname, "../..");
const TASK_FIELDS = ["status", "cannon"];
const POOL_FIELDS = ["cannons", "secPerBlock", "setupMin"];
const STATUSES = ["queued", "loaded", "running", "done", "dropped"];

let queue = Promise.resolve();
const edit = (fn) => (queue = queue.then(async () => {
  const board = JSON.parse(await readFile(DATA, "utf8"));
  const out = fn(board);
  await writeFile(DATA + ".tmp", JSON.stringify(board, null, 2) + "\n");
  await rename(DATA + ".tmp", DATA);
  return out;
}));

const body = (req) => new Promise((ok, fail) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch (e) { fail(e); } }); });
const send = (res, code, obj) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };

function boardApi() {
  return {
    name: "board-api",
    configureServer(server) {
      server.watcher.add(DATA);
      server.watcher.on("change", (f) => { if (f === DATA) server.ws.send({ type: "custom", event: "board:changed" }); });
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://x");
        try {
          if (url.pathname === "/api/board" && req.method === "GET") return send(res, 200, JSON.parse(await readFile(DATA, "utf8")));
          const m = url.pathname.match(/^\/api\/tasks\/([\w.-]+)$/);
          if (m && req.method === "PATCH") {
            const patch = await body(req);
            if (patch.status !== undefined && !STATUSES.includes(patch.status)) return send(res, 400, { error: `status must be one of ${STATUSES.join(", ")}` });
            const t = await edit((b) => { const t = b.tasks[m[1]]; if (!t) return null;
              for (const k of TASK_FIELDS) if (k in patch) t[k] = patch[k]; t.updatedAt = new Date().toISOString(); return t; });
            return t ? send(res, 200, t) : send(res, 404, { error: `no task ${m[1]}` });
          }
          if (url.pathname === "/api/pool" && req.method === "PATCH") {
            const patch = await body(req);
            return send(res, 200, await edit((b) => { for (const k of POOL_FIELDS) if (typeof patch[k] === "number" && patch[k] >= 0) b.pool[k] = patch[k]; return b.pool; }));
          }
          if (url.pathname === "/api/nbt" && req.method === "GET") {
            // A job's .nbt, for a structure preview: only files inside the repo's benchmarks/ tree.
            const f = resolve(REPO, url.searchParams.get("file") || "");
            if (!relative(REPO, f).startsWith("benchmarks" + sep) || !f.endsWith(".nbt")) return send(res, 400, { error: "file must be a .nbt under benchmarks/" });
            res.setHeader("content-type", "application/octet-stream"); return res.end(await readFile(f));
          }
        } catch (e) { return send(res, 500, { error: String(e.message || e) }); }
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [boardApi()], server: { port: 5178, strictPort: true, allowedHosts: [".ts.net"] } });
