// Way 1095572137: a 1920s-30s brick commercial block on a stepped plan. Three tiers follow the lidar roof: a three-storey
// tower (roof 12-13), a two-storey wing (9-11) and a single-storey corner (7-8). Each tier is a solid shell with floor
// slabs and a roof deck; interiors are air, with an air gap behind every window. Facade: stone base and string courses,
// brick piers, glass panes in timber-framed shopfronts at street level, a parapet cap, a front door, glowstone in a few
// upper windows and HVAC plant on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572137";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));
const [W, H, D] = [12, 26, 9];

// lidar roof height -> tier: top T (blocks up to T-1), floor slabs, roof deck at dk (parapet at T-1)
const tierOf = (roof) => roof >= 12 ? { T: 13, floors: [4, 8], dk: 11 }
  : roof >= 9 ? { T: 10, floors: [4], dk: 8 }
  : { T: 7, floors: [], dk: 5 };
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const cellAt = new Map();
for (const [x, z, ground, roof] of cells) cellAt.set(`${x},${z}`, { x, z, ground, ...tierOf(roof) });
const at = (x, z) => cellAt.get(`${x},${z}`);
for (const c of cellAt.values()) {
  c.S = c.T - 1;                                                            // where open sky starts above the deck
  c.out = Object.keys(DIRS).filter((d) => !at(c.x + DIRS[d][0], c.z + DIRS[d][1]));   // faces onto the street or air
  c.nb = Object.values(DIRS).map(([dx, dz]) => at(c.x + dx, c.z + dz)).filter(Boolean);
}

// A cell is solid at y when it is foundation, an outer wall, a base/floor/deck slab, or a wall above a lower neighbour's sky.
const solid = (c, y) => {
  if (y < 0 || y >= c.T) return false;
  if (y < c.ground || c.out.length) return true;
  if (y === 0 || y === c.dk || c.floors.includes(y)) return true;
  return c.nb.some((n) => y >= n.S && y < c.S);
};

const blk = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => blk.set(key(x, y, z), { block, state });
const has = (x, y, z) => blk.has(key(x, y, z));

// 1. the massing shell
for (const c of cellAt.values()) for (let y = 0; y < c.T; y++) {
  if (!solid(c, y)) continue;
  const outer = c.out.length > 0;
  if (y === 0) put(c.x, y, c.z, "stone_bricks");
  else if (outer && y === c.T - 1) put(c.x, y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else if (outer && (c.floors.includes(y) || y === c.dk)) put(c.x, y, c.z, "stone_bricks");
  else if (outer) put(c.x, y, c.z, "bricks");
  else if (y === c.dk) put(c.x, y, c.z, "stone");                       // built-up roof, lighter than the dark tar it replaces
  else if (c.floors.includes(y)) put(c.x, y, c.z, "smooth_stone");
  else put(c.x, y, c.z, "bricks");
}

// 2. facades: a single outward face gets a glass band (shopfront at street level, storey windows above) with brick piers;
// the glass only goes where the cell behind it is air
const glassYs = (c) => [1, 2, ...(c.T >= 10 ? [5, 6] : []), ...(c.T >= 13 ? [9, 10] : [])];
const upperWindows = [];
for (const c of cellAt.values()) {
  if (c.out.length !== 1) continue;
  const [dx, dz] = DIRS[c.out[0]];
  const u = dx ? c.z : c.x;
  if (c.T >= 10) put(c.x, 7, c.z, "stone_bricks");                       // lintel over the upper windows
  for (const y of glassYs(c)) {
    if (!has(c.x, y, c.z) || has(c.x - dx, y, c.z - dz)) continue;      // no wall, or a solid behind: keep the wall
    if (y <= 2 && u % 3 === 0) { put(c.x, y, c.z, "dark_oak_planks"); continue; }   // shopfront pier
    if (y > 2 && u % 3 === 0) continue;                                 // upper pier stays brick
    put(c.x, y, c.z, "glass_pane");
    if (y > 2) upperWindows.push({ x: c.x - dx, y, z: c.z - dz });     // the air cell behind this pane
  }
}

// 3. the front door on the north face of the tower's ground floor, with its fascia above
const front = at(2, 0);
if (front && front.out.includes("north")) {
  const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(2, 1, 0, "dark_oak_door", door("lower"));
  put(2, 2, 0, "dark_oak_door", door("upper"));
}

// 4. warm light behind a few upper windows (glowstone in the air cell), plus plant boxes on the tower roof
upperWindows.filter((_, i) => i % 4 === 1).slice(0, 3).forEach(({ x, y, z }) => put(x, y, z, "glowstone"));
for (const [x, z] of [[1, 4], [2, 2]]) {
  const c = at(x, z);
  if (c && c.T === 13 && !has(x, 12, z)) put(x, 12, z, "stone_bricks");
}

// 5. panes connect to the solid or glass beside them, as vanilla does
const DIR_LIST = Object.entries(DIRS);
const paneState = (x, y, z) => Object.fromEntries([
  ...DIR_LIST.map(([name, [dx, dz]]) => [name, has(x + dx, y, z + dz) ? "true" : "false"]),
  ["waterlogged", "false"],
]);

// 6. write the volume
const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, block === "glass_pane" ? paneState(x, y, z) : state);
}
const { blocks, palette } = g.save(`${FILE}.nbt`);
console.log(`way_1095572137: ${blocks} blocks, ${palette} palette entries`);
