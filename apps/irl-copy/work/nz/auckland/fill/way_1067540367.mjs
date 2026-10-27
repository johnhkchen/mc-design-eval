// A 1930s-50s brick commercial block: five storeys, flat roof, quartz string courses and cornice, a shopfront at street level.
// The lidar roofs sit at 22-23 blocks almost everywhere, so the massing is one flat mass with no setbacks; the 22 edges become the cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1067540367.cells.json", "utf8"));
const g = new Voxels([28, 36, 33]);

const key = (x, z) => `${x},${z}`;
const FACE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const PLINTH = 3;                                // solid plinth to the ground-floor line, above every cell's ground (0-2)
const TOP = 22;                                  // cornice row on the wall ring; the flat roof membrane is at this row too; parapet above
const SHOP = [4, 5, 6];                          // ground storey rows: shopfront glazing, door, canopy
const STRINGS = [7, 11, 15, 19];                 // quartz string courses at the foot of storeys 2-5
const winRows = (s) => (s === 19 ? [20, 21] : [s + 1, s + 2, s + 3]);
const WINDOW_YS = [...SHOP, ...STRINGS.flatMap(winRows)];

const inF = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inF.has(key(x, z));

// Walls: a footprint cell with a neighbour outside the footprint. One outside side = a facade cell. Two sides = a corner
// (a step of the diagonal east flank is one of these): it takes its east or west face for the glazing, and is brick, never glass.
const ring = new Map();
for (const [x, z] of cells) {
  const out = Object.keys(FACE).filter((d) => !has(x + FACE[d][0], z + FACE[d][1]));
  if (!out.length) continue;
  const face = out.find((d) => d === "east" || d === "west") ?? out[0];
  ring.set(key(x, z), out.length > 1 ? { corner: true, face } : { face });
}
const along = (x, z, face) => (face === "north" || face === "south" ? x : z);
const isPier = (x, z, face) => along(x, z, face) % 3 === 0;   // a brick pier every third cell; two-cell glass bays between

// The entrance: the facade with the most cells, at its middle, kept off a pier.
const faceCells = { north: [], south: [], west: [], east: [] };
for (const [k, r] of ring) if (!r.corner) { const [x, z] = k.split(",").map(Number); faceCells[r.face].push([along(x, z, r.face), k]); }
const doorFace = Object.keys(faceCells).reduce((a, b) => (faceCells[b].length > faceCells[a].length ? b : a));
const doorTs = faceCells[doorFace].map(([t]) => t).sort((a, b) => a - b);
let doorT = doorTs[Math.floor(doorTs.length / 2)];
if (doorT % 3 === 0) doorT += 1;
const doorKey = faceCells[doorFace].find(([t]) => t === doorT)?.[1];
const canopyT = new Set([doorT - 1, doorT, doorT + 1]);

const isWindow = (x, z, r) => !r.corner && !isPier(x, z, r.face) && key(x, z) !== doorKey;

// The air gap behind each window (one cell inside the wall, same rows as the glass); about one window in six is lit.
const gaps = new Map();                          // "x,z" -> { lit, ys: Set }
function addGap(x, z, r, ys, lit) {
  const [dx, dz] = FACE[r.face];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || ring.has(key(ix, iz))) return;
  gaps.set(key(ix, iz), { lit, ys: new Set(ys) });
}
for (const [k, r] of ring) {
  const [x, z] = k.split(",").map(Number);
  if (!r.face) continue;
  if (key(x, z) === doorKey) { addGap(x, z, r, [4, 5], false); continue; }
  if (!isWindow(x, z, r)) continue;
  addGap(x, z, r, WINDOW_YS, ((x * 3 + z * 5) % 6) === 0);
}

function wallBlock(x, z, y, r) {
  if (y <= PLINTH) return { block: "polished_andesite" };
  if (y === TOP + 1) return { block: "quartz_slab", state: { type: "bottom", waterlogged: "false" } };   // parapet coping
  if (STRINGS.includes(y) || y === TOP) return { block: "quartz_block" };
  if (SHOP.includes(y)) {
    if (key(x, z) === doorKey) {
      if (y === 4) return { block: "dark_oak_door", state: { facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (y === 5) return { block: "dark_oak_door", state: { facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { block: "quartz_block" };                                                                 // lintel over the door
    }
    if (y === 6 && r.face === doorFace && canopyT.has(along(x, z, r.face))) return { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };
    if (r.corner || isPier(x, z, r.face)) return { block: "bricks" };
    return { block: "glass" };
  }
  // Upper storeys: glazing in the rows above each string course, brick elsewhere.
  const base = STRINGS.filter((s) => s < y).pop();
  if (base !== undefined && winRows(base).includes(y) && isWindow(x, z, r)) return { block: "glass" };
  return { block: "bricks" };
}

for (const [x, z] of cells) {
  const r = ring.get(key(x, z));
  if (r) {
    for (let y = 0; y <= TOP + 1; y++) {
      const w = wallBlock(x, z, y, r);
      if (w) g.set(x, y, z, w.block, w.state);
    }
    continue;
  }
  const gap = gaps.get(key(x, z));
  for (let y = 0; y <= TOP; y++) {
    if (gap?.ys.has(y)) { if (gap.lit) g.set(x, y, z, "glowstone"); continue; }   // lit window: glowstone behind the glass; else a dark pocket
    g.set(x, y, z, y === TOP ? "smooth_stone" : "stone");                          // solid core, storey floors, roof membrane
  }
}

// Entrance: a hanging lantern in the pocket just inside the door.
if (doorKey) {
  const [dfx, dfz] = FACE[doorFace];
  const [x, z] = doorKey.split(",").map(Number);
  g.set(x - dfx, 5, z - dfz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof plant: two boxes standing on the roof membrane, inside the footprint.
for (const [x0, z0, w, d] of [[8, 12, 4, 3], [16, 17, 3, 3]]) {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
    if (!has(x, z) || ring.has(key(x, z))) continue;
    g.set(x, 23, z, "light_gray_concrete"); g.set(x, 24, z, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1067540367.nbt");
