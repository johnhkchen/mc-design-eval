// Record: no name. Footprint 22 x 20, roof ~26 blocks above lowest ground.
// Read as a Xinyi-district office/retail block of the 1990s: five storeys of
// 5 blocks each, a granite base with a shopfront, a white-concrete pier and
// light-grey spandrel grid, blue-tinted glass in between, a stone cornice and
// parapet, a central entrance with a lintel and hanging lantern, warm
// glowstone behind some windows, and a rooftop plant box.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292944";

const W = 22, H = 38, D = 20;
const ROOF = 26;      // parapet top, absolute y
const DECK = 25;      // roof deck / cornice level
const STOREY = 5;     // blocks per storey
const FLOORS = 5;

const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// footprint -> ground height
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), Math.round(gr));
}
const inF = (x, z) => G.has(key(x, z));

// outward directions where the neighbour is missing
function outwardFaces(x, z) {
  const f = [];
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  return f;
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade on a single outward face
function facade(x, z, dir, gr) {
  const alongX = dir === "N" || dir === "S";
  const along = alongX ? x : z;
  const center = Math.floor(W / 2);
  // entrance on the south face, two cells wide, near the middle of the footprint
  const entrance = dir === "S" && alongX && (along === center - 1 || along === center);
  // inward neighbour for lighting
  const dx = dir === "W" ? 1 : dir === "E" ? -1 : 0;
  const dz = dir === "N" ? 1 : dir === "S" ? -1 : 0;
  const hasInside = inF(x + dx, z + dz);
  const pier = along % 3 === 0;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { set(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === DECK) { set(x, y, z, "stone_bricks"); continue; }     // cornice
    if (y === gr) { set(x, y, z, "polished_granite"); continue; }   // base course
    const fl = Math.floor(y / STOREY);
    const r = y % STOREY;
    if (fl === 0) {
      // ground floor shopfront
      if (r === 4) {
        set(x, y, z, entrance ? "smooth_stone" : "light_gray_concrete");
      } else if (entrance) {
        if (y === 3 && along === center) set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        // otherwise air: the opening
      } else {
        set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
      continue;
    }
    if (r === 0 || r === 4) {
      set(x, y, z, "light_gray_concrete");   // floor line and sill spandrels
    } else {
      // window zone
      if (pier) {
        set(x, y, z, "white_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass");
        if (hasInside && r === 2 && (along + fl) % 4 === 0) {
          set(x + dx, y, z + dz, "glowstone");
        }
      }
    }
  }
}

// Main footprint pass
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  // foundation
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);

  if (faces.length === 0) {
    // interior: floor slabs per storey, air between, roof deck on top
    set(x, gr, z, "smooth_stone");
    for (let k2 = 1; k2 < FLOORS; k2++) {
      const yb = k2 * STOREY;
      if (yb > gr && yb < DECK) set(x, yb, z, "smooth_stone");
    }
    if (gr <= DECK) set(x, DECK, z, "gray_concrete");
  } else if (faces.length === 1) {
    facade(x, z, faces[0], gr);
  } else {
    // corner: full concrete pier
    set(x, gr, z, "polished_granite");
    for (let y = gr + 1; y <= ROOF; y++) {
      set(x, y, z, y === DECK ? "stone_bricks" : "white_concrete");
    }
  }
}

// Rooftop plant box, sitting on the deck in the middle of the roof
for (let x = 7; x <= 14; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!inF(x, z) || outwardFaces(x, z).length > 0) continue;
    const gr = G.get(key(x, z));
    if (gr > DECK) continue;
    set(x, ROOF, z, "light_gray_concrete");
    set(x, ROOF + 1, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
    set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${BASE}/${ID}.nbt`);
