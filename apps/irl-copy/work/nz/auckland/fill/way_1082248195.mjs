// Ramada, Mt Eden side of the CBD: a 1970s-80s reinforced-concrete hotel tower, 12 storeys of 4 blocks on a flat
// lidar roof at y 50, with lower 1-10 storey wings where the lidar drops at the edges. White concrete frame and
// storey bands, tinted glazing in bays, shopfront glass on the ground floor, a canopied lobby door on the west wing,
// warm lights behind some glass, and a lift overrun with plant boxes on the roof. No interiors: air behind the
// glass, one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1082248195.cells.json`, "utf8"));

const TOWER_TOP = 50;     // the lidar roof over the tower: 49-51 across the body, smoothed to one flat tier
const TOWER_MIN = 44;     // roofs at or above this are the tower; below are lower wings
const FLOOR0 = 2;         // the first storey's floor slab; y 0-1 is the plinth
const PITCH = 4;          // storey height in blocks (floor slab + 2 glazed rows + spandrel)

const foot = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// one tier per cell: the tower's flat top, or a wing snapped to a storey line (2 + 4n)
function tierOf(r) {
  if (r >= TOWER_MIN) return TOWER_TOP;
  const n = Math.min(10, Math.max(1, Math.round((r - FLOOR0) / PITCH)));
  return FLOOR0 + PITCH * n;
}

// the cells with a full ring of tower around them (4 out): the core, where the roof plant goes
const core = (x, z) => { for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (!inFoot(x + dx, z + dz)) return false; return true; };

const g = new Voxels([39, 64, 55]);
const S = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the first exterior side of a facade cell (its wall faces that way); null for an interior cell
function exteriorSide(x, z) { for (const [dx, dz] of DIRS) if (!inFoot(x + dx, z + dz)) return [dx, dz]; return null; }

const lit = [];   // interior cells behind glazing that get a warm light, after the shell
for (const { x, z } of foot.values()) {
  const W = tierOf(foot.get(`${x},${z}`).r), n = (W - FLOOR0) / PITCH;
  const side = exteriorSide(x, z), facade = side !== null;
  // the wall runs along z on an east or west face, along x on a north or south face; piers each 3 bays
  const idx = facade ? (side[0] !== 0 ? z : x) : 0;
  const pier = facade && idx % 3 === 0;

  // plinth: a stone base course on the facade, solid rock-fill inside
  S(x, 0, z, facade ? "stone_bricks" : "stone");
  S(x, 1, z, facade ? "chiseled_stone_bricks" : "stone");

  for (let k = 0; k < n; k++) {
    const F = FLOOR0 + PITCH * k;
    S(x, F, z, facade ? "white_concrete" : "light_gray_concrete");          // the floor slab, a white storey band on the facade
    if (!facade) continue;
    const glass = k === 0 ? "light_blue_stained_glass"                      // ground floor: continuous shopfront glass
      : Math.floor(idx / 3) % 2 ? "gray_stained_glass" : "light_blue_stained_glass";
    for (const y of [F + 1, F + 2]) S(x, y, z, pier && k > 0 ? "white_concrete" : glass);
    S(x, F + 3, z, "light_gray_concrete");                                   // spandrel under the next slab
    if (k > 0 && (x + z + k) % 11 === 0 && side) lit.push([x - side[0], F + 1, z - side[1], k]);
  }

  S(x, W, z, facade ? "white_concrete" : "stone");                          // the roof, or the coping on the facade
  if (facade) S(x, W + 1, z, "white_concrete");                             // parapet
}

// warm lights behind the glass: the interior cell inside a window (air gap, then the light), not a facade cell
for (const [xi, y, zi, k] of lit) {
  if (!inFoot(xi, zi) || exteriorSide(xi, zi)) continue;
  S(xi, y, zi, (xi + zi + k) % 2 ? "glowstone" : "shroomlight");
}

// the lobby on the west wing: a door, a canopy slab over it, and hanging lanterns either side
const DOOR_X = 1, DOOR_Z = 40, F0 = FLOOR0;
S(DOOR_X, F0 + 1, DOOR_Z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
S(DOOR_X, F0 + 2, DOOR_Z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dz of [-1, 1]) {
  S(DOOR_X, F0 + 3, DOOR_Z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  S(DOOR_X, F0 + 2, DOOR_Z + dz, "lantern", { hanging: "true", waterlogged: "false" });
}
S(DOOR_X, F0 + 3, DOOR_Z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// the roof: a lift overrun and plant boxes on the core, standing on the flat roof at y 50
const coreCells = [...foot.values()].filter(({ x, z }) => tierOf(foot.get(`${x},${z}`).r) === TOWER_TOP && core(x, z));
const cx = coreCells.reduce((a, c) => a + c.x, 0) / coreCells.length, cz = coreCells.reduce((a, c) => a + c.z, 0) / coreCells.length;
const near = coreCells.sort((a, b) => (a.x - cx) ** 2 + (a.z - cz) ** 2 - ((b.x - cx) ** 2 + (b.z - cz) ** 2));
const [lx, lz] = [Math.round(near[0].x), Math.round(near[0].z)];
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
  const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
  for (let y = TOWER_TOP + 1; y <= TOWER_TOP + 3; y++) S(lx + dx, y, lz + dz, edge ? "white_concrete" : "light_gray_concrete");
}
for (const [dx, dz] of [[-7, -5], [6, -6], [-6, 6], [7, 5]]) {
  const px = lx + dx, pz = lz + dz;
  if (!coreCells.some(c => c.x === px && c.z === pz)) continue;
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) S(px + ox, TOWER_TOP + 1, pz + oz, "stone_bricks");
  S(px, TOWER_TOP + 2, pz, "stone_bricks");
}

const out = `${DIR}/way_1082248195.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ cells: cells.length, lidarLift: [lx, lz], lights: lit.length, ...stats }));
