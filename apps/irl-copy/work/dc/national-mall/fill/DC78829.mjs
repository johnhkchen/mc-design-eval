// 111 G St NW (Educational, DC 20001): a stepped Beaux-Arts-era school block at 0.42 blocks/m.
// Massing from the lidar roof per cell (3x3 mode, so the noise becomes flat tiers): 8 for the body, 10 for the
// core, 3-6 for the south wings. Shell only: a solid plinth and a floor slab every other row, glazed bays between
// stone piers on every exposed face, a parapet course on each roof, and no interior beyond an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC78829.cells.json`, "utf8"));  // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), { x, z, r }]));

// Lidar noise into flat tiers: each cell takes the most common roof in its 3x3 footprint block (ties go up).
const R = new Map();
for (const c of raw.values()) {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = raw.get(key(c.x + dx, c.z + dz)); if (o) n.set(o.r, (n.get(o.r) || 0) + 1);
  }
  let best = c.r, bc = -1;
  for (const [r, k] of n) if (k > bc || (k === bc && r > best)) { best = r; bc = k; }
  R.set(key(c.x, c.z), best);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Directions in which the cell at this height has no neighbour block: outside the footprint, or the neighbour's roof is lower.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const r = R.get(key(x + dx, z + dz)); return r === undefined || r <= y; });

const H = 22;
const g = new Voxels([33, H, 22]);
const panes = new Map();   // "x,y,z" -> { along, inward }
const entrance = new Set(["0,2,5", "0,3,5"]);

for (const [k, r] of R) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    const ex = exposed(x, z, y);
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }                 // plinth / foundation
    if (y === r - 1) { g.set(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }  // parapet / roof
    if (y % 2 === 1) { g.set(x, y, z, "smooth_stone"); continue; }                  // floor slab = storey line
    if (!ex.length) continue;                                                       // interior: air gap
    const onX = ex.some(([dx]) => dx !== 0), onZ = ex.some(([, dz]) => dz !== 0);
    const i = onX && !onZ ? z : onZ && !onX ? x : x + z;
    if ((onX && onZ) || i % 3 === 0) {                                              // stone pier (corners too)
      g.set(x, y, z, y === 2 ? "polished_andesite" : "calcite");
    } else {
      const along = onX ? "z" : "x";
      const [idx, idz] = ex[0];
      panes.set(`${x},${y},${z}`, { along, inward: [x - idx, z - idz] });
      g.set(x, y, z, "glass_pane");
    }
  }
}

// Entrance on the west face at z=5: a door in a polished-stone frame with a lintel course above.
const door = (y, half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
for (const k of entrance) panes.delete(k);
g.set(0, 2, 5, "dark_oak_door", door(2, "lower"));
g.set(0, 3, 5, "dark_oak_door", door(3, "upper"));
for (const z of [4, 6]) for (const y of [2, 3]) { g.set(0, y, z, "polished_andesite"); panes.delete(`0,${y},${z}`); }
g.set(0, 4, 5, "polished_andesite"); panes.delete("0,4,5");

// Warm light behind some glazed bays, in the air gap just inside the glass (never on a solid face).
let lamp = 0;
for (const [k, p] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 1 || y > 8) continue;
  if ((x * 3 + z * 5 + y) % 7 !== 0) continue;
  const [ix, iz] = p.inward;
  if (!R.has(key(ix, iz)) || exposed(ix, iz, y).length) continue;
  g.set(ix, y, iz, lamp++ % 2 ? "glowstone" : "shroomlight");
}

// Mechanical penthouse units on the core roof, standing on its parapet-level roof surface.
for (const [k, r] of R) {
  const [x, z] = k.split(",").map(Number);
  if (r !== 10 || (x * 3 + z * 5) % 11 !== 0) continue;
  if (DIRS.every(([dx, dz]) => R.get(key(x + dx, z + dz)) === 10)) g.set(x, r, z, "iron_block");
}

// Glazing: connect each pane to the piers and panes along its own face, so the bays read as a continuous grid.
for (const [k, p] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const arms = p.along === "x"
    ? [[1, 0, "east"], [-1, 0, "west"]]
    : [[0, 1, "south"], [0, -1, "north"]];
  const conn = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz, name] of arms) if (g.get(x + dx, y, z + dz)) conn[name] = "true";
  g.set(x, y, z, "glass_pane", conn);
}

const out = `${dir}/DC78829.nbt`;
const s = g.save(out);
console.log(`DC78829: ${s.blocks} blocks, palette ${s.palette}, ${panes.size} panes -> ${out}`);
