// The error detection half of the fix system: every catalog building through the toolkit's deterministic checks,
// so the site can group buildings by what's wrong and a fix can be scheduled for a whole group at once.
//   fit       how things sit: bottom slabs, floating decor, half beds, short flights, shut hearths, shutters...
//   walk      every room reachable from the door
//   light     dark floor cells (mobs spawn) in any room
//   way in    from the street edge (z 0) to the front door: half steps, a landing at the door, 2 wide
// Rooms come from the kit run's rooms.json, moved into the module's own frame (plot i of the sample row).
// Writes data/issues.json and syncs it to the site's issues (the dev server by default; the cloud with
// --to https://mc-design.b28.dev and MCD_ADMIN_TOKEN in the environment).
//   node scripts/check.mjs [--only <id>] [--to <site url>] [--no-sync]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { checkBuilding, roomsFor, tally } from "../src/lib/checks.js";

const HERE = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(HERE, "src/data/catalog.json"), "utf8"));
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const OUT = resolve(HERE, "data/issues.json");
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { buildings: {} };

const out = { checkedAt: new Date().toISOString(), buildings: { ...prev.buildings } };
for (const e of catalog) {
  if (only && e.id !== only) continue;
  const file = resolve(HERE, "public" + e.nbt), buf = readFileSync(file);
  const g = load(file), base = e.variantOf ? catalog.find((b) => b.id === e.variantOf) : e;
  const issues = checkBuilding(g, roomsFor(base));
  out.buildings[e.id] = { version: createHash("sha256").update(buf).digest("hex").slice(0, 12), issues };
  console.log(`${e.id.padEnd(30)} ${issues.length ? Object.entries(tally(issues)).map(([k, n]) => `${n} ${k}`).join(", ") : "ok"}`);
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
if (!process.argv.includes("--no-sync")) {
  const to = process.argv.includes("--to") ? process.argv[process.argv.indexOf("--to") + 1] : "http://127.0.0.1:5178";
  const buildings = only ? { [only]: out.buildings[only] } : out.buildings;
  const r = await fetch(`${to}/api/issues/sync`, { method: "POST", headers: { "content-type": "application/json", ...(process.env.MCD_ADMIN_TOKEN ? { authorization: `Bearer ${process.env.MCD_ADMIN_TOKEN}` } : {}) }, body: JSON.stringify({ buildings }) }).catch((e) => ({ ok: false, statusText: e.message }));
  console.log(r.ok ? `synced to ${to}: ${JSON.stringify(await r.json())}` : `not synced to ${to} (${r.status ?? ""} ${r.statusText})`);
}
