import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169540";
const W = 20, H = 25, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const L = Math.min(...G.values());          // lowest ground under the footprint
const ROOF = L + 13;                        // parapet cap level (lidar roof height)

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Storey lines (relative to L):
//  ground storey : off 0 base, 1-3 glazing band, 4 lintel, 5 wall, 6 belt course
//  upper storey  : off 7 sill, 8-10 glazing band, 11 lintel
//  cornice 12, parapet cap 13 (roof deck at off 12 over the whole footprint)
const GROUND_BAND = [1, 2, 3];
const UPPER_BAND = [8, 9, 10];

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck over every footprint cell
  put(x, L + 12, z, "light_gray_concrete");

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exterior = exN || exS || exW || exE;

  if (!exterior) {
    // Interior: only the storey-line floor slab, no walls, air otherwise
    if (gr <= L + 6) put(x, L + 6, z, "smooth_stone");
    continue;
  }

  const corner = (exN || exS) && (exW || exE);
  const alongX = exN || exS;                // face runs along x
  const face = exN ? "N" : exS ? "S" : exW ? "W" : "E";
  const p = alongX ? x : z;                 // position along the face
  const isWindowCol = p % 3 === 1;
  // Inward neighbour, used for interior lights behind glass
  const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] };
  const doorCell = face === "S" && !corner && p === Math.floor(W / 2);

  for (let y = gr; y <= ROOF; y++) {
    const off = y - L;
    let id = "quartz_block", props = null;

    if (corner) {
      id = "quartz_pillar";
      props = { axis: "y" };
    } else if (off === 0) {
      id = "polished_andesite";
    } else if (off === 4 || off === 11) {
      id = "smooth_stone";                  // lintels
    } else if (off === 6) {
      id = "smooth_stone";                  // storey belt course
    } else if (off === 7) {
      id = "quartz_block";                  // upper sill
    } else if (off === 12) {
      id = "smooth_stone";                  // cornice
    } else if (off === ROOF - L) {
      id = "smooth_stone_slab";             // parapet cap
      props = { type: "bottom", waterlogged: "false" };
    } else if (off === 5 && !isWindowCol) {
      id = "quartz_block";
    } else if (GROUND_BAND.includes(off) || UPPER_BAND.includes(off)) {
      const ground = GROUND_BAND.includes(off);
      if (doorCell && ground && off <= 2) {
        id = "dark_oak_door";
        props = {
          facing: "south",
          half: off === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (isWindowCol) {
        id = ground ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
        const ns = alongX;
        props = {
          north: ns ? "true" : "false",
          south: ns ? "true" : "false",
          east: ns ? "false" : "true",
          west: ns ? "false" : "true",
          waterlogged: "false",
        };
      } else {
        id = ground ? "quartz_block" : "quartz_block";
      }
    }

    put(x, y, z, id, props);
  }

  // Warm lights behind some glazing (inner cell, middle of each band)
  if (!corner && isWindowCol && !doorCell) {
    const [ix, iz] = inward[face];
    if (has(ix, iz) && (p + 1) % 4 === 0) {
      put(ix, L + 2, iz, "glowstone");
    }
    if (has(ix, iz) && (p + 2) % 4 === 0) {
      put(ix, L + 9, iz, "shroomlight");
    }
  }
}

// Rooftop plant room on the interior cells of the roof deck
for (let x = 7; x <= 12; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const exterior = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    if (exterior) continue;
    const edge = x === 7 || x === 12 || z === 4 || z === 8;
    for (let y = L + 13; y <= L + 14; y++) {
      if (edge) put(x, y, z, "light_gray_concrete");
      else if (x === 9 || x === 10) put(x, y, z, "iron_bars");
    }
    put(x, L + 15, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
