// Dev-server half of the board API (the Worker in worker/index.js is the cloud half). The board's data lives in data/board.json, not in the browser: the dev server reads and writes it, and tells open
// pages to reload it whenever it changes on disk (a status tapped on a phone, or a plan script adding jobs).
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { handleFixes } from "./fixes.js";
import { fileStore } from "./fixes-file-store.js";

const FIXES = fileStore(resolve(import.meta.dirname, "../../data/fixes.json"));

const DATA = resolve(import.meta.dirname, "../../data/board.json");
const REPO = resolve(import.meta.dirname, "../../../..");
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

export function boardApi() {
  return {
    name: "board-api",
    configureServer(server) {
      server.watcher.add(DATA);
      server.watcher.on("change", (f) => { if (f === DATA) server.ws.send({ type: "custom", event: "board:changed" }); });
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://x");
        try {
          if (url.pathname === "/api/board" && req.method === "GET") {
            const b = JSON.parse(await readFile(DATA, "utf8"));
            for (const t of Object.values(b.tasks)) if (t.kind === "cannon" && t.nbt) t.asset = `${t.project}/${t.file}`;
            return send(res, 200, b);
          }
          if (url.pathname === "/api/session") return send(res, 200, { canWrite: true });
          if (url.pathname.startsWith("/api/issues") || url.pathname.startsWith("/api/fix-jobs")) {
            const r = await handleFixes({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: req.method === "GET" ? null : await body(req), canWrite: true }, FIXES);
            if (r) return send(res, r.status, r.json);
          }
          if (url.pathname.startsWith("/api/candidates/") && req.method === "GET") {
            // a fix job's candidate renders and files, made by scripts/fixer.mjs into .cache/candidates
            const f = resolve(import.meta.dirname, "../../.cache/candidates", decodeURIComponent(url.pathname.slice("/api/candidates/".length)).replace(/\.\./g, ""));
            res.setHeader("content-type", f.endsWith(".jpg") ? "image/jpeg" : "application/octet-stream"); return res.end(await readFile(f));
          }
          if (url.pathname.startsWith("/api/assets/") && req.method === "GET") {
            // Same keys as the cloud's R2 (<project>/<file>), read from the repo path the job records.
            const key = decodeURIComponent(url.pathname.slice("/api/assets/".length));
            const t = Object.values(JSON.parse(await readFile(DATA, "utf8")).tasks).find((t) => t.nbt && `${t.project}/${t.file}` === key);
            if (!t) return send(res, 404, { error: "no such asset" });
            res.setHeader("content-type", "application/octet-stream"); return res.end(await readFile(resolve(REPO, t.nbt)));
          }
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
        } catch (e) { return send(res, 500, { error: String(e.message || e) }); }
        next();
      });
    },
  };
}
