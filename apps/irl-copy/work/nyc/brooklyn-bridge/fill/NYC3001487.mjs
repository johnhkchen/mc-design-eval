import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001487.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001487.nbt";

// 142 Columbia Heights, Brooklyn Heights: c.1840 Greek Revival / Italianate
// brownstone-faced multi-family walk-up. A single flat cornice line, storey
// string courses every 3 blocks, paired sash windows, a stone surround on the
// street door, a stone parapet and two brick chimneys.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 28, D = 6;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(x + "," + z, { gr: Math.round(gr), roof: Math.round(roof) });
const at = (x, z) => map.get(x + "," + z);

// Massing: the body of the building is one flat roof tier (modal lidar roof).
// Cells that lidar reads well above that tier are pulled down to it (noise,
// not real towers); genuinely lower wings keep their lower roof.
const counts = new Map();
for (const c of map.values()) counts.set(c.roof, (counts.get(c.roof) || 0) + 1);
let mode = 0, best = -1;
for (const [r, n] of counts) if (n > best) { best = n; mode = r; }
for (const c of map.values()) {
  if (c.roof > mode) c.roof = mode;
  else if (c.roof < mode - 2) c.roof = c.roof; // real lower wing, keep it
  else c.roof = mode;
}

const base = Math.min(...[...map.values()].map(c => c.gr));

function faces(x, z) {
  const f = [];
  if (!at(x, z - 1)) f.push("n");
  if (!at(x, z + 1)) f.push("s");
  if (!at(x - 1, z)) f.push("w");
  if (!at(x + 1, z)) f.push("e");
  return f;
}

// Street door on the north (z = 0) face, near the middle of the frontage.
let doorX = null;
for (const x of [7, 6, 8, 5, 9, 4, 10, 3, 11, 2, 12, 1, 13, 0]) {
  const c = at(x, 0);
  if (c && c.gr <= base + 1) { doorX = x; break; }
}

const CAP_TOP = H - 1;

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const T = Math.min(c.roof, CAP_TOP - 2);
  const fs = faces(x, z);
  const perim = fs.length > 0;
  const corner = fs.length >= 2;

  // Stone foundation from y 0 up to this cell's ground.
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls / interior core from ground up to just below the roof.
  for (let y = c.gr; y < T; y++) {
    const rel = y - base;
    if (!perim) { g.set(x, y, z, "bricks"); continue; }
    if (y >= T - 2) {
      g.set(x, y, z, y === T - 1 ? "smooth_stone" : "stone_bricks");
      continue;
    }
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (rel % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }

    // Window rows: sash openings on odd bays, brick wall elsewhere.
    const onNS = fs[0] === "n" || fs[0] === "s";
    const idx = onNS ? x : z;
    if (idx % 2 !== 1) { g.set(x, y, z, "bricks"); continue; }

    const storey = Math.floor(rel / 3);
    const lit = (idx + storey * 2) % 5 === 0;
    const pane = lit ? "orange_stained_glass_pane" : "glass_pane";
    const props = onNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, pane, props);
  }

  // Roof: solid stone parapet on the perimeter, stone slab over the interior.
  if (perim) {
    g.set(x, T, z, "stone_bricks");
  } else {
    g.set(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Street entrance: stone surround on the flanking bays, then the door itself.
if (doorX !== null) {
  const c = at(doorX, 0);
  const dy = Math.max(base + 1, c.gr);
  for (const sx of [doorX - 1, doorX + 1]) {
    if (!at(sx, 0)) continue;
    for (let y = dy; y <= dy + 2; y++) g.set(sx, y, 0, "stone_bricks");
  }
  g.set(doorX, dy + 2, 0, "smooth_stone");
  g.set(doorX, dy, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, dy + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Two brick chimneys rising from the roof on interior cells.
const chimneyCells = [[4, 2], [9, 3]];
for (const [x, z] of chimneyCells) {
  const c = at(x, z);
  if (!c) continue;
  const T = Math.min(c.roof, CAP_TOP - 2);
  for (let y = T + 1; y <= Math.min(T + 3, CAP_TOP); y++) g.set(x, y, z, "bricks");
  const top = Math.min(T + 4, CAP_TOP);
  g.set(x, top, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(OUT);
