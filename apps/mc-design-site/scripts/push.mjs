// Pushes data/board.json to the cloud board: rows into D1 (plans own `data`; a task's status and cannon on the board
// are kept), and every cannon job's .nbt into R2 under <project>/<file>. Run: node scripts/push.mjs [--no-files]
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const HERE = resolve(import.meta.dirname, ".."), REPO = resolve(HERE, "../..");
const board = JSON.parse(readFileSync(resolve(HERE, "data/board.json"), "utf8"));
const q = (v) => v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const wrangler = (...a) => execFileSync("npx", ["wrangler", ...a], { cwd: HERE, stdio: ["ignore", "pipe", "inherit"] }).toString();

const assetKey = (t) => `${t.project}/${t.file}`;
const sql = [];
for (const [id, t] of Object.entries(board.towns)) sql.push(`INSERT INTO towns (id, data) VALUES (${q(id)}, ${q(JSON.stringify(t))}) ON CONFLICT (id) DO UPDATE SET data = excluded.data;`);
for (const [id, p] of Object.entries(board.projects)) sql.push(`INSERT INTO projects (id, data) VALUES (${q(id)}, ${q(JSON.stringify(p))}) ON CONFLICT (id) DO UPDATE SET data = excluded.data;`);
for (const [id, t] of Object.entries(board.tasks)) {
  const { status, cannon, updatedAt, ...data } = t;
  if (t.kind === "cannon" && t.nbt) data.asset = assetKey(t);
  sql.push(`INSERT INTO tasks (id, project, status, cannon, updated_at, data) VALUES (${q(id)}, ${q(t.project)}, ${q(status || "queued")}, ${Number.isInteger(cannon) ? cannon : "NULL"}, ${q(updatedAt)}, ${q(JSON.stringify(data))}) ON CONFLICT (id) DO UPDATE SET project = excluded.project, data = excluded.data;`);
}
sql.push(`INSERT INTO pool (id, data) VALUES (1, ${q(JSON.stringify(board.pool))}) ON CONFLICT (id) DO NOTHING;`);
const file = resolve(HERE, ".push.sql");
writeFileSync(file, sql.join("\n") + "\n");
wrangler("d1", "execute", "dragonholde-board", "--remote", "--file", file, "--yes");
console.log(`D1: ${sql.length} rows upserted`);

if (!process.argv.includes("--no-files")) {
  for (const t of Object.values(board.tasks).filter((t) => t.kind === "cannon" && t.nbt)) {
    wrangler("r2", "object", "put", `dragonholde-assets/${assetKey(t)}`, "--file", resolve(REPO, t.nbt), "--content-type", "application/octet-stream", "--remote");
    console.log(`R2: ${assetKey(t)}`);
  }
}
