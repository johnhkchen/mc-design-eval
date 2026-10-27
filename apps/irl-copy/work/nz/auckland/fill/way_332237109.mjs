// Way 332237109: a four-storey interwar commercial block (brick and cream plaster, a shopfront at street level,
// a stair overrun on the roof) on the 16 x 21 footprint. Lidar roof heights are smoothed into three tiers: 16 blocks
// (four storeys) for the main body, 12 (three storeys) for the wing, and 4 for the single-storey lean-to at x0 z15.
// Walls are solid massing, with an air gap one cell deep behind each window so the glass reads as glazing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237109.cells.json", "utf8"));
const [W, H, D] = [16, 30, 21];
const key = (x, y, z) => `${x},${y},${z}`;
const cellOf = new Map(cells.map(([x, z, g, rv]) => [`${x},${z}`, { x, z, g, rv }]));
const has = (x, z) => cellOf.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                       // N, S, W, E (z grows south)
const outside = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz)) ?? null;   // outward face, if any
const perimeter = (x, z) => outside(x, z) !== null;

// Lidar roof height -> tier: smooth the noise (14..17 is the main roof; 17 gets a stair overrun), 12..13 the wing, else the lean-to.
const tier = (rv) => (rv >= 14 ? 16 : rv >= 12 ? 12 : 4);

// Storey rows: 4 blocks each (y 4k..4k+3). Row 4k is the string course, 4k+1..4k+2 the windows, 4k+3 the lintel.
// Windows sit on bay p = (x+z) mod 4: 0 pier, 1-2 glass, 3 jamb.
const bay = (x, z) => ((x + z) % 4 + 4) % 4;
const isGlass = (x, y, z, g) => {
  const p = bay(x, z), k = Math.floor(y / 4), o = y % 4;
  if (p !== 1 && p !== 2) return false;
  if (k === 0) return y > g && y <= 2;                                 // shopfront glass under the plinth
  return o === 1 || o === 2;
};

const ENTRANCE = { x: 10, z: 0 };                                       // the north face's single entry

// Pass 1: the cavity cells behind each window (the air gap), interior only
const cavity = new Set();
for (const c of cellOf.values()) {
  const { x, z, g, rv } = c, R = tier(rv);
  if (!perimeter(x, z)) continue;
  const out = outside(x, z);
  const [ix, iz] = [x - out[0], z - out[1]];
  if (!has(ix, iz) || perimeter(ix, iz)) continue;
  for (let y = g + 1; y <= R; y++) {
    if (isGlass(x, y, z, g) && !(x === ENTRANCE.x && z === ENTRANCE.z)) cavity.add(key(ix, y, iz));
  }
}

// Pass 2: the plan, every block by position
const plan = new Map();
const put = (x, y, z, name, state) => plan.set(key(x, y, z), { name, state });

for (const c of cellOf.values()) {
  const { x, z, g, rv } = c, R = tier(rv), per = perimeter(x, z);
  for (let y = 0; y <= R; y++) {
    if (cavity.has(key(x, y, z))) continue;
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                // foundation under the lower ground
    if (!per) {                                                             // interior massing, roof surface on top
      put(x, y, z, y === R ? "stone" : "bricks");
      continue;
    }
    if (y === g) { put(x, y, z, "polished_andesite"); continue; }           // base course
    if (y === R) { put(x, y, z, "smooth_quartz"); continue; }               // cornice
    const k = Math.floor(y / 4), o = y % 4, p = bay(x, z);
    if (o === 0) { put(x, y, z, "smooth_quartz"); continue; }              // string course
    if (o === 3) { put(x, y, z, k === 0 ? "dark_oak_planks" : "bricks"); continue; }   // fascia / lintel
    if (isGlass(x, y, z, g)) { put(x, y, z, "glass_pane"); continue; }
    if (k === 0) { put(x, y, z, "stone_bricks"); continue; }               // shopfront piers
    put(x, y, z, p === 3 ? "smooth_quartz" : "bricks");                    // jamb or pier
  }
  if (rv >= 17) put(x, 17, z, "stone_bricks");                             // stair overrun
  else if (per) put(x, R + 1, z, "bricks");                                // parapet on the perimeter
}

// Entrance: a two-high oak door on the north face, a dark canopy above it
{
  const { x, z } = ENTRANCE, g = cellOf.get(`${x},${z}`).g;
  const door = (y, half) => put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  door(g + 1, "lower"); door(g + 2, "upper");
  put(x, g + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant: a few air-handling units on the flat interior roof, and lanterns behind some upper windows
for (const c of cellOf.values()) {
  const { x, z, g, rv } = c;
  if (perimeter(x, z) || rv >= 17 || tier(rv) !== 16) continue;
  if ((x * 7 + z * 3) % 23 === 0) put(x, 17, z, "iron_block");
}
for (const c of cellOf.values()) {
  const { x, z, g, rv } = c, R = tier(rv);
  for (let k = 1; 4 * k < R; k++) {
    const y = 4 * k + 1;
    if (cavity.has(key(x, y, z)) && (x * 5 + z * 7 + k) % 4 === 0) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Glass panes connect to their neighbours, so the strips read as continuous glazing and not lone posts
const solidAt = (x, y, z) => plan.has(key(x, y, z));
for (const [k, b] of plan) {
  if (b.name !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const connect = (dx, dz) => (solidAt(x + dx, y, z + dz) ? "true" : "false");
  b.state = { north: connect(0, -1), south: connect(0, 1), west: connect(-1, 0), east: connect(1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, b] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.name, b.state);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237109.nbt");
console.log("way_332237109:", stats);
