// Way 948317514: a three-storey 1930s brick commercial block with a cream stringcourse and pier rhythm, a shopfront
// ground floor, a copper-capped corner tower, and a flat roof with a plant box. Massing follows the lidar roof per
// cell, quantized to clean tiers (5 = one storey + parapet, 8 = two storeys, 13 = three storeys + tower).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317514.cells.json`, "utf8"));

const W = 20, D = 13, H = 26;
const g = new Voxels([W, H, D]);

// footprint cell -> { G: ground (foundation top), T: top of the built massing, exclusive }
const k = (x, z) => `${x},${z}`;
const tierOf = (r, G) => (r <= G + 1 ? G + 1 : r <= 5 ? 5 : r <= 10 ? 8 : 13);
const fp = new Map();
for (const [x, z, G, r] of cells) fp.set(k(x, z), { G, T: tierOf(r, G) });
const at = (x, z) => fp.get(k(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the faces of a column at height y that are exposed: off the footprint, or against a neighbour that stops below y
function faces(x, z, y) {
  const out = [], step = [];
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (!n) out.push([dx, dz]);
    else if (n.T <= y) step.push([dx, dz]);
  }
  return { out, step };
}

const panes = [];
for (const [key, { G, T }] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                 // foundation under the sloping ground
  for (let y = G; y < T; y++) {
    const { out, step } = faces(x, z, y);
    const shell = out.length + step.length > 0;
    if (!shell) {                                                             // no interior: a floor slab per storey, air between
      if (y === T - 1) g.set(x, y, z, "gray_concrete");                       // flat roof membrane
      else if (y === G || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, "smooth_quartz"); continue; }           // parapet cap
    if (out.length >= 2 && T < 13) { g.set(x, y, z, "smooth_quartz"); continue; }   // corner pier (the 2-wide tower keeps its windows)
    if (y === G) { g.set(x, y, z, "polished_andesite"); continue; }           // base course
    if (y % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }           // cream string course at each storey line
    if (out.length === 1) {
      const [dx, dz] = out[0];
      const u = dx ? z : x;                                                   // position along the facade
      const row = y % 4;                                                      // 1-2 are the windows, 3 the brick band
      if ((row === 1 || row === 2) && u % 3 !== 0) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z, dx, dz]); continue; }
      if (y < 4 && u % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }   // shopfront pilaster
    }
    g.set(x, y, z, "bricks");                                                 // brick infill, piers and step faces
  }
}

// entrance on the south facade: door in the pier, lantern under a canopy band
g.set(12, 0, 12, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(12, 1, 12, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [11, 12, 13]) g.set(x, 3, 12, "black_concrete");
g.set(12, 2, 12, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some lower-row windows; the inside cell must be air (the floor slab below supports it)
for (const [x, y, z, dx, dz] of panes) {
  if (y % 4 !== 1 || (x + 2 * z + y) % 4 !== 0) continue;
  const ix = x - dx, iz = z - dz;                                             // one cell inside the glass
  if (!at(ix, iz) || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// glass panes connect to their neighbours along the facade
for (const [x, y, z, dx] of panes) {
  const has = (xx, zz) => g.get(xx, y, zz) !== null;
  // an x-facing wall runs its panes along z (north/south); a z-facing wall along x (east/west)
  const st = dx
    ? { north: has(x, z - 1), south: has(x, z + 1), east: false, west: false, waterlogged: "false" }
    : { north: false, south: false, east: has(x + 1, z), west: has(x - 1, z), waterlogged: "false" };
  g.set(x, y, z, "glass_pane", st);
}

// the tower's copper cap, and a plant box on the middle of the 8-tier roof
for (const [key, { T }] of fp) if (T === 13) { const [x, z] = key.split(",").map(Number); g.set(x, 13, z, "oxidized_copper"); }
for (const [x, z] of [[7, 6], [8, 6], [7, 7], [8, 7]]) {
  const c = at(x, z);
  if (c && c.T === 8) for (const y of [8, 9]) g.set(x, y, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/way_948317514.nbt`);
console.log(JSON.stringify(stats));
