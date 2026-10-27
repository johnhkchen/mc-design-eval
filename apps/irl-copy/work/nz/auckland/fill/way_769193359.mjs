// Way 769193359: an interwar brick-and-plaster commercial block (1920s-30s, the isthmus's Edwardian-to-Deco shopfront
// type) on a 23 x 19 footprint whose ground falls about 3 blocks to the east and south. Decided from the record: lidar
// roofs run 7-11 blocks above y 0, so three storeys at about 4 blocks, the core at 11 with a middle tier at 8 and a
// low wing at 5. Materials: a basalt plinth (stone bricks, the isthmus's volcanic stone), red brick walls and piers,
// a cream plaster string course and fascia (smooth quartz), a glass shopfront on the ground storey with dark oak posts,
// paired window bays under brick headers, glowstone behind some panes, a dark oak door on the lowest street front,
// parapets with stone brick coping, and iron AC plant on the roof. Tiers are smoothed by a median over 5x5 cells, so
// each storey stands on the one below and the setbacks read as flat steps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193359.cells.json", "utf8"));
const g = new Voxels([23, 23, 19]);

// footprint: "x,z" -> { ground, roof (lidar), tier (smoothed, quantized), n (storeys), walls (exposed faces) }
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, ground, roof, tier: 0, n: 1, walls: [] });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

for (const c of cell.values()) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.roof); }
  v.sort((a, b) => a - b);
  const m = v[v.length >> 1];
  c.tier = Math.max(c.ground + 1, m >= 10 ? 11 : m >= 7 ? 8 : 5);
}
// a second pass: a cell whose tier is held by fewer than three of its 3 x 3 neighbours takes the majority tier, so a
// single cell of lidar noise does not stand up as a pillar above its neighbours
for (const c of cell.values()) {
  const count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) count.set(n.tier, (count.get(n.tier) || 0) + 1); }
  let best = c.tier, most = 0;
  for (const [t, k] of count) if (k > most) { best = t; most = k; }
  if (most >= 5 && count.get(c.tier) < 3) c.tier = best;
  c.tier = Math.max(c.tier, c.ground + 1);
}
for (const c of cell.values()) c.n = Math.max(1, Math.round((c.tier - c.ground) / 4));

// a wall face is where the neighbour is outside the footprint or sits on a lower tier
for (const c of cell.values()) c.walls = DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier; });

// the entrance: an outward wall on the lowest ground (the street side), first in scan order
let door = null;
for (const c of cell.values()) for (const d of c.walls) {
  if (at(c.x + d[0], c.z + d[1]) || c.tier < c.ground + 4) continue;
  if (!door || c.ground < door.c.ground) door = { c, d };
}

const FOUND = "stone", PLINTH = "stone_bricks", BRICK = "bricks", BAND = "smooth_quartz", GLASS = "glass";
const PIER_SHOP = "dark_oak_planks", FASCIA = "smooth_quartz", FLOOR = "smooth_stone", COPING = "stone_brick_slab";
const LAMP = "glowstone", AC = "iron_block";

for (const c of cell.values()) {
  const { x, z, ground: G, tier: T, n, walls } = c;
  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < G; y++) g.set(x, y, z, walls.length ? PLINTH : FOUND);

  for (let y = G; y < T; y++) {
    const k = Math.min(n - 1, Math.floor((y - G) / 4)), r = y - G - 4 * k;   // storey k, row r within it
    if (!walls.length) {                                                       // interior: floor slab per storey, air gap, roof deck
      if (r === 0 || y === T - 1) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, BRICK); continue; }                        // parapet course
    if (k === 0 && r === 0) { g.set(x, y, z, PLINTH); continue; }                // basalt plinth
    if (r === 0) { g.set(x, y, z, BAND); continue; }                             // plaster string course on each floor line
    if (r === 3) { g.set(x, y, z, k === 0 ? FASCIA : BRICK); continue; }        // header / shopfront fascia
    if (door && door.c === c && k === 0) {                                        // entrance door, two tall
      g.set(x, y, z, "dark_oak_door", { facing: door.d[2], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = (walls[0][0] !== 0 ? z : x) % 3 === 0;                          // every third bay; the stepped edge keeps its glass
    if (pier) { g.set(x, y, z, k === 0 ? PIER_SHOP : BRICK); continue; }
    g.set(x, y, z, GLASS);
    // a warm light behind some panes, in the room's first cell inside
    const d = walls[0], inner = at(x - d[0], z - d[1]);
    if ((x * 5 + z * 3 + y) % 6 === 0 && inner && !inner.walls.length && y >= inner.ground && y < inner.tier - 1) {
      g.set(inner.x, y, inner.z, LAMP);
    }
  }
  // coping slab on every wall top
  if (walls.length) g.set(x, T, z, COPING, { type: "bottom", waterlogged: "false" });
  // roof plant on the core: AC units on a loose grid
  if (!walls.length && T === 11 && (x + 2 * z) % 7 === 0) g.set(x, T, z, AC);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193359.nbt");
console.log("blocks", info.blocks, "palette", info.palette, "door", door ? [door.c.x, door.c.z, door.d[2]] : null);
