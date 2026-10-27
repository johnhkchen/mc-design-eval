// Way 154089937: a 1970s five-storey concrete office block on a stepped roof (Auckland, Newton / Eden Terrace edge).
// Concrete tiers (roofs 12-20) over brick wings (roofs 4-8). Lidar roof heights are smoothed into flat tiers,
// so the main mass steps down in 4-block setbacks towards the edges. Shopfront on the ground band, glazed
// bays with piers between, string courses at each storey line, a parapet on every exposed edge, plant boxes
// on the top tier. The interior is air with one floor slab per storey, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089937.cells.json", "utf8"));
const W = 72, H = 33, D = 58;

// lidar roof -> flat tier (4-block storeys): the 18-20 mass is the top tier; the rings beneath are setbacks
const tier = (r) => (r >= 19 ? 20 : r >= 15 ? 16 : r >= 11 ? 12 : r >= 7 ? 8 : 4);
const cellAt = new Map();
for (const [x, z, g, r] of cells) cellAt.set(`${x},${z}`, { x, z, g, R: tier(r) });
const at = (x, z) => cellAt.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// exposed = a side open to the sky beyond the footprint or to a lower tier (a setback face)
const shellOf = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.R < c.R; });

// brick wings (single and two storeys) vs concrete tiers
const MAT = (brick) => brick
  ? { base: "stone_bricks", piers: "stone_bricks", wall: "bricks", line: "stone_bricks", glass: "gray_stained_glass_pane", cap: "stone_bricks", parapet: "stone_bricks", foundation: "stone_bricks", roof: "gray_concrete" }
  : { base: "smooth_stone", piers: "polished_andesite", wall: "white_concrete", line: "light_gray_concrete", glass: "light_blue_stained_glass_pane", cap: "light_gray_concrete", parapet: "smooth_stone", foundation: "stone_bricks", roof: "gray_concrete" };

// one exposed-wall block: ground band = base course, shopfront glass and piers; upper storeys = slab line, glazed bays, spandrel
function facade(c, x, y, z) {
  const m = MAT(c.R <= 8);
  if (y === c.R - 1) return [m.cap];
  if (y === c.R) return [m.parapet];
  if (y < 4) {
    if (y === c.g) return [m.base];
    return (x + z) % 3 === 0 ? [m.piers] : [m.glass, true];
  }
  if (y % 4 === 0) return [m.line];
  if (y % 4 === 3) return [m.wall];
  return (x + z) % 3 === 0 ? [m.wall] : [m.glass, true];
}

// entrance: a shell cell on the west face, nearest z 29, on the low ground
const westFace = [...cellAt.values()].filter((c) => !at(c.x - 1, c.z) && c.g <= 2);
const door = westFace.sort((a, b) => Math.abs(a.z - 29) - Math.abs(b.z - 29))[0];

const v = new Voxels([W, H, D]);
const panes = new Set();
const shells = new Set();
const key3 = (x, y, z) => `${x},${y},${z}`;

for (const c of cellAt.values()) {
  const { x, z, g, R } = c;
  const shell = shellOf(c);
  if (shell) shells.add(`${x},${z}`);
  for (let y = 0; y < g; y++) v.set(x, y, z, MAT(c.R <= 8).foundation);
  for (let y = g; y < R; y++) {
    if (shell) {
      const [b, isGlass] = facade(c, x, y, z);
      v.set(x, y, z, b, isGlass ? { waterlogged: "false" } : undefined);
      if (isGlass) panes.add(key3(x, y, z));
    } else if (y === R - 1) v.set(x, y, z, MAT(c.R <= 8).roof);
    else if (y % 4 === 0 && y > g) v.set(x, y, z, "light_gray_concrete");
    else if (!shell && x % 6 === 0 && z % 6 === 0 && y < R - 1) v.set(x, y, z, "white_concrete");   // interior columns carry the floor slabs
  }
  if (shell) v.set(x, R, z, MAT(c.R <= 8).parapet);
}

// the entrance: door halves on the ground band, a lintel over it
if (door) {
  const { x, z, g } = door;
  panes.delete(key3(x, g, z)); panes.delete(key3(x, g + 1, z));
  v.set(x, g, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 1, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (g + 2 < 4) { panes.delete(key3(x, g + 2, z)); v.set(x, g + 2, z, "light_gray_concrete"); }
}

// warm light: some lit bays on the upper storeys, a glowstone on the floor slab behind the glass
const interior = (c) => c && !shells.has(`${c.x},${c.z}`);
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (y < 4 || y % 4 !== 1) continue;   // the lower row of a bay, standing on the storey's slab
  if ((x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (!interior(n) || n.R <= y || n.g > y - 1 || (n.x % 6 === 0 && n.z % 6 === 0)) continue;
    const slab = y - (y % 4);
    if (!(slab > n.g && slab < n.R - 1)) continue;
    v.set(n.x, y, n.z, (x + z) % 2 ? "glowstone" : "shroomlight");
    break;
  }
}

// plant boxes on the top tier: 2x2 concrete plinths with an iron unit on each cell
for (const c of cellAt.values()) {
  if (c.R !== 20 || shellOf(c) || c.x % 8 !== 4 || c.z % 8 !== 4) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (block.some((n) => !n || n.R !== 20 || shellOf(n))) continue;
  for (const n of block) { v.set(n.x, 20, n.z, "light_gray_concrete"); v.set(n.x, 21, n.z, "iron_block"); }
}

// connect each glass pane to the solid neighbours (panes and facade) in its plane
const conn = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const solid = (x, y, z) => { const b = v.get(x, y, z); return b && !/glowstone|shroomlight|lantern|iron_block/.test(b.block); };
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [name, dx, dz] of conn) state[name] = solid(x + dx, y, z + dz) ? "true" : "false";
  v.set(x, y, z, "light_blue_stained_glass_pane", state);
}

// a floating-block census: a block with air below that is not a floor slab, roof, parapet, glass or door
// (those span between the walls and the interior columns, so they are checked by the column grid, not by a column)
let floating = 0;
for (let y = 1; y < H; y++) for (const c of cellAt.values()) {
  const b = v.get(c.x, y, c.z);
  if (!b || v.get(c.x, y - 1, c.z)) continue;
  const spans = y % 4 === 0 || y === c.R - 1 || y === c.R || panes.has(key3(c.x, y, c.z)) || /door/.test(b.block);
  if (!spans) floating++;
}
console.log(`cells ${cells.length} shell ${shells.size} panes ${panes.size} floating-tops ${floating} door ${door ? `${door.x},${door.z}` : "none"}`);

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089937.nbt");
console.log(`saved blocks ${out.blocks} palette ${out.palette}`);
