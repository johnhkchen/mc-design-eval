// SEA1270123761: 124 5th Ave N (QED Cafe + office, 1959). Two-storey 1960s commercial/office block, concrete and glass.
// Local (0,0) = box corner (445,408). Footprint read from the manifest; the SE notch is simply absent from it.
// Storeys: foundation y0 (one block of stone), warm wall y1; recessed ground floor y2-4 (entrance bay recessed two
// blocks, storefront glass one block in elsewhere, piers in front); floor slab y5 with the entrance canopy projecting
// two blocks over the bay; upper ribbon y6-9 (red sign band over the entrance, glass y7-8, thin dark band y9);
// parapet y10. Penthouse 5x4, y11-13, roof y14; HVAC boxes on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270123761";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const left = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/leftovers.json", "utf8")).find((b) => b.id === ID);
const man = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8")).buildings.find((b) => b.id === ID);
const [X0, Z0] = left.box;
const [W, D] = left.size;
const HMAX = 17;

const inF = new Set();
for (const [x, z] of man.footprint) {
  const lx = x - X0, lz = z - Z0;
  if (lx < 0 || lz < 0 || lx >= W || lz >= D) throw new Error(`footprint cell outside box: ${x},${z}`);
  inF.add(`${lx},${lz}`);
}
const has = (x, z) => inF.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outDirs = (x, z) => Object.keys(DIRS).filter((k) => !has(x + DIRS[k][0], z + DIRS[k][1]));

// Cell classes
const ext = (x, z) => has(x, z) && outDirs(x, z).length > 0;
const pier = (x, z) => {
  const o = outDirs(x, z);
  if (o.length >= 2) return true;                       // corners, notch corners
  if (o.length === 0) return false;
  const d = o[0];
  if (d === "N" || d === "S") {
    if (x >= 15 && x <= 19 && z === 0) return false;    // entrance bay: no pier, the door sits here
    return x % 4 === 0;
  }
  return z % 4 === 0;                                   // E/W faces
};

// Palette: warm pale walls, quartz piers, light-grey spandrels, one thin dark band
const WALL = "smooth_sandstone", PIER = "quartz_block", SPAN = "light_gray_concrete";
const BASE = "stone", DARK = "gray_concrete", SIGN = "red_concrete", GLASS = "glass";

// Build a map first so pane connections can see neighbours, then write.
const cells = new Map();
const put = (x, y, z, block, state) => cells.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => cells.get(`${x},${y},${z}`);

const BAY_X = [15, 19];
const inBayX = (x) => x >= BAY_X[0] && x <= BAY_X[1];
const bayRecess = (x, z) => inBayX(x) && z <= 1;        // the two-block recess under the canopy
const isDoor = (x, z) => z === 2 && (x === 16 || x === 17);

// Storefront line: ring-one cells inward of the recessed ring-0 walls, and piers' inward cells
const storefront = new Set(), pierBehind = new Set();
for (const k of inF) {
  const [x, z] = k.split(",").map(Number);
  if (!ext(x, z)) continue;
  const o = outDirs(x, z);
  if (o.length !== 1) continue;
  const [dx, dz] = DIRS[o[0]];
  const cx = x - dx, cz = z - dz;
  if (!has(cx, cz) || ext(cx, cz)) continue;
  if (pier(x, z)) pierBehind.add(`${cx},${cz}`);
  else storefront.add(`${cx},${cz}`);
}

for (const k of inF) {
  const [x, z] = k.split(",").map(Number);
  const e = ext(x, z), p = e && pier(x, z);

  // foundation: one block of stone under the whole footprint; warm wall from y1
  put(x, 0, z, BASE);
  put(x, 1, z, e ? WALL : WALL);

  // ground floor y2-4
  for (const y of [2, 3, 4]) {
    if (e) {
      if (p) put(x, y, z, PIER);
      else if (bayRecess(x, z)) { /* recessed entrance bay: air */ }
      else { /* recessed ring-0 wall: air, the shadow line */ }
    } else if (bayRecess(x, z)) {
      // inside the recess: the door cells and the glass line two blocks in
      if (z === 2 && inBayX(x)) {
        if (isDoor(x, z)) put(x, y, z, "oak_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: x === 16 ? "left" : "right", open: "false", powered: "false" });
        else put(x, y, z, GLASS);
      }
    } else if (storefront.has(k)) {
      put(x, y, z, GLASS);
    } else if (pierBehind.has(k)) {
      put(x, y, z, PIER);
    }
  }

  // floor slab y5: the spandrel band on the perimeter; the bay's two-block canopy projects over the recess
  put(x, 5, z, e || bayRecess(x, z) ? SPAN : WALL);

  // upper storey y6-9, parapet y10
  if (e) {
    if (p) {
      for (const y of [6, 7, 8, 9]) put(x, y, z, PIER);
    } else {
      put(x, 6, z, WALL);
      put(x, 7, z, "glass_pane");
      put(x, 8, z, "glass_pane");
      put(x, 9, z, DARK);
    }
    put(x, 10, z, SPAN);                                // parapet on the perimeter
  } else {
    put(x, 10, z, BASE);                                // roof deck
  }
}

// Vivid red sign band over the entrance (y6), wider than the bay
for (let x = 14; x <= 20; x++) put(x, 6, 0, SIGN);
for (let x = 15; x <= 19; x++) put(x, 6, 1, SIGN);

// Glass pane connections: a pane joins a neighbour that is not air (same plane)
const paneDirs = (x, y, z) => {
  const s = {};
  for (const [k, [dx, dz]] of Object.entries({ north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] })) {
    s[k] = at(x + dx, y, z + dz) ? "true" : "false";
  }
  return s;
};
for (const [key, v] of [...cells]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  cells.set(key, { block: "glass_pane", state: { ...paneDirs(x, y, z), waterlogged: "false" } });
}

// Penthouse (stair/elevator), 5x4: walls x6-10, z3-6, y11-13; roof y14; N glass, S iron door
const PX0 = 6, PX1 = 10, PZ0 = 3, PZ1 = 6;
for (let y = 11; y <= 13; y++) for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++) {
  if (!has(x, z)) throw new Error(`penthouse cell off footprint ${x},${z}`);
  const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
  if (!edge) continue;
  if (y === 12 && z === PZ0 && x >= 7 && x <= 9) put(x, y, z, GLASS);
  else put(x, y, z, WALL);
}
put(8, 11, PZ1, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(8, 12, PZ1, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++) put(x, 14, z, SPAN);

// Rooftop HVAC boxes (2 high), each with a louvred vent on top
const boxes = [{ x0: 15, x1: 18, z0: 3, z1: 4, vent: [16, 3] }, { x0: 21, x1: 23, z0: 3, z1: 4, vent: [22, 3] }];
for (const b of boxes) {
  for (let x = b.x0; x <= b.x1; x++) for (let z = b.z0; z <= b.z1; z++) {
    if (!has(x, z)) throw new Error(`hvac off footprint ${x},${z}`);
    put(x, 11, z, SPAN); put(x, 12, z, SPAN);
  }
  put(b.vent[0], 13, b.vent[1], "iron_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false", waterlogged: "false" });
}

// Write
const g = new Voxels([W, HMAX, D]);
let maxY = 0;
for (const [key, v] of cells) {
  const [x, y, z] = key.split(",").map(Number);
  if (x < 0 || z < 0 || x >= W || z >= D) throw new Error(`cell outside box ${key}`);
  maxY = Math.max(maxY, y);
  g.set(x, y, z, v.block, v.state);
}
const res = g.save(`${OUT}/${ID}.nbt`);
console.log(JSON.stringify({ id: ID, size: [W, HMAX, D], footprintCells: inF.size, maxY, ...res }));
