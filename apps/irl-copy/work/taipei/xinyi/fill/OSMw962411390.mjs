import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise commercial block, Xinyi district, c. 1995-2005:
// two storeys of quartz-clad walls on a granite base, cyan glass bays,
// a shopfront ground floor with a central entrance, and a stone cornice
// and parapet at roof height (y 11).
const W = 22, H = 23, D = 16;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw962411390.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw962411390.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey lines (absolute): floor course y5, cornice y10, parapet y11.
const FLOOR_Y = 5, ROOF_Y = 10, PARAPET_Y = 11;

// Front (north) entrance: middle of the north-facing run.
const northXs = cells.filter(([x, z]) => !has(x, z - 1)).map(c => c[0]).sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : null;

// Foundation, floors and roof per cell.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  for (let y = 0; y < gg; y++) put(x, y, z, "stone");
  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (!perimeter) {
    if (gg <= FLOOR_Y) put(x, FLOOR_Y, z, "stone_bricks");
    if (gg <= ROOF_Y) put(x, ROOF_Y, z, "stone_bricks");
  }
}

// Perimeter walls, bays, base course, cornice and parapet.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  const faces = [];
  if (!has(x, z - 1)) faces.push({ n: "north", rel: x - minX, dz: 1 });
  if (!has(x, z + 1)) faces.push({ n: "south", rel: x - minX, dz: -1 });
  if (!has(x - 1, z)) faces.push({ n: "west", rel: z - minZ, dx: 1 });
  if (!has(x + 1, z)) faces.push({ n: "east", rel: z - minZ, dx: -1 });
  if (faces.length === 0) continue;

  const isWindowBay = faces.some(f => f.rel % 3 !== 0);
  const isFront = faces.some(f => f.n === "north");
  const isEntrance = isFront && x === entranceX;

  for (let y = gg; y <= PARAPET_Y; y++) {
    let id = "smooth_quartz";
    if (y === gg) id = "polished_granite";
    else if (y === FLOOR_Y) id = "stone_bricks";
    else if (y === ROOF_Y) id = "stone_bricks";
    else if (y === PARAPET_Y) id = "smooth_quartz";
    else if (y <= 4 && isWindowBay && y >= gg + 1 && y <= 3) id = "cyan_stained_glass";
    else if (y <= 4 && isWindowBay && y === 4) id = "smooth_quartz";
    else if (y >= 6 && y <= 8 && isWindowBay) id = "cyan_stained_glass";
    put(x, y, z, id);
  }

  // Entrance: double-height door opening with a stone canopy band above.
  if (isEntrance && gg + 2 <= 4) {
    put(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gg + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gg + 3 <= 4) put(x, gg + 3, z, "polished_granite");
  }

  // Warm light behind selected upper-storey windows (interior air cell).
  for (const f of faces) {
    if (f.dz === undefined && f.dx === undefined) continue;
    if (f.rel % 3 === 0 || f.rel % 6 !== 2) continue;
    const ix = x + (f.dx || 0), iz = z + (f.dz || 0);
    if (has(ix, iz) && (gAt(ix, iz) ?? 99) <= 7) put(ix, 7, iz, "glowstone");
  }
}

// Roof plant on interior roof cells (all four neighbours in footprint).
const interior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
for (const x of [5, 6]) for (const z of [5, 6]) if (interior(x, z)) put(x, PARAPET_Y, z, "light_gray_concrete");
for (const x of [15, 16]) for (const z of [9, 10]) if (interior(x, z)) put(x, PARAPET_Y, z, "iron_block");
if (interior(10, 7)) put(10, PARAPET_Y, 7, "lightning_rod");

g.save(OUT);
