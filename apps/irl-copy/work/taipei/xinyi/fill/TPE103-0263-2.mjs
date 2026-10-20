import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0263-2";
const W = 5, H = 23, D = 19;
const ROOF = 11;          // roof surface about 11 blocks above lowest ground
const STOREY1_TOP = 4;    // ground storey window head row
const BAND_Y = 5;         // storey line between floors
const STOREY2_WIN = [6, 9];
const DECK_Y = 10;        // roof deck
const PARAPET_Y = 11;
const COPING_Y = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

const paneSide = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneFront = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";
const SPANDREL = "white_concrete";   // wall between windows
const PIER = "light_gray_concrete";   // vertical piers, reads as depth against the spandrels
const SILL = "smooth_stone_slab";

function glazedRow(y) {
  if (y >= 1 && y <= STOREY1_TOP) return true;
  if (y >= STOREY2_WIN[0] && y <= STOREY2_WIN[1]) return true;
  return false;
}

function placeWall(x, y, z, g0) {
  // Long side faces on x = 0 and x = 4
  if (z !== 0 && z !== 18 && (x === 0 || x === 4)) {
    const pier = z % 3 === 0;
    if (!pier && glazedRow(y)) {
      g.set(x, y, z, GLASS, paneSide);
    } else {
      g.set(x, y, z, pier ? PIER : SPANDREL);
    }
    return;
  }
  // Front (shopfront and entrance) at z = 0
  if (z === 0) {
    if (y >= g0 + 1 && y <= STOREY1_TOP) {
      if (y === g0 + 3) { g.set(x, y, z, "black_concrete"); return; }
      if (y <= g0 + 2) {
        if (x === 2) return; // door handled separately
        if (x === 0 || x === 4) g.set(x, y, z, PIER);
        else g.set(x, y, z, GLASS, paneFront);
        return;
      }
      g.set(x, y, z, SPANDREL);
      return;
    }
    if (y >= STOREY2_WIN[0] && y <= STOREY2_WIN[1] && x >= 1 && x <= 3) {
      g.set(x, y, z, GLASS, paneFront);
      return;
    }
    g.set(x, y, z, x === 0 || x === 4 ? PIER : SPANDREL);
    return;
  }
  // Back at z = 18
  if (z === 18) {
    if (glazedRow(y) && x >= 1 && x <= 3) g.set(x, y, z, GLASS, paneFront);
    else g.set(x, y, z, x === 0 || x === 4 ? PIER : SPANDREL);
  }
}

// Foundations, floors, walls, roof
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  if (gr < BAND_Y) {
    g.set(x, BAND_Y, z, edge ? "light_gray_concrete" : "smooth_stone");
    if (edge) {
      for (let y = gr + 1; y < BAND_Y; y++) placeWall(x, y, z, gr);
      for (let y = BAND_Y + 1; y < DECK_Y; y++) placeWall(x, y, z, gr);
    }
  }

  g.set(x, DECK_Y, z, "light_gray_concrete");

  if (edge) {
    g.set(x, PARAPET_Y, z, PIER);
    g.set(x, COPING_Y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Window sills on the long sides: a slab course under each lower glazing row
for (const [x, z, gr] of cells) {
  if (z === 0 || z === 18 || !(x === 0 || x === 4)) continue;
  if (z % 3 === 0) continue;
  const sillY = gr + 1;
  if (sillY <= STOREY1_TOP && has(x, z)) {
    // Sill sits on the glazing base, outside the glass plane but inside the footprint
    g.set(x === 0 ? 1 : 3, sillY - 1 < gr ? gr : sillY - 1, z, SILL, { type: "top", waterlogged: "false" });
  }
}

// Entrance door on the front face
if (has(2, 0)) {
  const gr = gAt(2, 0);
  g.set(2, gr + 1, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, gr + 2, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind glass: upper storey windows on the long sides
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (z === 0 || z === 18) continue;
  if ((x === 0 || x === 4) && z % 6 === 1) {
    g.set(x === 0 ? 1 : 3, 8, z, "glowstone");
  }
}

// Warm light in the shopfront
if (has(1, 0) && gAt(1, 0) + 1 <= STOREY1_TOP) g.set(1, gAt(1, 0) + 1, 1, "glowstone");
if (has(3, 0) && gAt(3, 0) + 1 <= STOREY1_TOP) g.set(3, gAt(3, 0) + 1, 1, "glowstone");

// Roof plant: a stepped box on the deck
for (let x = 1; x <= 3; x++) {
  for (let z = 6; z <= 8; z++) {
    if (has(x, z)) g.set(x, PARAPET_Y, z, "light_gray_concrete");
  }
}
if (has(2, 7)) g.set(2, COPING_Y, 7, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
