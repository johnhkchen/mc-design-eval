import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise: a two-storey 1980s-90s Xinyi commercial block.
// White tiled wall, light grey bands at storey lines, blue glazing, a
// shopfront on the ground floor, a flat roof with a stone cornice and
// parapet, and a few HVAC boxes on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401870";
const W = 24, H = 23, D = 14;
const ROOF = 11;     // roof surface, blocks above lowest ground
const PARAPET = 12;  // top of the parapet
const BAND_LO = 5;   // first storey line
const BAND_HI = 10;  // second storey line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inF = (x, z) => ground.has(`${x},${z}`);
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outN = (x, z) => NEIGH.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isPerim = (x, z) => outN(x, z).length > 0;

// Window grid: every third column on the faces, pillars at the corners.
function isWindow(x, z) {
  const out = outN(x, z);
  if (out.length === 0 || out.length >= 2) return false;
  const [dx, dz] = out[0];
  const idx = dz !== 0 ? x : z;
  return idx % 3 === 1;
}

const g = new Voxels([W, H, D]);

const set = (x, y, z, id) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");

  const perim = isPerim(x, z);
  const out = outN(x, z);
  const isFront = out.some(([dx, dz]) => dx === 0 && dz === -1);
  const isCorner = out.length >= 2;

  // Interior floor slabs (no interiors; air gap behind the glass).
  if (!perim) {
    if (gr <= gr) set(x, gr, z, "light_gray_concrete"); // ground floor slab
    for (const yy of [BAND_LO, BAND_HI]) {
      if (yy >= gr) set(x, yy, z, "smooth_stone");
    }
    // Roof deck on interior cells
    if (ROOF >= gr) set(x, ROOF, z, "gray_concrete");
    // Sparse HVAC boxes on the roof
    if (x % 5 === 2 && z % 4 === 2 && ROOF >= gr) {
      set(x, PARAPET, z, "iron_block");
    }
    continue;
  }

  // Perimeter wall, from its ground up to the parapet.
  for (let y = gr; y <= PARAPET; y++) {
    if (y <= BAND_LO - 1) {
      // Ground storey: shopfront or base course
      const isDoor = isFront && (x === 11 || x === 12) && gr <= 4 && y <= gr + 1;
      if (isDoor) {
        const half = y === gr ? "lower" : "upper";
        // Door handled as a block id; facing and half are applied by the
        // Voxels set call's third argument form.
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isCorner) {
        set(x, y, z, "polished_andesite");
      } else if (isWindow(x, z)) {
        set(x, y, z, "light_blue_stained_glass");
      } else if (y === gr) {
        set(x, y, z, "stone_bricks");
      } else {
        set(x, y, z, "polished_andesite");
      }
    } else if (y === BAND_LO) {
      set(x, y, z, "light_gray_concrete");
    } else if (y < BAND_HI) {
      // Upper storey windows with pillars between them
      if (!isCorner && isWindow(x, z)) {
        set(x, y, z, "light_blue_stained_glass");
      } else {
        set(x, y, z, "white_concrete");
      }
    } else if (y === BAND_HI) {
      set(x, y, z, "light_gray_concrete");
    } else if (y === ROOF) {
      set(x, y, z, "smooth_stone"); // cornice
    } else if (y === PARAPET) {
      set(x, y, z, "white_concrete");
    }
  }
}

// Warm light behind some upper-storey windows: glowstone set in the air gap
// one cell inside the glass.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  if (!isWindow(x, z)) continue;
  if (x % 6 !== 1 && z % 6 !== 1) continue;
  const out = outN(x, z);
  if (out.length !== 1) continue;
  const [odx, odz] = out[0];
  const ix = x - odx, iz = z - odz;
  if (!inF(ix, iz)) continue;
  if (isPerim(ix, iz)) continue;
  if (gr > 7) continue;
  set(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
