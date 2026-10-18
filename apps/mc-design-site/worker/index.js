// The site's API on Cloudflare: the same contract as the dev server (src/lib/board-api.js), backed by D1 and R2: the
// construction board, and the fix system (src/lib/fixes.js: issues by kind, batched fix jobs).
import { handleFixes } from "../src/lib/fixes.js";
import { d1Store } from "./fixes-d1.js";
const STATUSES = ["queued", "loaded", "running", "done", "dropped"];
const POOL_FIELDS = ["cannons", "secPerBlock", "setupMin"];

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
const canWrite = (req, env) => !!env.ADMIN_TOKEN && req.headers.get("authorization") === `Bearer ${env.ADMIN_TOKEN}`;

async function board(env) {
  const [towns, projects, tasks, pool] = await env.DB.batch([
    env.DB.prepare("SELECT id, data FROM towns"), env.DB.prepare("SELECT id, data FROM projects"),
    env.DB.prepare("SELECT id, status, cannon, updated_at, data FROM tasks"), env.DB.prepare("SELECT data FROM pool WHERE id = 1"),
  ]);
  const byId = (rows, f = (r) => JSON.parse(r.data)) => Object.fromEntries(rows.results.map((r) => [r.id, f(r)]));
  return {
    towns: byId(towns), projects: byId(projects),
    tasks: byId(tasks, (r) => ({ ...JSON.parse(r.data), status: r.status, cannon: r.cannon, updatedAt: r.updated_at })),
    pool: pool.results[0] ? JSON.parse(pool.results[0].data) : {},
  };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/api/board" && req.method === "GET") return json(await board(env));
    if (p === "/api/session" && req.method === "GET") return json({ canWrite: canWrite(req, env), signIn: "admin token (Discord login coming)" });
    if (p.startsWith("/api/assets/") && req.method === "GET") {
      const obj = await env.FILES.get(decodeURIComponent(p.slice("/api/assets/".length)));
      if (!obj) return json({ error: "no such asset" }, 404);
      return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType || "application/octet-stream", etag: obj.httpEtag, "cache-control": "public, max-age=300" } });
    }
    if (p.startsWith("/api/issues") || p.startsWith("/api/fix-jobs")) {
      const body = req.method === "GET" ? null : await req.json().catch(() => ({}));
      const r = await handleFixes({ method: req.method, path: p, query: Object.fromEntries(url.searchParams), body, canWrite: canWrite(req, env) }, d1Store(env.DB));
      if (r) return json(r.json, r.status);
    }
    const m = p.match(/^\/api\/tasks\/([\w.-]+)$/);
    if ((m || p === "/api/pool") && req.method === "PATCH") {
      if (!canWrite(req, env)) return json({ error: "Viewing is public; changing the board needs a sign-in." }, 401);
      const patch = await req.json().catch(() => ({}));
      if (m) {
        if (patch.status !== undefined && !STATUSES.includes(patch.status)) return json({ error: `status must be one of ${STATUSES.join(", ")}` }, 400);
        const sets = [], args = [];
        if ("status" in patch) { sets.push("status = ?"); args.push(patch.status); }
        if ("cannon" in patch) { sets.push("cannon = ?"); args.push(Number.isInteger(patch.cannon) ? patch.cannon : null); }
        sets.push("updated_at = ?"); args.push(new Date().toISOString());
        const r = await env.DB.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).bind(...args, m[1]).run();
        return r.meta.changes ? json({ ok: true }) : json({ error: `no task ${m[1]}` }, 404);
      }
      const row = await env.DB.prepare("SELECT data FROM pool WHERE id = 1").first();
      const pool = row ? JSON.parse(row.data) : {};
      for (const k of POOL_FIELDS) if (typeof patch[k] === "number" && patch[k] >= 0) pool[k] = patch[k];
      await env.DB.prepare("INSERT INTO pool (id, data) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data").bind(JSON.stringify(pool)).run();
      return json(pool);
    }
    return json({ error: "not found" }, 404);
  },
};
