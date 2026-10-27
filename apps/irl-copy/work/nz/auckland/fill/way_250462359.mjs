// Way 250462359, "Millenium Corp": a 1980s concrete-frame office block on the Mt Eden side of the CBD. A two-storey
// wing along the east, a seven-storey office slab with a one-storey penthouse setback on its core, a stone plinth,
// a glazed band with white-concrete piers every 4 blocks, and one recessed entrance on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_250462359.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const BASE = 2;        // y 0..1 is the plinth; the first storey's floor line is y 2
const STOREY = 4;      // a floor line, then a 3-block window band
const DIRS = [[1, 0], [-1, 0], [0, -1], [0, 1]];   // E, W, N, S (z grows south)

// the lidar roof flattened into three tiers: wing (2 storeys), office slab (7), penthouse setback (1 on the core)
const tierTop = (roof) => (roof <= 20 ? 10 : roof >= 32 ? 34 : 30);
const K = (x, z) => x * 100 + z;
const T = new Map();
for (const [x, z, , roof] of cells) T.set(K(x, z), tierTop(roof));
const topAt = (x, z) => T.get(K(x, z)) ?? 0;     // 0 outside the footprint: a face onto nothing is exposed
const floorOf = (y) => BASE + STOREY * Math.floor((y - BASE) / STOREY);

// the faces of cell x, z at height y that show to the air: outside the footprint, or the neighbour stops below y
const exposedFaces = (x, z, y) => DIRS.map(([dx, dz], i) => ({ i, dx, dz })).filter(({ dx, dz }) => topAt(x + dx, z + dz) <= y);

// the envelope block at x, y, z (before the windows are cut back into their air pockets)
function envelope(x, z, y) {
  if (y < BASE) return "stone_bricks";
  const faces = exposedFaces(x, z, y);
  if (!faces.length) return "white_concrete";
  const o = y - floorOf(y);
  if (y === topAt(x, z) - 1 || o === 0) return "light_gray_concrete";      // cornice and storey lines
  const f = faces[0], bay = f.i < 2 ? z : x;                                   // piers 1 wide, glass 3 wide
  return bay % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
}

const g = new Voxels([35, 47, 63]);
const pockets = [];   // air behind each pane: [x, y, z, o]
for (const [x, z] of cells) {
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) {
    const b = envelope(x, z, y);
    g.set(x, y, z, b);
    if (b !== "light_blue_stained_glass") continue;
    const f = exposedFaces(x, z, y)[0], ix = x - f.dx, iz = z - f.dz;
    if (topAt(ix, iz) > y) pockets.push([ix, y, iz, y - floorOf(y)]);
  }
}

// the air behind the glass; one pane in some bays holds a shroomlight (the warm light behind the glass)
for (const [x, y, z, o] of pockets) {
  const lit = o === 2 && (x * 7 + z * 13 + floorOf(y)) % 5 === 0;
  g.set(x, y, z, lit ? "shroomlight" : "air");
}

// the entrance: a recessed bay on the south face of columns 17..20, two dark oak doors under a glass transom
const zMax = (x) => Math.max(...cells.filter(([cx]) => cx === x).map(([, z]) => z));
for (let x = 17; x <= 20; x++) {
  const z = zMax(x);
  for (let y = 3; y <= 5; y++) {
    g.set(x, y, z - 1, "air");
    g.set(x, y, z, "light_blue_stained_glass");
  }
}
const hinge = (x) => (x === 18 ? "left" : "right");
for (const x of [18, 19]) {
  const z = zMax(x);
  g.set(x, 3, z, "dark_oak_door", { facing: "south", half: "lower", hinge: hinge(x), open: "false", powered: "false" });
  g.set(x, 4, z, "dark_oak_door", { facing: "south", half: "upper", hinge: hinge(x), open: "false", powered: "false" });
  g.set(x, 3, z - 1, "light_gray_concrete");   // the threshold, inside the recess
}

// roof plant: a box on the office roof and one on the penthouse, each on a flat patch of its own tier
function roofRect(level, w, d) {
  for (let x0 = 1; x0 < 34; x0++) for (let z0 = 1; z0 < 62; z0++) {
    let ok = true;
    for (let x = x0 - 1; x <= x0 + w && ok; x++) for (let z = z0 - 1; z <= z0 + d && ok; z++) if (topAt(x, z) !== level) ok = false;
    if (ok) return [x0, z0];
  }
  return null;
}
for (const [level, w, d] of [[30, 4, 3], [34, 3, 2]]) {
  const r = roofRect(level, w, d);
  if (!r) continue;
  for (let x = r[0]; x < r[0] + w; x++) for (let z = r[1]; z < r[1] + d; z++) {
    g.set(x, level, z, "gray_concrete");
    g.set(x, level + 1, z, "gray_concrete");
  }
}

const out = `${DIR}/way_250462359.nbt`;
console.log(g.save(out), out);
