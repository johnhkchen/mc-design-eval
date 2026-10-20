import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414203";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Levels (blocks above lowest ground)
const GROUND_TOP = 4;   // ground floor occupies base..4, lintel at 4
const FLOOR_2 = 5;      // floor slab / string course
const UPPER_TOP = 8;    // upper storey occupies 6..8
const DECK = 9;         // cornice / roof deck
const PARAPET = 10;     // parapet wall 10, cap 11
const ROOF_TOP = 11;

const key = (x, z) => `${x},${z}`;
const grounds = new Map();
let minG = Infinity;
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  grounds.set(key(x, z), gr);
  if (gr < minG) minG = gr;
}
for (const [k, gr] of grounds) grounds.set(k, Math.max(0, Math.round(gr - minG)));

const has = (x, z) => grounds.has(key(x, z));
const put = (x, y, z, id, st) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Which outward face a perimeter cell shows, and its position along that face.
function facade(x, z) {
  if (!has(x, z - 1)) return { face: "N", u: x, out: "north" };
  if (!has(x, z + 1)) return { face: "S", u: x, out: "south" };
  if (!has(x - 1, z)) return { face: "W", u: z, out: "west" };
  if (!has(x + 1, z)) return { face: "E", u: z, out: "east" };
  return null;
}

const faceIndex = { N: 0, S: 1, W: 2, E: 3 };
const GLASS_SHOP = "light_blue_stained_glass";
const GLASS_UP = "gray_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const STRING = "smooth_stone";
const DOOR = "oak_door";

for (const [k, base] of grounds) {
  const [x, z] = k.split(",").map(Number);
  const fc = facade(x, z);
  const perimeter = fc !== null;

  // Foundation under the cell, so nothing floats on the slope.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Floor slab at storey line, roof deck, parapet cap. Interior has no rooms, just slabs.
  if (FLOOR_2 >= base) put(x, FLOOR_2, z, perimeter ? STRING : SPANDREL);
  if (DECK >= base) put(x, DECK, z, perimeter ? STRING : "gray_concrete");

  if (perimeter) {
    const { face, u, out } = fc;
    const fi = faceIndex[face];
    const isDoorCell = face === "S" && u === 8;

    // Ground floor shopfront
    for (let y = base; y <= GROUND_TOP; y++) {
      if (y < base) continue;
      if (isDoorCell && y === base) {
        put(x, y, z, DOOR, { facing: out, half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoorCell && y === base + 1) {
        put(x, y, z, DOOR, { facing: out, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === base) { put(x, y, z, "stone_bricks"); continue; }
      if (y === GROUND_TOP) { put(x, y, z, SPANDREL); continue; }
      if (u % 3 === 0) { put(x, y, z, PIER); continue; }
      if (isDoorCell && y >= base + 2) { put(x, y, z, PIER); continue; }
      put(x, y, z, GLASS_SHOP);
    }

    // Upper storey windows with spandrels and a few lit rooms
    for (let y = FLOOR_2 + 1; y <= UPPER_TOP; y++) {
      if (y < base) continue;
      if (u % 3 === 0) { put(x, y, z, PIER); continue; }
      if (y === 7) { put(x, y, z, SPANDREL); continue; }
      if (y === 8 && (u * 5 + fi * 3) % 7 === 0) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, GLASS_UP);
    }

    // Cornice line already placed at DECK; parapet and cap
    if (PARAPET >= base) put(x, PARAPET, z, PIER);
    if (ROOF_TOP >= base) put(x, ROOF_TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior roof surface and equipment
    if (x >= 12 && x <= 13 && z >= 3 && z <= 4) {
      if (PARAPET >= base) put(x, PARAPET, z, "iron_block");
      if (ROOF_TOP >= base) put(x, ROOF_TOP, z, "iron_block");
    } else if (x >= 3 && x <= 4 && z >= 12 && z <= 13) {
      if (PARAPET >= base) put(x, PARAPET, z, "stone_bricks");
      if (ROOF_TOP >= base) put(x, ROOF_TOP, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
