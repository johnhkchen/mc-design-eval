// From the sidewalk in front of each lot to its house's front door, on the placed town: the accessible way in
// (half steps only, 3 then a landing, 2 wide) checked by the toolkit's approach report.
//   node walk-in.mjs <kit.nbt> [outDir]
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { approachReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/approach.mjs";
import { GRADE } from "./site.mjs";
import { existsSync, readFileSync } from "node:fs";
const here = (p) => new URL(p, import.meta.url).pathname;
const KIT = process.argv[2], OUT = process.argv[3] ?? here("../delivery");
const kit = load(KIT), town = load(`${OUT}/town.nbt`), L = JSON.parse(readFileSync(`${OUT}/build.json`, "utf8"));
const HOUSES = (process.env.HOUSES ?? "0,7,5,4,1,3,6,2,4,7,0,1,5,3,6").split(",").map(Number);
const ROW = KIT.endsWith("row.nbt") && existsSync(`${OUT}/row.json`) ? JSON.parse(readFileSync(`${OUT}/row.json`, "utf8")) : null;
const NAMES = ROW ? ROW.map((r) => r.house) : ["Magnolia", "Alhambra", "Vallonia", "Puritan", "Cornell", "Stanford", "Winona", "Craftsman"];
// each module's front door: the lower half of the door nearest the street (smallest z)
const door = []; for (const c of kit.cells.values()) { if (!/_door$/.test(c.block) || c.state?.half !== "lower") continue; const i = Math.floor(c.pos[0] / 16); if (c.pos[2] < 5) continue; if (!door[i] || c.pos[2] < door[i][2]) door[i] = c.pos; }
const Q = { north: 0, east: 1, south: 2, west: 3 }, OUTD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
let bad = 0;
for (const [n, p] of L.lots.entries()) {
  const i = HOUSES[n % HOUSES.length], q = Q[p.face], { x0, z0, x1, z1 } = p;
  const map = (lx, lz) => q === 0 ? [x0 + lx, z0 + lz] : q === 1 ? [x1 - lz, z0 + lx] : q === 2 ? [x1 - lx, z1 - lz] : [x0 + lz, z1 - lx];
  const [ox, oz] = OUTD[p.face], s = [p.gate[0], 0, p.gate[1]];
  for (let y = town.size[1] - 1; y >= 0; y--) { const b = town.blockAt(s[0], y, s[2]); if (!/air$/.test(b)) { s[1] = y + 1; break; } }
  const [dx, dy, dz] = door[i], [x, z] = map(dx - 16 * i, dz - 5), to = [x, p.pad + GRADE + dy, z];
  const r = approachReport(town, { from: s, to });
  if (!r.ok) bad++;
  console.log(`lot ${String(p.lot).padStart(2)} ${NAMES[i].padEnd(10)} ${p.street.padEnd(15)} ${r.ok ? `ok, ${r.length} cells, rise ${r.rise}` : r.faults.map((f) => `${f.kind} @${f.at}`).slice(0, 3).join("; ")}`);
}
console.log(`${L.lots.length - bad} of ${L.lots.length} ways in pass`);
