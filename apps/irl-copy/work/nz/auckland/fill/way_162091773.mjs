// Mercury Theatre, Eden Terrace, Mt Eden (way 162091773): a 1920s-30s picture theatre in the stripped-classical
// manner Auckland built in cream plaster over brick. A cream render wall on a dark stone base, pilaster bays,
// a glazed shopfront band on the grade floor, a red terracotta marquee over a recessed porch on the uphill (north)
// front, and the stage house as the tallest tier. The massing follows the lidar roof, smoothed into flat storey tiers.
//
// Levels: D is the uphill ground, where the ground floor sits. Downhill cells show an extra lower storey down to
// their own ground. Storeys are 4 blocks: a floor/ceiling slab at D + 4k, 3 blocks of air between. Shell walls
// are cells open to the outside (off the footprint, in the porch, or above a lower neighbour's roof). Everything
// else inside stays air, with only slabs. Windows sit in the shell with air behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091773.cells.json", "utf8"));
const g = new Voxels([50, 38, 25]);

const D = 5;                                                   // the ground-floor slab, on the uphill ground
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = new Map();
for (const [x, z, ground, lidar] of cells) at.set(`${x},${z}`, { x, z, ground, lidar });
const cell = (x, z) => at.get(`${x},${z}`);

// Lidar roof -> flat tiers: the median of each cell's 3x3 neighbourhood, rounded to a storey count (tiers at 14/18/22/26).
const neighbours = (c) => { const out = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) out.push(n); } return out; };
for (const c of at.values()) {
  const near = neighbours(c).map((n) => n.lidar).sort((a, b) => a - b);
  c.storeys = Math.min(5, Math.max(2, Math.round((near[near.length >> 1] - 6) / 4)));
}
// Two majority passes drop single-cell spires and notches, so each tier is a solid block of cells.
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of at.values()) {
    const votes = new Map();
    for (const n of neighbours(c)) votes.set(n.storeys, (votes.get(n.storeys) ?? 0) + 1);
    let best = c.storeys, top = 0;
    for (const [s, v] of votes) if (v > top || (v === top && s === c.storeys)) { best = s; top = v; }
    next.set(c, best);
  }
  for (const [c, s] of next) c.storeys = s;
}
for (const c of at.values()) c.roof = D + 4 * c.storeys + 1;     // the top surface; the roof deck is the block at roof - 1

// The entrance: a two-cell porch cut into the north front, double doors on its back wall, a red canopy over it.
const porch = (x, z) => z === 0 && (x === 14 || x === 15);
const backWall = (x, z) => z === 1 && (x === 14 || x === 15);
const porchY = (y) => y > D && y <= D + 3;
const nearPorch = (x, z) => porch(x - 1, z) || porch(x + 1, z);

// Air at (x, z, y) that lies outside the building: off the footprint, in the porch, or above a lower neighbour's roof.
function open(x, z, y) {
  const c = cell(x, z);
  if (!c) return true;
  if (porch(x, z) && porchY(y)) return true;
  return y >= D && y >= c.roof;
}
const exposed = (c, y) => DIRS.filter(([dx, dz]) => open(c.x + dx, c.z + dz, y));
const shell = (c, y) => !(porch(c.x, c.z) && porchY(y)) && exposed(c, y).length > 0;

// What a block at (x, y, z) is: solid, plinth, roof, porch, slab (floor or ceiling), shell (wall) or interior air.
function cls(x, z, y) {
  const c = cell(x, z);
  if (!c) return "out";
  if (y < c.ground) return "solid";
  if (y >= c.roof) return "out";
  if (y === c.ground && D - c.ground === 1) return "solid";             // a one-block plinth course
  if (y === c.roof - 1) return "roof";
  if (porch(x, z) && porchY(y)) return "porch";
  if ((y >= D && (y - D) % 4 === 0) || (y === c.ground && D - c.ground >= 2)) return "slab";
  return shell(c, y) ? "shell" : "interior";
}

const STAIR = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };
const DOOR = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
const LANTERN = { hanging: "true", waterlogged: "false" };
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // along a north/south face
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // along an east/west face
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// One shell block: its face, the window grid along that face, and the articulation of its storey.
function wall(c, y) {
  const { x, z } = c;
  if (backWall(x, z) && porchY(y)) {                                      // the porch's back wall, with double doors
    if (y === D + 1) put(x, y, z, "dark_oak_door", DOOR("lower", x === 14 ? "left" : "right"));
    else if (y === D + 2) put(x, y, z, "dark_oak_door", DOOR("upper", x === 14 ? "left" : "right"));
    else put(x, y, z, "white_concrete");
    return;
  }
  const faces = exposed(c, y);
  const [dx, dz] = faces.find(([a, b]) => !cell(x + a, z + b)) ?? faces[0];
  const u = dz !== 0 ? x : z;                                              // position along that face
  const airBehind = cls(x - dx, z - dz, y) === "interior" && !nearPorch(x, z);
  const pane = dz !== 0 ? PANE_X : PANE_Z;
  const tower = c.storeys === 5;
  const bay = u % 6;                                                       // 0 pilaster, 1-2 window pair, 3-5 wall (1-4 on shopfronts)

  if (y < D) {                                                             // a lower storey, below the ground floor
    if (airBehind && y <= D - 2 && bay >= 1 && bay <= 4) put(x, y, z, "light_blue_stained_glass_pane", pane);
    else put(x, y, z, "stone_bricks");
    if (airBehind && y === D - 2 && u % 12 === 1) put(x - dx, y + 1, z - dz, "glowstone");
    return;
  }
  if (y <= D + 3) {                                                        // the ground floor: a glazed shopfront band
    if (bay === 0) put(x, y, z, "light_gray_concrete");
    else if (y === D + 1) put(x, y, z, bay >= 1 && bay <= 4 ? "stone_bricks" : "white_concrete");
    else if (airBehind && bay >= 1 && bay <= 4) {
      put(x, y, z, "light_blue_stained_glass_pane", pane);
      if (y === D + 2 && bay === 2) put(x - dx, y + 1, z - dz, "lantern", LANTERN);
    } else put(x, y, z, "white_concrete");
    return;
  }
  const r = (y - D - 1) % 4;                                               // 0 sill row, 1 glass, 2 lintel, in each upper storey
  if (bay === 0) put(x, y, z, tower ? "red_terracotta" : "light_gray_concrete");
  else if (airBehind && (bay === 1 || bay === 2) && r <= 1) {
    put(x, y, z, "light_blue_stained_glass_pane", pane);
    if (r === 1 && u % 12 === 1) put(x - dx, y, z - dz, "glowstone");
  } else if (airBehind && (bay === 1 || bay === 2) && r === 2) {
    put(x, y, z, "light_gray_concrete");
    if (u % 12 === 7) put(x - dx, y, z - dz, "lantern", LANTERN);
  } else put(x, y, z, "white_concrete");
}

for (const c of at.values()) {
  const { x, z } = c;
  for (let y = 0; y <= c.roof; y++) {
    const k = cls(x, z, y);
    if (k === "solid") {
      if (y < c.ground) put(x, y, z, "stone");
      else if (porch(x, z)) put(x, y, z, "stone_brick_stairs", STAIR);   // the porch steps up from the street
      else put(x, y, z, "stone_bricks");
    } else if (k === "roof") put(x, y, z, shell(c, y) ? "light_gray_concrete" : "stone");
    else if (k === "slab") {
      if (porch(x, z) && y === D + 4) put(x, y, z, "red_terracotta");     // the marquee canopy over the porch
      else if (porch(x, z) && y === D) put(x, y, z, "smooth_stone");
      else if (shell(c, y)) put(x, y, z, y < D ? "stone_bricks" : "light_gray_concrete");
      else put(x, y, z, "smooth_stone");
    } else if (k === "shell") wall(c, y);
  }
  if (DIRS.some(([dx, dz]) => !cell(x + dx, z + dz))) put(x, c.roof, z, "white_concrete");   // parapet on the outer edge
}

// Porch lamps under the canopy.
for (const x of [14, 15]) put(x, D + 3, 0, "lantern", LANTERN);

// Roof plant: small boxes on the interior roof of the taller tiers.
for (const c of at.values()) {
  if (c.storeys < 3 || c.x % 8 !== 3 || c.z % 8 !== 3) continue;
  const sq = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  const ok = sq.every(([x, z]) => cell(x, z) && cell(x, z).roof === c.roof && !shell(cell(x, z), c.roof - 1));
  if (!ok) continue;
  for (const [x, z] of sq) for (let y = c.roof; y <= c.roof + 1; y++) put(x, y, z, "light_gray_concrete");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091773.nbt");
console.log(`way_162091773: ${stats.blocks} blocks, ${stats.palette} palette entries`);
