import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 1095572133: a two-storey brick shop-top block on the Mt Eden / Eden Terrace street grain (1920s brick and
// plaster commercial), with a single-storey wing on the lower cells. Lidar roofs are snapped to two clean tiers:
// main (roof >= 8) to y 9, wing (roof <= 7) to y 7. Everything stands on the footprint; each storey has a floor
// slab (y 4) and the main roof is a deck (y 8), so no tier hangs over air. Glass sits in a one-cell recess with
// air behind it (some lit with glowstone), so the windows read as openings, not painted walls.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_1095572133.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

const DIRS = [
  { name: "north", dx: 0, dz: -1, along: (x) => x, opp: "south" },
  { name: "south", dx: 0, dz: 1, along: (x) => x, opp: "north" },
  { name: "west", dx: -1, dz: 0, along: (x, z) => z, opp: "east" },
  { name: "east", dx: 1, dz: 0, along: (x, z) => z, opp: "west" },
];

const tier = (x, z) => (foot.get(`${x},${z}`).roof >= 8 ? 9 : 7);
const edge = (x, z) => DIRS.some((d) => !inFoot(x + d.dx, z + d.dz));

// solid: main mass fills y 0..8; wing fills y 0..4 (deck) plus a parapet on its perimeter at y 5..6
function solid(x, z, y) {
  if (!inFoot(x, z)) return false;
  const { ground } = foot.get(`${x},${z}`);
  if (y < ground) return true;
  const t = tier(x, z);
  if (y >= t) return false;
  if (t === 9) return true;
  if (y <= 4) return true;
  return edge(x, z);
}
const exposed = (x, z, y, d) => !solid(x + d.dx, z + d.dz, y);
const isCore = (x, z, y) => solid(x, z, y) && DIRS.every((d) => solid(x + d.dx, z + d.dz, y));

// the street front: the face with the most exposed storey-one wall
const front = DIRS.map((d) => ({ d, n: cells.filter(([x, z]) => solid(x, z, 2) && exposed(x, z, 2, d)).length }))
  .sort((a, b) => b.n - a.n)[0].d;
const frontRun = cells
  .filter(([x, z]) => solid(x, z, 2) && exposed(x, z, 2, front))
  .map(([x, z]) => front.along(x, z))
  .sort((a, b) => a - b);
const p0 = frontRun[Math.floor(frontRun.length / 2)];   // the door sits mid-run

const plan = new Map();   // key -> { x, y, z, b, s }
const pocket = new Map(); // key -> block for the air cell behind a pane (null = air)
const put = (x, y, z, b, s = null) => plan.set(key(x, y, z), { x, y, z, b, s });
const pane = (x, y, z, d) => {
  const ix = x - d.dx, iz = z - d.dz;
  if (isCore(ix, iz, y)) pocket.set(key(ix, y, iz), (x * 7 + z * 13 + y * 5) % 4 === 0 ? "glowstone" : null);
  return "glass_pane";
};

for (const [x, z] of cells) {
  const t = tier(x, z), { ground } = foot.get(`${x},${z}`);
  for (let y = 0; y < t; y++) {
    if (!solid(x, z, y)) continue;
    const ex = DIRS.filter((d) => exposed(x, z, y, d));
    if (y < ground || y === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (y === t - 1 || (y === 4 && t === 9)) { put(x, y, z, ex.length ? "smooth_quartz" : "bricks"); continue; }   // cornice, and the main's floor line
    if (!ex.length || t === 7) { put(x, y, z, "bricks"); continue; }   // core, or a wing parapet (no windows)

    const d = ex.includes(front) ? front : ex[0];
    const p = d.along(x, z), pier = p % 3 === 0;
    if (y <= 3 && d === front) {          // shopfront: timber bulkhead, glass, a door and a lintel canopy
      if (y <= 2 && p === p0) put(x, y, z, "dark_oak_door", { facing: d.opp, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3 && Math.abs(p - p0) <= 1) put(x, y, z, "dark_oak_slab", { type: "top" });
      else if (y === 1 || pier) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, pane(x, y, z, d));
      continue;
    }
    const base = y <= 3 ? 1 : 5;          // storey sill, then panes, or a pier of brick
    if (pier) put(x, y, z, "bricks");
    else if (y === base) put(x, y, z, "smooth_quartz");
    else put(x, y, z, pane(x, y, z, d));
  }
}

// a small roof plant on the main deck, two cells in from the parapet
const deck = cells.filter(([x, z]) => tier(x, z) === 9 && isCore(x, z, 8)).map(([x, z]) => [x, z]);
if (deck.length) {
  const [px, pz] = deck[0];
  for (const [x, z] of [[px, pz], deck.find(([a, b]) => a === px + 1 && b === pz) ?? [px, pz]]) {
    put(x, 9, z, "light_gray_concrete");
  }
}

const g = new Voxels([12, 22, 10]);
for (const { x, y, z, b, s } of plan.values()) {
  const k = key(x, y, z);
  if (pocket.has(k)) { const lit = pocket.get(k); if (lit) g.set(x, y, z, lit); continue; }
  g.set(x, y, z, b, s);
}
const out = g.save(DIR + "way_1095572133.nbt");
console.log(`way_1095572133: front ${front.name}, door at p=${p0}, ${out.blocks} blocks, ${out.palette} palette`);
