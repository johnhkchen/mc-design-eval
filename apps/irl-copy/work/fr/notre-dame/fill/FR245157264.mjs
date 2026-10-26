// FR245157264: a Haussmann-style residential block (1900, seven storeys under a slate roof), built on the lidar footprint.
// Storeys are 4 blocks (floor slab, two window rows, lintel), so the storey lines fall on y = 0 mod 4 and every tier top
// (5, 9, ... 29) is a deck row (cornice on the face, slab inside) under a roof cap. The seventh storey is set back one
// cell from the perimeter, so the outer ring stops at the sixth storey's terrace and the attic rises behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245157264.cells.json`, "utf8"));

const W = 38, H = 46, D = 21;
const TIERS = [5, 9, 13, 17, 21, 25, 29];                  // 1 mod 4: k storeys of 4 under a cap row
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

const fp = new Map();                                       // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;                  // no building there: open air

// Smooth the lidar: 3x3 median, then snap to the nearest tier (ties keep the lower tier).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// The attic: the outer ring of the seventh storey is set back, leaving a terrace on the sixth storey's roof.
const onEdge = (x, z) => DIRS.some(([, dx, dz]) => !at(x + dx, z + dz));
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T === 29 && onEdge(x, z)) c.T = 25;
}

// Which faces of a cell at height y are open to air (no building beside it that reaches that row).
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// The street door: a ground-floor cell on the south face, near the middle of the frontage, with its two neighbours on that face too.
const southOk = (x, z) => at(x, z)?.g === 0 && !at(x, z + 1) && at(x, z).T >= 9;
const doorCands = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => southOk(x, z) && southOk(x - 1, z) && southOk(x + 1, z));
doorCands.sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] - 19) - Math.abs(b[0] - 19)));
const [DX, DZ] = doorCands[0];

// Warm lights: one window in five on the first window row gets a glowstone just inside the glass.
const lights = new Set();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = c.g; y < c.T - 2; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (ex.length !== 1) continue;
    const [, dx, dz] = DIRS.find(([n]) => n === ex[0]);
    const i = dz ? x : z;
    if ((i % 4 !== 1 && i % 4 !== 2) || (x * 3 + z * 5 + y) % 5 !== 0) continue;
    if (exposed(x - dx, z - dz, y).length === 0) lights.add(`${x - dx},${y},${z - dz}`);
  }
}

// The facade and the interior of every footprint cell, as a map of "x,y,z" -> [block, state].
const out = new Map();
const cls = (x, z, y) => {
  const { g, T } = at(x, z);
  if (y < g) return ["stone_bricks"];                       // foundation: solid up to the cell's ground
  if (y >= T) return null;
  if (y === T - 1) return ["deepslate_tiles"];              // roof cap
  const ex = exposed(x, z, y);
  const r = y % 4;
  if (y === T - 2) return ex.length ? ["polished_andesite"] : ["smooth_stone"];   // deck: cornice on the face, slab inside
  if (!ex.length) {
    if (r === 0) return ["smooth_stone"];                   // storey floor slab
    if (lights.has(`${x},${y},${z}`)) return ["glowstone"]; // warm light behind the glass
    return null;                                            // air: the room
  }
  if (r === 0) return [y === 0 ? "stone_bricks" : "polished_andesite"];   // plinth, string course
  if (r === 3) return ["polished_andesite"];                // lintel
  const xAxis = ex.some((d) => d === "east" || d === "west");
  const zAxis = ex.some((d) => d === "north" || d === "south");
  if (xAxis && zAxis) return ["calcite"];                   // corner pier
  const i = zAxis ? x : z;                                  // bays along the face
  return [i % 4 === 1 || i % 4 === 2 ? "glass_pane" : "calcite"];
};
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.T; y++) {
    const v = cls(x, z, y);
    if (v) out.set(`${x},${y},${z}`, { block: v[0], state: v[1] });
  }
}

// Entrance: a door in the ground-floor bay, lanterns hung either side, and a sloped canopy over the three bays.
out.set(`${DX},1,${DZ}`, { block: "dark_oak_door", state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } });
out.set(`${DX},2,${DZ}`, { block: "dark_oak_door", state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } });
for (const dx of [-1, 1]) out.set(`${DX + dx},2,${DZ}`, { block: "lantern", state: { hanging: "true", waterlogged: "false" } });
for (const dx of [-1, 0, 1]) out.set(`${DX + dx},3,${DZ}`, { block: "stone_brick_stairs", state: { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" } });

// Roof equipment: brick chimney stacks on some interior cells of the attic, standing on its cap.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T !== 29 || exposed(x, z, 28).length || x % 7 !== 3 || z % 5 !== 2) continue;
  out.set(`${x},29,${z}`, { block: "bricks" }); out.set(`${x},30,${z}`, { block: "bricks" });
  out.set(`${x},31,${z}`, { block: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } });
}

// Glass panes connect to whatever stands beside them in the plane of the face.
const solid = (x, y, z) => out.has(`${x},${y},${z}`);
for (const [key, v] of out) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    west: String(solid(x - 1, y, z)), east: String(solid(x + 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([W, H, D]);
for (const [key, v] of out) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const res = g.save(`${DIR}/FR245157264.nbt`);
console.log(`FR245157264: ${res.blocks} blocks, ${res.palette} palette entries, door at x=${DX} z=${DZ}`);
