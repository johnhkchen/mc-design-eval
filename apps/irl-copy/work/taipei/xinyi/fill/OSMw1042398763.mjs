import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042398763";
const W = 26, H = 23, D = 13;

// Taipei late-1980s/1990s commercial low-rise: two storeys of shopfront and
// office, white tiled walls, red sign band at street level, blue-tinted glazing
// in grey frames, flat roof with a cornice and small plant on top.
const WALL = "smooth_quartz";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const FRAME = "gray_concrete";
const SIGN = "red_concrete";
const SLAB = "smooth_quartz";
const ROOF = "light_gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => g.set(x, y, z, name, props);

// Storey lines (absolute): ground storey 0-4, upper storey 6-8, cornice 10.
const FLOOR_1 = 5;
const CORNICE = 10;

for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);
  const front = !has(x, z - 1);                  // street facade on the north edge
  const onXFace = !has(x, z - 1) || !has(x, z + 1);
  const u = onXFace ? x : z;                     // bay index along the facade

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  for (let y = gr; y <= CORNICE; y++) {
    if (!per) {
      // Interior: floor slabs and roof deck only; air elsewhere (no interiors).
      if (y === gr || y === FLOOR_1) put(x, y, z, SLAB);
      else if (y === CORNICE) put(x, y, z, ROOF);
      continue;
    }

    // Perimeter shell.
    if (y === gr) { put(x, y, z, BASE); continue; }
    if (y === CORNICE) { put(x, y, z, WALL); continue; }   // cornice / parapet
    if (y === 9) { put(x, y, z, WALL); continue; }          // upper lintel band
    if (y === FLOOR_1) { put(x, y, z, WALL); continue; }    // storey line
    if (y === 4) { put(x, y, z, front ? SIGN : WALL); continue; } // sign band
    if (y >= 6 && y <= 8) {
      put(x, y, z, u % 3 !== 0 ? GLASS : FRAME);
      continue;
    }

    // Ground storey shopfront: y gr+1 .. 3.
    if (y >= gr + 1 && y <= 3) {
      if (front && u === 12) {
        if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        continue;
      }
      if (u % 3 === 0) put(x, y, z, WALL);   // pillar between shop bays
      else put(x, y, z, GLASS);
    }
  }
}

// Roof plant: two AC boxes and a small leafy planter on the roof deck.
const plant = [
  [4, 3, "light_gray_concrete"], [5, 3, "light_gray_concrete"],
  [4, 4, "light_gray_concrete"], [5, 4, "light_gray_concrete"],
  [20, 8, "oak_leaves"], [21, 8, "oak_leaves"],
  [20, 9, "oak_leaves"], [21, 9, "oak_leaves"],
];
for (const [x, z, name] of plant) {
  if (!has(x, z) || isPerim(x, z)) continue;
  const gr = gAt(x, z);
  if (gr > CORNICE) continue;
  const props = name === "oak_leaves" ? { distance: "7", persistent: "true", waterlogged: "false" } : undefined;
  put(x, CORNICE + 1, z, name, props);
}

// Warm glow behind some upper windows on the street face (air gap at z = 1).
for (let x = 0; x < W; x++) {
  if (has(x, 1) && !isPerim(x, 1) && x % 6 === 4) put(x, 7, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
