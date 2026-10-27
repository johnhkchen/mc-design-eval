// Way 332241910: an untagged OSM block on the Eden Terrace side of Mt Eden, read as an interwar brick-and-plaster
// shop-and-office building: cream plaster walls on a dark stone base, stone bands at each floor, shopfront glass on the
// ground storey, and a flat roof stepped in three tiers from the lidar (1, 2 and 3 storeys).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241910.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => fp.has(key(x, z));
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// The lidar roof is noisy: take the median of each cell's 3x3 neighbourhood, then snap it to three flat tiers.
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(fp.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierOf = (r) => (r <= 6 ? 5 : r <= 9 ? 9 : 11);      // 1-storey wing, 2-storey middle, 3-storey top
const FLOORS = { 5: (g) => [g], 9: (g) => [g, 4], 11: (g) => [g, 4, 7] };   // storey floors; upper ones are string courses
const DOOR = [3, 0];                                       // the street door on the north wall

const [X, Y, Z] = [25, 24, 14];
const blocks = new Map();                                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);
const info = new Map();

// Pass 1: each footprint column, from its foundation up to its roof, with a 1-block shell on the outside and air inside.
for (const [x, z, g] of cells) {
  const T = tierOf(medianRoof(x, z));
  const floors = FLOORS[T](g);
  const top = T - 1;                                        // roof membrane / cornice layer
  const exposed = SIDES.filter(([dx, dz]) => !inside(x + dx, z + dz));
  const ext = exposed.length > 0;
  const along = exposed.some(([dx]) => dx) ? z : x;         // position along the exposed wall, for the bay rhythm
  info.set(key(x, z), { T, floors, ext, g });

  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");  // foundation: nothing floats on the slope
  for (let y = g; y < top; y++) {
    if (floors.includes(y)) { put(x, y, z, y === g && ext ? "stone_bricks" : "smooth_stone"); continue; }
    if (!ext) continue;                                     // interior air behind the glass
    const F = Math.max(...floors.filter((f) => f <= y));
    const rel = y - F, ground = F === g;
    if (ground && x === DOOR[0] && z === DOOR[1] && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (rel === 3) { put(x, y, z, "smooth_stone"); continue; }          // head course over each window band
    if (rel === 1 || rel === 2) {
      const glazed = ground ? along % 4 !== 0 : along % 4 === 1 || along % 4 === 2;   // shopfront bays / upper bays
      if (glazed) put(x, y, z, "glass_pane", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
      else put(x, y, z, "smooth_quartz");
      continue;
    }
    put(x, y, z, "smooth_quartz");
  }
  put(x, top, z, ext ? "smooth_stone" : "gray_concrete");   // cornice ring outside, tar roof over the interior
}

// Pass 2: warm light in some rooms, a standing lantern on a storey floor right behind a window.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { T, floors, ext } = info.get(key(x, z));
  if (ext) continue;
  for (const F of floors) {
    const L = F + 1;
    if (L > T - 2 || (x + 2 * z + F) % 3 !== 0) continue;
    const behindGlass = SIDES.some(([dx, dz]) => at(x + dx, L, z + dz)?.block === "glass_pane");
    if (behindGlass) put(x, L, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: roof plant on the top tier, two blocks of iron units on a grid of the tower's interior roof.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { T, ext } = info.get(key(x, z));
  if (T === 11 && !ext && x % 6 === 3 && z % 5 === 2) { put(x, T, z, "iron_block"); put(x, T + 1, z, "iron_block"); }
}

// Pass 4: each glass pane joins the neighbours it touches, as the game would connect it.
const solidWall = new Set(["glass_pane", "smooth_quartz", "stone_bricks", "smooth_stone"]);
for (const [k, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const joins = (dx, dz) => solidWall.has(at(x + dx, y, z + dz)?.block);
  v.state = { east: String(joins(1, 0)), west: String(joins(-1, 0)), north: String(joins(0, -1)), south: String(joins(0, 1)), waterlogged: "false" };
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241910.nbt");
console.log(JSON.stringify(out));
