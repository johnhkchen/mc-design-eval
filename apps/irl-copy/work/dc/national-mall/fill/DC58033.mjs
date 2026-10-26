// 1330 7th St NW, Washington DC: a red-brick 1920s-30s apartment block (Residential-Multifamily) with limestone
// bands, a six-storey body, a stepped penthouse tower on the east end and a low wing. The footprint is an L: a
// north strip and a narrow east arm. Storeys are 2 blocks (one floor slab + one window row), 1 block of air behind
// the glass; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58033.cells.json", "utf8"));

const BODY = 12;                                   // the lidar roof of the main block, flat-tiered (13 is lidar noise)
const col = new Map();                             // "x,z" -> { top }: the roof the lidar gives, smoothed into tiers
const key = (x, z) => `${x},${z}`;
for (const [x, z, , r] of cells) {
  const top = r <= 3 ? r : r >= 14 ? 14 : BODY;   // low wings keep their own height, the 14s are a penthouse tier
  col.set(key(x, z), { top });
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of a cell at height y that show outside: a neighbour missing, or lower than y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const nb = col.get(key(x + dx, z + dz)); return !nb || nb.top <= y; });

const g = new Voxels([23, 25, 27]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

const DOOR = { x: 18, z: 26 };
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [k, { top }] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    const roofRow = y === top - 1;                  // cornice / roof membrane
    const winRow = y >= BODY ? true : y % 2 === 1;   // penthouse window row, then the odd rows of the body
    if (!ex.length) {                               // interior: floor slab per storey, air behind the glass
      if (roofRow) put(x, y, z, "smooth_stone");
      else if (y % 2 === 0 && y < BODY) put(x, y, z, "stone");
      continue;
    }
    const corner = ex.length >= 2;
    const [dx] = ex[0];
    const u = dx !== 0 ? z : x;                      // position along the face
    let b;
    if (roofRow) b = corner || u % 2 === 0 ? "calcite" : "bricks";          // dentil cornice
    else if (y === 0) b = "polished_andesite";                              // plinth
    else if (!winRow) b = "calcite";                                        // storey band
    else if (corner) b = "calcite";                                         // quoins
    else b = u % 3 === 0 ? "bricks" : "glass";                              // brick piers, 2-wide glass bays

    // entrance on the south face: door, calcite pilasters, calcite lintel
    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper"));
      continue;
    }
    if (z === DOOR.z && Math.abs(x - DOOR.x) <= 1 && y <= 3 && (y === 3 || Math.abs(x - DOOR.x) === 1)) b = "calcite";

    put(x, y, z, b);

    // warm light: a glowstone in the room behind some windows
    if (b === "glass") {
      const ix = x - dx, iz = z - ex[0][1];
      const inner = col.get(key(ix, iz));
      if (inner && inner.top > y && !exposed(ix, iz, y).length && (u + 2 * y) % 5 === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// rooftop plant: two 2x2x2 air-handling units on the flat roof, away from the edges and the penthouse
const roofFree = (x, z) => { const c = col.get(key(x, z)); return c && c.top === BODY && !exposed(x, z, BODY - 1).length; };
const units = [];
for (let z = 6; z < 22 && units.length < 2; z += 1) for (let x = 17; x < 21 && units.length < 2; x += 1) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => roofFree(x + a, z + b));
  const far = units.every(([ux, uz]) => Math.abs(ux - x) > 3 || Math.abs(uz - z) > 3);
  if (ok && far) units.push([x, z]);
}
for (const [ux, uz] of units) for (let y = BODY; y < BODY + 2; y++) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]])
  put(ux + a, y, uz + b, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58033.nbt");
console.log("DC58033 built:", g.count(), "blocks,", g.palette.length - 1, "palette entries, rooftop units", units.length);
