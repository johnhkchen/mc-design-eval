// Datacom, Auckland CBD: a nine-storey concrete office block on a lidar-stepped massing. Floors every 4 blocks
// (3.3 m), a two-block-thick shell (outer ring = curtain wall on mullions, inner ring = solid spandrel with an air
// gap behind each glazed bay), a hollow interior of floor slabs, a stone plinth, a dark-oak entrance on the west face,
// a parapet and roof plant. Foundations fill from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_496872973.cells.json`, "utf8"));
const W = 87, D = 71, H = 52;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, ground, roof] of cells) info.set(key(x, z), { ground, roof });
const inside = (x, z) => info.has(key(x, z));
const nb4 = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];

// Ring A: the outer skin (a footprint cell with a neighbour outside). Ring B: the cell behind it. The rest is interior.
const isA = (x, z) => nb4(x, z).some(([a, b]) => !inside(a, b));
const isB = (x, z) => !isA(x, z) && nb4(x, z).some(([a, b]) => inside(a, b) && isA(a, b));

// Massing: the lidar roof, smoothed over a 7 x 7 window (noise of 1-3 blocks), snapped to whole storeys of 4 blocks.
// Storey s occupies y = 1 + 4s .. 4 + 4s, so the roof deck of an N-storey cell sits at y = 4N (its cornice row).
const storeys = new Map();
const hist = {};
for (const [x, z] of cells) {
  let sum = 0, n = 0;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const c = info.get(key(x + dx, z + dz)); if (c) { sum += c.roof; n++; }
  }
  const N = Math.min(10, Math.max(1, Math.round((sum / n - 1) / 4)));
  storeys.set(key(x, z), N); hist[N] = (hist[N] || 0) + 1;
}
console.error("storeys histogram", JSON.stringify(hist));

// The outer skin's bays: every third column is a mullion, the rest glazing. u runs along the wall (x on north/south
// faces, z on east/west). No corner piers: on a diagonal (stair-stepped) edge every cell exposes two faces, so a
// corner rule would turn the whole diagonal into solid pier and leave it blind.
const kindA = new Map();
for (const [x, z] of cells) {
  if (!isA(x, z)) continue;
  const exW = !inside(x - 1, z), exE = !inside(x + 1, z);
  const u = exW || exE ? z : x;
  kindA.set(key(x, z), u % 3 === 0 ? "mullion" : "glass");
}

// The entrance: the west face's middle cell (the lobby faces the street side on the west).
const westZ = [];
for (const [x, z] of cells) if (kindA.has(key(x, z)) && !inside(x - 1, z)) westZ.push(z);
westZ.sort((a, b) => a - b);
const doorZ = westZ[Math.floor(westZ.length / 2)];
const doorX = Math.min(...cells.filter(([, z]) => z === doorZ).map(([x]) => x));
const doorKey = key(doorX, doorZ);
kindA.set(doorKey, "door");
console.error("door at", doorX, doorZ, "west run", westZ[0], westZ[westZ.length - 1]);

// Glazed bays have an air gap behind them: ring B stays open at the glass rows of storeys where its outer neighbour glazes
// (a lobby behind the door). Some of those gaps hold a glowstone lamp.
const lit = (x, z, s) => ((x * 31 + z * 17 + s * 7) % 5 === 0);
const glazedBehind = (x, z) => nb4(x, z).some(([a, b]) => kindA.get(key(a, b)) === "glass" || kindA.get(key(a, b)) === "door");
const nearDoor = (x, z) => nb4(x, z).some(([a, b]) => key(a, b) === doorKey);

for (const [x, z, ground] of cells) {
  const N = storeys.get(key(x, z)), top = 4 * N;
  const A = isA(x, z), B = isB(x, z), k = key(x, z);
  const kind = kindA.get(k);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  for (let y = ground; y < top; y++) {
    if (y === ground) { g.set(x, y, z, A ? "stone_bricks" : "light_gray_concrete"); continue; }   // plinth / ground slab
    const r = (y - 1) % 4;   // 0 floor line, 1-2 glazing, 3 head
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (r === 3) { if (A || B) g.set(x, y, z, "white_concrete"); continue; }
    // r = 1 or 2: the glazing rows
    const s = Math.floor((y - 1) / 4);
    if (A) {
      if (kind === "mullion") g.set(x, y, z, "iron_block");
      else if (kind === "door") {
        if (y <= ground + 3 && y >= 2 && y <= 3) {
          // the door's two halves (lower at y 2, upper at y 3), hinged on the west face
          const half = y === 2 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
        }
      } else g.set(x, y, z, "light_blue_stained_glass");
    } else if (B) {
      if (glazedBehind(x, z)) {
        // the air gap behind the glass; the lobby light sits behind the door
        if (nearDoor(x, z) && r === 1) g.set(x, y, z, "glowstone");
        else if (!nearDoor(x, z) && r === 1 && lit(x, z, s)) g.set(x, y, z, "glowstone");
      } else g.set(x, y, z, "white_concrete");
    }
  }

  // roof: cornice on the outer skin, a deck inside, a parapet course on the edge
  if (A) { g.set(x, top, z, "white_concrete"); g.set(x, top + 1, z, "stone_bricks"); }
  else g.set(x, top, z, "light_gray_concrete");
}

// roof plant: a lift core and an air-handling plant box, on the nine-storey roof, set in from the parapet
const onRoof = (x0, x1, z0, z1, fn) => {
  for (const [x, z] of cells) if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && !isA(x, z) && !isB(x, z)) fn(x, z);
};
onRoof(30, 37, 28, 35, (x, z) => {
  const top = 4 * storeys.get(key(x, z));
  for (let y = top + 1; y <= top + 3; y++) g.set(x, y, z, "white_concrete");
  g.set(x, top + 4, z, "light_gray_concrete");
});
onRoof(52, 62, 36, 44, (x, z) => {
  const top = 4 * storeys.get(key(x, z));
  for (let y = top + 1; y <= top + 2; y++) g.set(x, y, z, "iron_block");
});

const stats = g.save(`${DIR}/way_496872973.nbt`);
console.error("saved", stats, "cells", cells.length);
