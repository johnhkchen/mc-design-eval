// A commercial block on the Left Bank's Haussmann-era massing, cut to the lidar: cream calcite walls over a stone plinth, shopfronts
// on the street, storeys every 5 blocks, zinc-grey (deepslate tile) roofs, and a tall corner tower stepping down to a low pavilion.
// Tiers are the lidar's 3x3 median quantised to 4 heights (8, 16, 21, 31 blocks above y 0), so every setback sits on what is below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR2011662624.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR2011662624.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const k = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(k(x, z), gr); lidar.set(k(x, z), roof); }
const has = (x, z) => ground.has(k(x, z));
const G = (x, z) => ground.get(k(x, z));

// lidar noise -> tiers: roof height (blocks above y 0) at or under each limit becomes that tier's top
const TIERS = [[9, 8], [18, 16], [26, 21], [Infinity, 31]];
const top = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) vals.push(lidar.get(k(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  top.set(key, TIERS.find(([lim]) => vals[vals.length >> 1] <= lim)[1]);
}
const T = (x, z) => top.get(k(x, z));

// a column is shell (walls) when a side faces outside the footprint or a lower tier; interior columns stay air behind the glass
const open = (x, z, dx, dz) => !has(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z);
const exposedX = (x, z) => open(x, z, 1, 0) || open(x, z, -1, 0);
const exposedZ = (x, z) => open(x, z, 0, 1) || open(x, z, 0, -1);
const shell = (x, z) => exposedX(x, z) || exposedZ(x, z);

const DOOR = [15, 6];           // the street entrance on the north face, in the 8-block pavilion
const CENTRE = [22, 25];

const g = new Voxels([45, 46, 50]);
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // a pane on an x-facing wall joins its neighbours north-south
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = T(x, z), xf = exposedX(x, z), zf = exposedZ(x, z), sh = shell(x, z);
  const corner = xf && zf, bay = xf ? z : x, pillar = corner || bay % 3 === 0;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  // foundation and plinth from y 0 past the highest ground (5), then the ground floor's slab
  for (let y = 0; y < 5; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 5, z, "smooth_stone");

  for (let y = 6; y < t; y++) {
    if (isDoor && (y === 6 || y === 7)) { g.set(x, y, z, "dark_oak_door", door(y === 6 ? "lower" : "upper")); continue; }
    if (y === t - 1) { g.set(x, y, z, sh ? "stone_bricks" : "deepslate_tiles"); continue; }   // coping on the walls, zinc-grey roof inside
    if (y % 5 === 0) { g.set(x, y, z, "smooth_stone"); continue; }                          // storey slabs (string courses on the shell)
    if (!sh) continue;                                                                       // interior air
    const F = Math.floor(y / 5) * 5, r = y - F;                                             // storey: slab at F, layers F+1..F+4
    if (corner) { g.set(x, y, z, F === 5 ? "dark_oak_planks" : "calcite"); continue; }
    if (F === 5) {                                                                           // shopfront storey
      if (r <= 2 && !pillar) g.set(x, y, z, "glass");
      else if (r <= 3) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "calcite");
    } else if ((r === 2 || r === 3) && !pillar) {                                            // upper storeys: windows between calcite sill and lintel
      g.set(x, y, z, "glass_pane", xf ? paneX : paneZ);
    } else g.set(x, y, z, "calcite");
  }
  if (isDoor) for (let x2 = x - 2; x2 <= x + 2; x2++) g.set(x2, 8, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // canopy over the door
  // roof equipment: chimney stacks on the tower's roof
  if (t === 31 && !sh && (x + 2 * z) % 11 === 0) {
    g.set(x, 31, z, "stone_bricks"); g.set(x, 32, z, "stone_bricks"); g.set(x, 33, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm lanterns standing on the storey floors, just inside some upper windows
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!shell(x, z) || T(x, z) <= 10) continue;
  const xf = exposedX(x, z), zf = exposedZ(x, z);
  if (xf && zf) continue;
  for (let F = 10; F < T(x, z); F += 5) {
    if (((x + z + F) % 4) !== 0 || (F + 2) >= T(x, z) - 1) continue;
    const bayPane = xf ? z % 3 !== 0 : x % 3 !== 0;
    if (!bayPane) continue;
    const nx = xf ? x + (x < CENTRE[0] ? 1 : -1) : x, nz = xf ? z : z + (z < CENTRE[1] ? 1 : -1);
    if (!has(nx, nz) || shell(nx, nz) || T(nx, nz) <= F) continue;
    g.set(nx, F + 1, nz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const info = g.save(OUT);
console.log(`FR2011662624: ${info.blocks} blocks, ${info.palette} palette entries -> ${OUT}`);
