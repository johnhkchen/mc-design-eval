import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1414 17th St NW: a 1920s red-brick apartment block on a rusticated stone base, limestone belt courses and a
// cornice, four storeys of 3-block bays, a stepped-up core over the lower wings. Storey lines (belts) at 1, 4, 7, 10;
// each storey is a 2-high window band between them, with brick piers every third column. The shell is one block
// thick, so the air behind the glass is the interior, with an oak floor per storey and a few glowstones behind glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69570.cells.json`, "utf8"));

const W = 16, H = 25, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // N, S, W, E
const BELTS = new Set([1, 4, 7, 10]);

// Lidar roof heights (raw, above y 0) smoothed into tiers: 13 = the core, 12 = its podium ring (both kept as lidar
// reads them), everything under 12 takes the majority of its 3x3 neighbourhood so the lower wings lose the speckle.
const raw = new Map(), top = new Map(), gnd = new Map();
for (const [x, z, gr, roof] of cells) { raw.set(key(x, z), roof); gnd.set(key(x, z), gr); }
function mode3(x, z) {
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = raw.get(key(x + dx, z + dz)); if (v !== undefined) count.set(v, (count.get(v) ?? 0) + 1);
  }
  let best = raw.get(key(x, z)), n = 0;
  for (const [v, c] of count) if (c > n) { best = v; n = c; }
  return best;
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const r = raw.get(key(x, z));
  const tier = r >= 12 ? r : mode3(x, z);
  top.set(key(x, z), tier - 1);                             // highest solid block row under the roof
}
const topOf = (x, z) => top.get(key(x, z)) ?? -1;          // -1 outside the footprint

// faces of a block at height y that look out onto air: the neighbouring column stops below it (or it is outside)
const facesAt = (x, y, z) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) < y);

const glowAt = [];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topOf(x, z);
  g.set(x, 0, z, "stone_bricks");                           // rusticated base, the foundation under every cell
  for (let y = 1; y <= T; y++) {
    const faces = facesAt(x, y, z), exposed = faces.length > 0;
    if (y === T) { g.set(x, y, z, exposed ? "smooth_sandstone" : "smooth_stone"); continue; }   // cornice / roof deck
    if (BELTS.has(y)) { g.set(x, y, z, exposed ? "smooth_sandstone" : "oak_planks"); continue; }  // belt course / floor
    if (!exposed) continue;                                 // interior air, the glass's gap
    const corner = faces.some(([dx]) => dx !== 0) && faces.some(([, dz]) => dz !== 0);
    const [dx, dz] = faces[0];
    const along = dz !== 0 ? x : z;                         // position along the face, for the pier rhythm
    if (corner || along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    // some lower-row windows get a glowstone standing on the floor just inside (never on the corners)
    if (!corner && y % 3 === 2 && (x * 7 + z * 3 + y) % 11 === 0) {
      const ix = x - dx, iz = z - dz;
      if (topOf(ix, iz) >= y + 1 && facesAt(ix, y, iz).length === 0) glowAt.push([ix, y, iz]);
    }
  }
}
for (const [x, y, z] of glowAt) g.set(x, y, z, "glowstone");

// Entrance on the east (street) face: a dark oak door in a stone surround, with a sandstone lintel over the bay.
const dx0 = 15, dz0 = 13;
g.set(dx0, 1, dz0, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, 2, dz0, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [dz0 - 1, dz0, dz0 + 1]) g.set(dx0, 3, z, "smooth_sandstone");
for (const z of [dz0 - 1, dz0 + 1]) g.set(dx0, 2, z, "stone_bricks");

// Roof equipment on the core's flat top: two brick flues with stone caps, standing on the roof deck.
const coreTop = Math.max(...top.values());
const flues = [[9, 8], [11, 8]];
for (const [x, z] of flues) {
  if (topOf(x, z) !== coreTop) continue;
  const T = coreTop;
  g.set(x, T + 1, z, "bricks"); g.set(x, T + 2, z, "bricks"); g.set(x, T + 3, z, "smooth_sandstone");
}

const stats = g.save(`${DIR}/DC69570.nbt`);
console.log(JSON.stringify(stats));
