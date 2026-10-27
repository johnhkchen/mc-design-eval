// Way 429541500: a long diagonal mid-century office-apartment slab on the Mt Eden / Newton slope.
// Reads as a stepped concrete-and-glass band with a basalt-coloured plinth and cornice. The footprint is a thin
// diagonal ribbon, so every cell is either "front" (on the outside edge: glass, piers, doors) or "inner" (a solid
// slab/spandrel per storey with an air gap behind the glass). Storey lines follow a smoothed ground datum, so the
// floors step cleanly along the slope; roof heights are median-smoothed into whole storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_429541500";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inside = (x, z) => byKey.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isFront = (x, z) => NB4.some(([a, b]) => !inside(x + a, z + b));

// Median of the footprint's own values inside a window: irons out lidar noise without blurring the step between tiers.
const median = (vals) => { vals.sort((a, b) => a - b); return vals[vals.length >> 1]; };
function smoothed(field, R) {
  const out = new Map();
  for (const { x, z } of byKey.values()) {
    const vals = [];
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      const c = byKey.get(key(x + dx, z + dz)); if (c) vals.push(c[field]);
    }
    out.set(key(x, z), median(vals));
  }
  return out;
}
const groundDatum = smoothed("ground", 5);   // storey datum follows the slope
const roofSmooth = smoothed("roof", 4);      // roof tiers

// Deterministic per-cell hash: picks lit windows, doors and plant without a random seed.
const hash = (x, y, z) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0) % 100;

const SHELL = "light_gray_concrete";   // spandrels and piers
const SLAB = "white_concrete";         // floor slab edges
const PLINTH = "stone_bricks";         // basalt-coloured base and cornice
const FOUNDATION = "stone";            // the exposed retaining base on the downhill side, lighter than the plinth
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";

const g = new Voxels([265, 73, 201]);
let front = 0, inner = 0, doors = 0, lit = 0, plant = 0;

for (const { x, z, ground } of byKey.values()) {
  const isF = isFront(x, z);
  const D = groundDatum.get(key(x, z));
  const roofRel = roofSmooth.get(key(x, z));
  // whole storeys on the datum, at least one storey above this cell's own ground
  let n = Math.max(1, Math.round((roofRel - D) / 4));
  let top = D + 4 * n;
  while (top < ground + 4) top += 4;
  if (isF) front++; else inner++;

  // foundation: solid from the lowest ground up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUNDATION);

  for (let y = ground; y < top; y++) {
    const rel = y - D;
    const r = ((rel % 4) + 4) % 4;                 // layer within the storey
    const ground1 = rel < 4;                       // ground storey (shopfront / entrance level)
    const topLayer = y === top - 1;

    if (r === 0) {                                  // floor slab (solid on every cell: the storey stands on it)
      g.set(x, y, z, ground1 ? PLINTH : (isF ? SLAB : SHELL));
      continue;
    }
    if (r === 3) {                                  // spandrel / fascia; top layer is the cornice on the front
      g.set(x, y, z, topLayer && isF ? PLINTH : (ground1 && isF ? PLINTH : SHELL));
      continue;
    }
    // r = 1, 2: the glazing band. Inner cells keep the air gap behind the glass.
    if (!isF) { inner += 0; continue; }
    const mullion = (x + z) % 6 === 0;
    if (ground1) {
      // entrance: one door per ~46 cells along the band, on the lower layer's pair, if it sits above ground
      const doorHere = (x + z) % 46 === 20 && r === 1 && y >= ground && y + 1 < top;
      if (doorHere) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, y + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        doors++; continue;
      }
      if (mullion) { g.set(x, y, z, SHELL); continue; }
      g.set(x, y, z, GLASS); continue;
    }
    if (mullion) { g.set(x, y, z, SHELL); continue; }
    if (hash(x, y, z) < 11) { g.set(x, y, z, LIT); lit++; continue; }
    g.set(x, y, z, GLASS);
  }

  // roof: inner cells keep plant on the roof surface (front edge is the cornice)
  if (!isF && hash(x, top, z) < 4 && top + 2 < 73) {
    g.set(x, top, z, "iron_block"); g.set(x, top + 1, z, SHELL); plant++;
  }
}

const stats = g.save(`${SRC}.nbt`);
console.log(JSON.stringify({ cells: byKey.size, front, inner, doors, lit, plant, ...stats }));
