import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey cream-tiled concrete annex: stone plinth, shopfront ground floor,
// banded upper storey with pane windows, cornice, parapet, rooftop plant box.
const W = 29, H = 23, D = 19;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121245";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const WALL = "smooth_quartz";
const BAND = "light_gray_concrete";
const PLINTH = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const PANE = "light_blue_stained_glass_pane";
const SHOP = "light_blue_stained_glass";
const PIER = "light_gray_concrete";

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const isIn = (x, z) => fp.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (x, z) => DIRS.some(([dx, dz]) => !isIn(x + dx, z + dz));
const groundAt = (x, z) => fp.get(key(x, z));

const G = Math.min(...fp.values());        // lowest ground under footprint
const ROOF = G + 10;                        // roof slab
const PARAPET = G + 11;                     // top course: roof surface at G+11
const UPPER_FLOOR = G + 5;                  // second-storey floor slab

// 1. Foundations and floor slabs (every footprint cell, nothing floats)
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr - 1; y++) put(x, y, z, FOUND);
  if (gr >= 1) put(x, gr - 1, z, FLOOR);             // ground-floor slab
  if (UPPER_FLOOR >= gr) put(x, UPPER_FLOOR, z, BAND); // upper floor slab
  if (ROOF >= gr) put(x, ROOF, z, BAND);               // roof slab
}

// 2. Facade on perimeter cells, column from own ground up to parapet
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  for (let y = gr; y <= PARAPET; y++) {
    let id = WALL, props;
    if (y === PARAPET) {
      id = WALL;                                         // coping
    } else if (y === ROOF) {
      id = BAND;                                         // cornice band
    } else if (y === gr) {
      id = PLINTH;                                       // base course
    } else if (y >= G && y <= G + 4) {                   // ground storey
      if (y === G + 4) id = WALL;                        // lintel band
      else id = (x + z) % 3 !== 0 ? SHOP : PIER;         // shopfront bays
    } else if (y === G + 5) {
      id = BAND;                                         // storey line
    } else if (y >= G + 6 && y <= G + 9) {               // upper storey
      if (y === G + 6) id = BAND;                        // sill course
      else id = (x + z) % 3 !== 0 ? PANE : PIER;
    }
    put(x, y, z, id, props);
  }
}

// 3. Warm lights behind some glass (interior air cell, one step in)
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  let inward = null;
  for (const [dx, dz] of DIRS) if (isIn(x + dx, z + dz)) { inward = [dx, dz]; break; }
  if (!inward) continue;
  const ix = x + inward[0], iz = z + inward[1];
  if (perim(ix, iz)) continue;
  const ig = groundAt(ix, iz);
  for (const y of [G + 1, G + 2, G + 7, G + 8]) {
    if (y < gr || y < ig) continue;
    if (((x * 5 + z * 7 + y * 3) % 13) !== 0) continue;
    if (y >= G + 6) {
      put(ix, y, iz, "shroomlight");
    } else {
      put(ix, y, iz, "glowstone");
    }
  }
}

// 4. Entrance on the front (highest-z edge near the centre), canopy above
const frontCells = cells.filter(([x]) => x === 14);
if (frontCells.length) {
  const [dx, dz, dg] = frontCells.reduce((a, b) => (b[1] > a[1] ? b : a));
  for (let x = 12; x <= 16; x++) {
    put(x, G + 4, dz, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
  }
  put(dx, dg, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [dx - 1, dx + 1]) {
    if (isIn(x, dz)) {
      put(x, dg, dz, "light_blue_stained_glass");
      put(x, dg + 1, dz, "light_blue_stained_glass");
    }
  }
}

// 5. Rooftop plant room with a vent band (sits on the roof slab, interior)
for (let x = 5; x <= 8; x++) {
  for (let z = 5; z <= 8; z++) {
    if (!isIn(x, z) || groundAt(x, z) > ROOF) continue;
    put(x, PARAPET, z, PIER);
    if (x === 5 || x === 8 || z === 5 || z === 8) put(x, PARAPET + 1, z, WALL);
  }
}
for (let x = 6; x <= 7; x++) for (let z = 6; z <= 7; z++) {
  if (isIn(x, z)) put(x, PARAPET + 1, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
