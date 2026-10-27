// Way 1529525477, Auckland CBD edge seen from Maungawhau: an 8-storey late-20th-century office block on a stone
// plinth. Its footprint steps up to a 9-storey tower core at the north-west and down to a 6-storey wing on the east.
// The lidar roof heights are smoothed into flat tiers (42 body, 47 core, 38 wing, 14 and 8 low edges), with the
// storey datum at 10 (the uphill west ground), so the downhill side shows its plinth as extra storeys. Shell only:
// a floor slab per storey, a one-deep facade ring of cream piers and blue glass with a light band at each storey
// line, air behind the glass, lamps in some windows, parapets and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const ID = "way_1529525477";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const D = 10;                                  // storey datum: the ground floor's slab, level with the west ground
const SIZE = [37, 60, 33];
const GLASS = "light_blue_stained_glass_pane";
const WALLS = new Set(["smooth_quartz", "gray_concrete", "light_gray_concrete", "stone_bricks", "polished_andesite", GLASS]);
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // N E S W
const key = (x, z) => x * 100 + z;
const B = (block, state) => ({ block, state });

// Lidar roof heights (above y 0) smoothed into flat tiers: 45+ tower core, 40-44 body, 30-39 wing, 12-29 low wing.
const tierOf = (r) => (r >= 45 ? 47 : r >= 40 ? 42 : r >= 30 ? 38 : r >= 12 ? 14 : r);
const ground = new Map(), top = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); top.set(key(x, z), tierOf(r)); }
const inF = (x, z) => top.has(key(x, z));
const inS = (x, z, y) => inF(x, z) && top.get(key(x, z)) > y;   // the column still stands at this row
// the faces of a column at row y that look out to air (neighbour absent at this row): indices into DIRS
const exposed = (x, z, y) => DIRS.flatMap(([dx, dz], d) => (inS(x + dx, z + dz, y) ? [] : [d]));

// What stands in one cell of the volume: the plinth below D, the storeys above it, roof on top of each tier.
function cell(x, y, z, T, g) {
  const ex = exposed(x, z, y), per = ex.length > 0, d = ex[0];
  // a fin (pier) on every third cell along the face, and always at a corner; the glass sits between the fins
  const pier = ex.length >= 2 || ((d % 2 === 0 ? x : z) % 3 === 0);
  if (y < D) {                                 // plinth: stone, with basement lights where it stands out of the ground
    if (y === T - 1) return B("smooth_stone");
    if (per && y >= g) {
      if (y === D - 1) return B("polished_andesite");
      if (y === 7) return B("light_gray_concrete");
      if (y === 5 || y === 6) return pier ? B("smooth_quartz") : B(GLASS);
    }
    return B("stone_bricks");
  }
  const b = D + 4 * Math.floor((y - D) / 4), k = y - b;   // storey base row b, storey row k (0 slab, 1-2 window, 3 band)
  if (y === T - 1) return per ? B("stone_bricks") : B("gray_concrete");   // cornice, or the roof deck inside
  if (k === 0) return B("light_gray_concrete");                       // floor slab, the whole footprint
  if (!per) return null;                                              // air behind the glass
  if (k === 3) return B("light_gray_concrete");                       // storey line
  if (b === D) return pier ? B("polished_andesite") : B(GLASS);       // ground floor: shopfront
  return pier ? B("smooth_quartz") : B(GLASS);
}

const put = new Map();                         // "x y z" -> { block, state }
const set = (x, y, z, v) => put.set(`${x} ${y} ${z}`, v);
const at = (x, y, z) => put.get(`${x} ${y} ${z}`);

for (const kk of top.keys()) {
  const x = Math.floor(kk / 100), z = kk % 100, T = top.get(kk), g = ground.get(kk);
  for (let y = 0; y < T; y++) { const v = cell(x, y, z, T, g); if (v) set(x, y, z, v); }
}

// parapets on the outer edge of each body and wing (the tower's edge gets one too)
for (const kk of top.keys()) {
  const x = Math.floor(kk / 100), z = kk % 100, T = top.get(kk);
  if (T > D && DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) set(x, T, z, B("stone_bricks"));
}

// roof plant: boxes on the body roof, a plant room on the tower with a lit crown
const plant = (x0, x1, z0, z1, T, h, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top.get(key(x, z)) === T)
    for (let y = T; y < T + h; y++) set(x, y, z, B(block));
};
plant(13, 18, 4, 7, 42, 2, "light_gray_concrete");
plant(22, 26, 10, 13, 42, 2, "light_gray_concrete");
plant(12, 15, 19, 22, 47, 2, "light_gray_concrete");
plant(12, 15, 19, 22, 49, 1, "stone_bricks");
set(13, 50, 20, B("sea_lantern"));

// entrance on the west face at grade (ground 9-10 there): a door in the glass, a stone hood over it
set(0, 11, 12, B("dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }));
set(0, 12, 12, B("dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }));
for (let z = 11; z <= 13; z++) set(0, 13, z, B("stone_brick_slab", { type: "top", waterlogged: "false" }));

// warm lights: some windows on the first row of a storey have a lamp standing in the room behind them
for (const [k, v] of [...put]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(" ").map(Number);
  if ((y - D) % 4 !== 1 || ((x * 7 + y * 5 + z * 11) % 5) !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inS(nx, nz, y) && exposed(nx, nz, y).length === 0 && !at(nx, y, nz)) {
      set(nx, y, nz, (x + z) % 2 === 0 ? B("lantern", { hanging: "false", waterlogged: "false" }) : B("glowstone"));
      break;
    }
  }
}

// glass panes connect to the wall or fin on each side in their own face
for (const [k, v] of put) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(" ").map(Number);
  const conn = (dx, dz) => { const n = at(x + dx, y, z + dz); return n && WALLS.has(n.block) ? "true" : "false"; };
  v.state = { north: conn(0, -1), east: conn(1, 0), south: conn(0, 1), west: conn(-1, 0), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [k, v] of put) { const [x, y, z] = k.split(" ").map(Number); g.set(x, y, z, v.block, v.state); }
const info = g.save(`${DIR}/${ID}.nbt`);
console.log(`${ID}.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
