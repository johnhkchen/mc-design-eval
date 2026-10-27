// Bayleys House (way 497604535), Auckland CBD: a c.1980s concrete-frame office block, 7 storeys on a 4-block storey grid
// (about 27.5 m to the cap at y 32). A 1-block shell: a white-concrete frame with floor lines and piers every 3 blocks,
// cyan glass in the window zone with a spandrel band, and a polished-andesite base course. Ground storey is a shopfront
// (light-blue glass, fascia band) with a north entrance (oak door under the annex's flat roof, the canopy). The lidar's
// roof readings are quantised into three tiers: main block at 32, an east wing (lidar 21-29) at 27, and a one-storey annex
// (lidar under 12) at 5. The top band (4 blocks in the main block) is a solid plant screen under a smooth-stone cap, with
// a small plant box on the roof. Interiors are air behind the glass: a slab per storey, a column grid for the floors, and
// glowstone behind some windows. Every storey sits on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_497604535.cells.json`, "utf8"));
const X = 53, Y = 45, Z = 62;

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r, H: tierH(r) });

// lidar roof -> tier cap (y of the top block)
function tierH(r) {
  if (r >= 30) return 32;     // main block
  if (r >= 20) return 27;     // east wing (lidar 21-29)
  if (r >= 12) return 14;
  return 5;                   // annex and porch
}
const cell = (x, z) => fp.get(key(x, z));

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// the faces a cell shows at height y: outside the footprint, or above a lower neighbour's cap
function exposures(x, z, y) {
  const out = [];
  for (const [name, dx, dz] of DIRS) {
    const n = cell(x + dx, z + dz);
    if (!n || y > n.H) out.push([name, dx, dz]);
  }
  return out;
}

const v = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => v.set(x, y, z, block, state);
// a pane joins along its wall: a north/south face runs east-west (east/west arms), an east/west face runs north-south
const PANE = (dirs, block) => {
  const eastWest = dirs.some(([, dx]) => dx === 0);
  return [block, eastWest ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
};

// base pass: foundation, frame, window zone, shopfront, storey slabs, cap
const interiorCols = (x, z) => x % 6 === 3 && z % 6 === 3;
for (const [k, { g, H }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const T = g + 4 * Math.floor((H - g) / 4);   // top band starts here (solid plant screen / parapet)
  for (let y = 0; y < g; y++) set(x, y, z, "polished_andesite");      // foundation to the cell's ground
  for (let y = g; y < H; y++) {
    const ex = exposures(x, z, y);
    const perim = ex.length > 0;
    if (y >= T) { // top band
      if (perim) {
        const along = ex[0][1] ? z : x;
        set(x, y, z, along % 3 === 0 ? "white_concrete" : "light_gray_concrete");
      } else set(x, y, z, "light_gray_concrete");
      continue;
    }
    const rel = (y - g) % 4, s = Math.floor((y - g) / 4);
    if (!perim && interiorCols(x, z)) { set(x, y, z, "white_concrete"); continue; }   // column grid holds the floors
    if (rel === 0) {                                  // storey line / slab
      set(x, y, z, perim ? (s === 0 ? "polished_andesite" : "white_concrete") : "light_gray_concrete");
      continue;
    }
    if (!perim) continue;                             // interior: air behind the glass
    const [name, dx, dz] = ex[0];
    const along = dz ? x : z;
    const corner = ex.some(([, ddx, ddz]) => (ddx && dz) || (ddz && dx));
    if (corner || along % 3 === 0) { set(x, y, z, "white_concrete"); continue; }   // piers
    if (s === 0 && rel === 3) { set(x, y, z, "smooth_stone"); continue; }          // shopfront fascia
    if (rel === 3) { set(x, y, z, "light_gray_concrete"); continue; }               // spandrel
    const [block, st] = PANE(ex, s === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane");
    set(x, y, z, block, st);
  }
  set(x, H, z, "smooth_stone");                      // cap (roof / cornice)
}

// plant box on the main roof (roof equipment above the lidar cap, a solid screen)
for (let x = 20; x <= 30; x++) for (let z = 24; z <= 34; z++) {
  const c = cell(x, z); if (!c || c.H !== 32) continue;
  const edge = x === 20 || x === 30 || z === 24 || z === 34;
  for (let y = 33; y <= 34; y++) set(x, y, z, edge && (x - 20) % 3 === 0 ? "white_concrete" : "light_gray_concrete");
  set(x, 35, z, "smooth_stone");
}

// glowstone behind some glass on the lit storeys (the inner air cell of a window)
for (const [k, { g, H }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const T = g + 4 * Math.floor((H - g) / 4);
  for (let y = g + 2; y < T; y += 4) {
    const ex = exposures(x, z, y);
    if (!ex.length) continue;
    const [, dx, dz] = ex[0];
    const along = dz ? x : z, s = Math.floor((y - g) / 4);
    if ((along + s) % 5 !== 2 || along % 3 === 0) continue;
    const ix = x - dx, iz = z - dz, inn = cell(ix, iz);
    if (!inn || inn.H <= y || exposures(ix, iz, y).length) continue;
    set(ix, y, iz, "glowstone");
  }
}

// north entrance through the annex (the door cell's north face), oak door under its flat roof
const door = (y, half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
set(18, 2, 0, "oak_door", door(2, "lower"));
set(18, 3, 0, "oak_door", door(3, "upper"));

const out = `${DIR}/way_497604535.nbt`;
const r = v.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
