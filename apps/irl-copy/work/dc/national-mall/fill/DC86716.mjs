import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1500 Massachusetts Ave NW: a 1920s brick apartment block with limestone trim (Beaux-Arts cornice and
// quoins, a base course, string courses at each storey), set on a stone plinth, with a parapet and a
// flat roof. Storeys are 3 blocks (a string course, then two rows of windows); the roof tiers snap to the
// storey lines so the massing reads as flat setbacks. Hollow shell: an air gap behind the glass, a floor
// slab per storey line, no interiors.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86716.cells.json`, "utf8"));

const W = 54, D = 51, Y = 24;
const g = new Voxels([W, Y, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr, roof });

// Storey lines: layer 1, then every 3 blocks. A cell's top is a storey line (its roof deck), so each
// tier is flat and every tier stands on the floor slab of the line below it.
const LINES = [1, 4, 7, 10, 13, 16, 19, 22];
const snapLine = (v) => LINES.reduce((best, L) => (Math.abs(L - v) < Math.abs(best - v) ? L : best));
const isLine = (y) => y % 3 === 1;

// Lidar noise out: median roof over a 5x5 window, snapped to a storey line; median ground over 3x3.
function median(vals) { vals.sort((a, b) => a - b); return vals[Math.floor(vals.length / 2)]; }
const info = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const roofs = [], grounds = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = map.get(key(x + dx, z + dz)); if (!c) continue;
    roofs.push(c.roof);
    if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) grounds.push(c.gr);
  }
  info.set(key(x, z), { g: median(grounds), T: snapLine(median(roofs)) });
}

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const at = (x, z) => info.get(key(x, z));
// The directions in which a cell at height y has open air beside it: no neighbour cell, or one whose deck is below y.
function openDirs(x, z, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, z + dz);
    if (!n || n.T < y) out.push(d);
  }
  return out;
}
const base = (c) => Math.max(c.g, 1);   // the plinth: solid from y 0 up to the ground, at least one block

// Entrance: a north (street-side) wall cell, ground storey, nearest the centre line.
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of [...info.keys()].map((k) => k.split(",").map(Number))) {
    if (at(x, z - 1)) continue;
    if (base(at(x, z)) > 1) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; entrance = [x, z]; }
  }
}

// 1. Plinth and body, cell by cell
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  const b = base(c);
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");        // foundation: solid, nothing floats
  for (let y = b; y <= c.T; y++) {
    const open = openDirs(x, z, y);
    if (isLine(y)) {
      if (y === 1 && open.length) g.set(x, y, z, "stone_bricks");      // base course
      else if (open.length) g.set(x, y, z, "calcite");                // string course / cornice
      else g.set(x, y, z, "stone");                                   // floor slab / roof deck
      continue;
    }
    if (!open.length) continue;                                       // interior: an air gap
    const ns = open.includes("n") || open.includes("s");
    const ew = open.includes("e") || open.includes("w");
    // quoins on the true corners; on the stepped (diagonal) faces every step is a corner, so only every other
    // one is limestone and the rest carry the windows of the face they close
    if (ns && ew && (x + z) % 2 === 0) { g.set(x, y, z, "calcite"); continue; }
    const useNs = ns;
    const idx = useNs ? x : z;
    if (idx % 3 === 0) { g.set(x, y, z, "bricks"); continue; }        // pier
    const face = useNs ? "ns" : "ew";
    const state = face === "ns"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);
  }
  // parapet on the roof's edge
  if (openDirs(x, z, c.T).length) g.set(x, c.T + 1, z, "bricks");
}

// 2. Warm light behind some windows: a lantern on the floor slab inside the window's row
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  for (let y = base(c); y < c.T; y++) {
    if (y % 3 !== 2) continue;                                       // the lower row of each storey
    const open = openDirs(x, z, y);
    if (!open.length || open.length > 1) continue;
    if (open[0] === "n" || open[0] === "s") { if (x % 3 === 0) continue; }
    else { if (z % 3 === 0) continue; }
    if ((x * 31 + z * 17 + y * 7) % 4 !== 0) continue;
    const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[open[0]];
    const ix = x + inward[0], iz = z + inward[1];
    const n = at(ix, iz);
    if (!n || n.T < y || openDirs(ix, iz, y).length) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Entrance: dark oak door in the ground storey, limestone pilasters either side
if (entrance) {
  const [ex, ez] = entrance;
  g.set(ex, 2, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 3, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) { g.set(ex + dx, 2, ez, "calcite"); g.set(ex + dx, 3, ez, "calcite"); }
  g.set(ex, 0, ez, "stone_bricks");
}

// 4. Roof plant: a few light-grey boxes on the interior of the roof tiers, clear of the parapet
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  if (c.T < 10 || openDirs(x, z, c.T).length) continue;
  if (x % 7 === 3 && z % 7 === 3) g.set(x, c.T + 1, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/DC86716.nbt`);
console.log("cells", info.size, "tiers", [...new Set([...info.values()].map((c) => c.T))].sort((a, b) => a - b), "entrance", entrance, stats);
