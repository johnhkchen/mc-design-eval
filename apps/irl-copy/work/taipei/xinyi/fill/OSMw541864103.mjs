import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 11 x 14 footprint, roof ~11 blocks above lowest ground.
// Read as a 1980s two-storey white-tile commercial block: stone plinth,
// shopfront with a central door on the street (z = 0) face, tinted glass
// windows in storeys of 5 blocks, smooth-stone storey bands and cornice,
// white parapet, flat roof with plant boxes.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541864103.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541864103.nbt";

const W = 11, H = 23, D = 14;
const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const inFP = (x, z) => ground.has(key(x, z));
const F = Math.min(...ground.values());   // floor level = lowest ground
const TOP = F + 11;                        // parapet top

const isInterior = (x, z) => inFP(x, z) && inFP(x - 1, z) && inFP(x + 1, z) && inFP(x, z - 1) && inFP(x, z + 1);
const faces = (x, z) => ({
  front: !inFP(x, z - 1),   // z = 0 side, street facade
  back: !inFP(x, z + 1),
  west: !inFP(x - 1, z),
  east: !inFP(x + 1, z),
});

// Bounds- and footprint-checked setter.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inFP(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (axis) => axis === "ew"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const BAND = "smooth_stone";
const PLINTH = "stone_bricks";
const FLOOR = "gray_concrete";

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, PLINTH);
}

// 2. Interior: floor slabs, air-gap rooms, mid-floor slab, roof deck.
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  put(x, F, z, FLOOR);
  for (let rel = 1; rel <= 9; rel++) {
    if (rel === 5) put(x, F + rel, z, FLOOR);
    else put(x, F + rel, z, "air");
  }
  put(x, F + 10, z, FLOOR);
}

// 3. Perimeter shell.
for (const [x, z] of cells) {
  if (isInterior(x, z)) continue;
  const f = faces(x, z);
  const ns = f.front || f.back;
  const ew = f.west || f.east;
  const corner = ns && ew;
  const idx = ns && !ew ? x : z;           // position along the face
  const isWin = !corner && idx % 2 === 1;  // window bays on odd indices
  const axis = ns ? "ew" : "ns";
  const isShop = f.front && z === 0 && !corner;

  for (let rel = 0; rel <= 11; rel++) {
    const y = F + rel;
    if (rel === 0) { put(x, y, z, PLINTH); continue; }
    if (rel === 5) { put(x, y, z, BAND); continue; }
    if (rel === 10) { put(x, y, z, BAND); continue; }
    if (rel === 11) { put(x, y, z, WALL); continue; }

    if (rel <= 4) {
      // Ground storey
      if (isShop) {
        if (rel === 4) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
        if (x === 5) {
          if (rel === 1) { put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (rel === 2) { put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          put(x, y, z, GLASS, paneProps("ew")); continue;
        }
        if (x === 3 || x === 7) { put(x, y, z, BAND); continue; }
        put(x, y, z, GLASS, paneProps("ew")); continue;
      }
      if (isWin && rel <= 3) { put(x, y, z, GLASS, paneProps(axis)); continue; }
      put(x, y, z, WALL);
      continue;
    }

    // Upper storey (rel 6..9)
    if (isWin && rel <= 8) { put(x, y, z, GLASS, paneProps(axis)); continue; }
    put(x, y, z, WALL);
  }
}

// 4. Warm lights behind some glass (only in interior air cells).
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if (z === 1 && (x === 2 || x === 8)) put(x, F + 2, z, "glowstone");
  if (z === 1 && (x === 4 || x === 8)) put(x, F + 7, z, "shroomlight");
}

// 5. Roof equipment on the deck: plant boxes and a vent (only over interior cells).
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if (x >= 2 && x <= 4 && z >= 6 && z <= 7) put(x, TOP, z, "light_gray_concrete");
  if (x === 8 && z === 10) put(x, TOP, z, "iron_block");
}

g.save(OUT);
