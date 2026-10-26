import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC58338 - 1730 E St NW, Commercial-Office-Large
// Mid-century (c.1960s) speculative office block: pale concrete piers and spandrels,
// a smooth stone base course, glazing bays, a recessed stone-framed entrance on the
// z=0 face, a quartz parapet and a low plant screen on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58338.cells.json`, "utf8"));

const W = 8, H = 23, D = 30;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const [x, z, gr, rf] of cells) {
  cmap.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => cmap.has(key(x, z));
const clampY = (y) => Math.max(0, Math.min(H - 1, y));

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

function isPerimeter(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

function inward(x, z) {
  if (!has(x - 1, z)) return [x + 1, z];
  if (!has(x + 1, z)) return [x - 1, z];
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x, z + 1)) return [x, z - 1];
  return null;
}

// Entrance: centre bays of the z=0 face
const DOOR_X = [3, 4];
const isEntranceCell = (x, z) => z === 0 && DOOR_X.includes(x);
const isEntranceSurround = (x, z) => z === 0 && (x === 2 || x === 5);

const lightCells = [];
const roofCells = [];

for (const [x, z] of [...cmap.keys()].map((k) => k.split(",").map(Number))) {
  const { gr, rf } = cmap.get(key(x, z));
  const g0 = clampY(gr);
  const R = Math.min(H - 2, Math.max(clampY(rf), g0 + STOREY));
  const perim = isPerimeter(x, z);

  // Foundation from y 0 up to ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  for (let y = g0; y < R; y++) {
    const rel = y - g0;
    const k = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (!perim) {
      // Interior: floor slabs only, air otherwise (no interiors)
      if (y === g0) put(x, y, z, "smooth_stone");
      else if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter facade
    if (y === g0) {
      put(x, y, z, "smooth_stone"); // base course
      continue;
    }
    if (r === 0) {
      put(x, y, z, "light_gray_concrete"); // storey line / spandrel band
      continue;
    }

    // Entrance: stone-framed recess on the ground floor
    if (k === 0 && isEntranceCell(x, z)) {
      if (r === 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (k === 0 && isEntranceSurround(x, z)) {
      put(x, y, z, "stone_bricks"); // jamb either side of the door
      continue;
    }

    // Window rows: piers on a 3-bay rhythm, glass elsewhere, with a stone sill on the lowest window row
    const t = (x === 0 || x === W - 1) ? z : x;
    const pier = t % 3 === 0;

    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (r === 1) {
      put(x, y, z, "light_blue_stained_glass_pane");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }

    // Warm light behind a few glazing bays (sparser than before)
    if (!pier && r === 1 && k >= 1 && (x * 2 + z + k * 3) % 9 === 0) {
      const inw = inward(x, z);
      if (inw && has(inw[0], inw[1]) && !isPerimeter(inw[0], inw[1])) {
        lightCells.push([inw[0], y, inw[1]]);
      }
    }
  }

  // Entrance lintel above the door, carried by the surround
  if (perim && isEntranceCell(x, z)) {
    put(x, g0 + 3, z, "smooth_stone");
  }

  // Roof cap across the whole footprint
  put(x, R, z, "light_gray_concrete");

  // Quartz parapet on the perimeter
  if (perim) {
    put(x, R + 1, z, "quartz_block");
  } else if ((x + z) % 3 === 0) {
    roofCells.push([x, R + 1, z]);
  }
}

// Low plant screen on interior roof cells (one neat row of units, not scattered cubes)
for (const [x, y, z] of roofCells) {
  put(x, y, z, "light_gray_concrete");
}

// Warm lights behind glazing
for (const [x, y, z] of lightCells) put(x, y, z, "glowstone");

g.save(`${DIR}/DC58338.nbt`);
