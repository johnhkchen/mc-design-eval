import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752138";
const W = 40, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Low-rise commercial block, c. 1980s-90s Taipei: stone plinth, white tiled
// walls, pilastered bays with blue glass, quartz storey bands, flat roof with
// parapet and rooftop plant.
const ROOF = 11;   // roof deck (interior) at y=11
const PARA = 12;   // parapet cap on exterior walls
const BAND_A = 5;  // storey line
const BAND_B = 10; // storey line / cornice

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // north, south, west, east

const fp = new Map();
for (const [x, z, gr] of cells) {
  fp.set(x + "," + z, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => fp.has(x + "," + z);
const groundAt = (x, z) => fp.get(x + "," + z);
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Pass 1: classify edge cells (for lights placed in interiors)
const edgeSet = new Set();
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).length > 0) edgeSet.add(key);
}

const wallBlock = (x, y, z, gr, dx, dz) => {
  // u runs along the facade; z-facing faces run along x, x-facing along z
  const u = dz !== 0 ? x : z;
  const bay = ((u % 4) + 4) % 4;

  if (y === gr) return { b: "stone_bricks" };          // plinth course
  if (y === PARA) return { b: "smooth_quartz" };        // parapet cap
  if (y === BAND_B || y === ROOF) return { b: "smooth_quartz" }; // cornice
  if (y === BAND_A) return { b: "smooth_quartz" };      // storey line

  // Ground storey (gr < y < 5): shopfront
  if (y < BAND_A) {
    // Entrance on north (z-min) face, centred at x=20
    if (dz === -1 && gr <= 2 && y >= gr + 1 && y <= gr + 2 && x >= 19 && x <= 21) {
      if (x === 20) {
        const half = y === gr + 1 ? "lower" : "upper";
        return {
          b: "dark_oak_door",
          p: { facing: "north", half, hinge: "left", open: "false", powered: "false" },
        };
      }
      return { b: "glass" };
    }
    if (dz === -1 && gr <= 3 && y === 4 && x >= 18 && x <= 22) {
      return { b: "dark_oak_planks" }; // entrance canopy
    }
    if (bay === 0) return { b: "smooth_quartz" };
    if (bay === 3) return { b: "white_terracotta" };
    return { b: "glass" };
  }

  // Upper storey (5 < y < 10)
  if (bay === 0) return { b: "smooth_quartz" };
  if (bay === 3) return { b: "white_terracotta" };
  return { b: "light_blue_stained_glass" };
};

// Pass 2: build
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y=0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior cell: floor slabs at each storey, roof deck, no walls
    const floors = [gr, BAND_A, BAND_B].filter((v, i, a) => v >= gr && a.indexOf(v) === i);
    for (const f of floors) put(x, f, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");

    // Rooftop plant boxes on a grid
    if (x % 7 === 3 && z % 5 === 2) {
      put(x, PARA, z, "light_gray_concrete");
      put(x, PARA + 1, z, "iron_bars");
    }
  } else {
    // Edge cell: solid wall from ground to parapet, pattern on first exposed face
    const [dx, dz] = ex[0];
    for (let y = gr; y <= PARA; y++) {
      const w = wallBlock(x, y, z, gr, dx, dz);
      if (!w) continue;
      put(x, y, z, w.b, w.p);
    }
    // Floor slabs inside are handled by interior cells; ensure ground floor
    // slab exists at this edge too so the storey reads continuous.
    put(x, gr, z, "smooth_quartz");
  }
}

// Pass 3: warm lights behind some upper-storey windows (air gap behind glass)
for (const key of edgeSet) {
  const [x, z] = key.split(",").map(Number);
  const gr = groundAt(x, z);
  const ex = exposed(x, z);
  const [dx, dz] = ex[0];
  const u = dz !== 0 ? x : z;
  if (((u % 4) + 4) % 4 !== 1) continue;
  const y = 7;
  if (y <= gr) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || edgeSet.has(ix + "," + iz)) continue;
  if (u % 8 !== 1) continue; // every other bay
  put(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
