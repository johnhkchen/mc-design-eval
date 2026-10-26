import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86664.cells.json`, "utf8"));

const W = 17, H = 31, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(c => [key(c[0], c[1]), c]));
const has = (x, z) => cellMap.has(key(x, z));

// Mid-century office: stone plinth, light concrete floor slabs,
// glazed bays between lighter stone mullions, stone cornice,
// rooftop mechanical penthouse.
const PLINTH = "stone_bricks";
const SLAB = "light_gray_concrete";
const MULLION = "polished_andesite";
const GLASS = "light_blue_stained_glass_pane";
const CORNICE = "smooth_stone";
const CORNICE_EDGE = "stone_bricks";
const FOUNDATION = "stone_bricks";
const SIDEWALL = "stone_bricks";

for (const [x, z, groundRaw, roofRaw] of cells) {
  const base = Math.max(0, Math.floor(groundRaw));
  const top = Math.min(H - 1, Math.max(Math.floor(roofRaw), base + 3)); // exclusive
  const hh = top - base;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUNDATION);

  const sideWall = !has(x - 1, z) || !has(x + 1, z);
  const frontBack = (z === 0 || z === D - 1);
  const corner = sideWall && (z === 0 || z === D - 1);

  for (let y = base; y < top; y++) {
    const rel = y - base;

    if (rel === hh - 1) {
      // Cornice cap; corners in a darker stone for a stepped read
      g.set(x, y, z, corner ? CORNICE_EDGE : CORNICE);
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, PLINTH);
      continue;
    }
    if (rel % 3 === 0) {
      // Floor slab / spandrel line, full depth
      g.set(x, y, z, SLAB);
      continue;
    }

    // Window band
    if (sideWall) {
      g.set(x, y, z, SIDEWALL);
      continue;
    }
    if (frontBack) {
      if (x % 3 === 0 && x !== 0 && x !== W - 1) {
        g.set(x, y, z, MULLION);
      } else {
        g.set(x, y, z, GLASS);
      }
      continue;
    }

    // Interior air gap; sparse warm lamps on the first interior layer
    // sitting on the floor slab, one per bay
    if (z === 1 && x % 6 === 2 && rel % 3 === 1) {
      g.set(x, y, z, "shroomlight");
    }
  }
}

// Ground-floor entrance: doors centred on the front face
if (has(8, 0)) {
  const base = Math.max(0, Math.floor(cellMap.get(key(8, 0))[2]));
  g.set(8, base + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(8, base + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Shopfront glazing either side of the entrance, framed by stone piers
for (let x = 5; x <= 11; x++) {
  if (x === 8 || !has(x, 0)) continue;
  const base = Math.max(0, Math.floor(cellMap.get(key(x, 0))[2]));
  const pier = x === 5 || x === 11;
  g.set(x, base + 1, 0, pier ? MULLION : GLASS);
  g.set(x, base + 2, 0, pier ? MULLION : GLASS);
}

// Rooftop mechanical penthouse, two blocks high, set back from the front
for (let x = 5; x <= 7; x++) {
  for (let z = 1; z <= 2; z++) {
    if (!has(x, z)) continue;
    const [, , gr, rr] = cellMap.get(key(x, z));
    const top = Math.min(H - 3, Math.max(Math.floor(rr), Math.max(0, Math.floor(gr)) + 3));
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC86664.nbt`);
