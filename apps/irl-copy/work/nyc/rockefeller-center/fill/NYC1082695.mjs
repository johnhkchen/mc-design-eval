// 29 West 46th Street, 1920 mixed residential and commercial building: a Renaissance-revival loft block in red brick with
// white terracotta string courses, a granite base and a stone cornice and parapet, the Midtown type of its date. Footprint
// 6 x 25 (x across the front, low z = north = the 46th Street frontage). Lidar roofs are read as four flat tiers, not
// followed cell by cell: 8 storeys (roof 24) on the front and the east wing, 7 (21) and 6 (18) stepping down at the
// rear and west side, and a one-storey shop (3) on the street front. Lidar roof 0 is open ground: a light well on the
// west side mid-block, and a notch at the street corner. Ground floor is a granite base with plate-glass shopfront, a
// dark oak door at x 4, and a stone hood over it. Each storey is three blocks: a white terracotta spandrel (the floor
// line) and two rows of windows, brick piers at every fourth block and a terracotta mullion between each pair of panes.
// Glass panes sit on the outer skin with air behind them one block deep and the floor line solid, so each window is a
// recess-free opening with a gap behind; the rest is a solid core (no interiors). Warm glowstone sits in some gaps. Roof:
// smooth stone with a parapet on the edges and a wooden water tank on the east wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1082695.cells.json`, "utf8"));
const X = 6, Z = 25, Y = 27;

// Lidar roof (y 0 is the lowest ground, which is flat here) -> one of four flat tier heights; 0 is open ground.
const tierOf = (roof) => (roof <= 0 ? 0 : roof >= 22 ? 24 : roof >= 19 ? 21 : roof >= 14 ? 18 : 3);
const H = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , roof] of cells) H[x][z] = tierOf(roof);

const hgt = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[x][z]);
const FACES = [
  { dx: 0, dz: -1 }, // N: the 46th Street front
  { dx: 0, dz: 1 }, // S
  { dx: -1, dz: 0 }, // W
  { dx: 1, dz: 0 }, // E
];
// Glass panes connect along the face only (a strip of glass, not a grid of posts).
const paneState = (f) => (f.dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([X, Y, Z]);
const gaps = new Map(); // "x,y,z" -> block left in the gap behind a window (air, or a glowstone lamp)

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const top = H[x][z];
  if (!top) continue;
  const shop = top === 3;
  for (let y = 0; y < top; y++) {
    const roof = y === top - 1;
    const faces = FACES.filter((f) => hgt(x + f.dx, z + f.dz) <= y);
    if (!faces.length) { g.set(x, y, z, roof ? "smooth_stone" : "stone"); continue; }
    if (faces.length > 1) { // corner quoin: granite base, stone piers, parapet on the roof
      g.set(x, y, z, y === 0 ? "polished_granite" : roof && !shop ? "stone_brick_wall" : "stone_bricks");
      continue;
    }
    const f = faces[0];
    const u = f.dz !== 0 ? x : z;                       // position along the face: the pier and mullion rhythm
    const pier = u % 4 === 0, frame = u % 4 === 2;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (shop) { // one-storey shopfront: glass on the middle row, fascia on top
      if (roof) { g.set(x, y, z, "stone_bricks"); continue; }
      if (pier) g.set(x, y, z, "polished_granite");
      else if (frame) g.set(x, y, z, "white_terracotta");
      else { g.set(x, y, z, "glass_pane", paneState(f)); gap(x, y, z, f, (u % 3) === 1 ? "glowstone" : "air"); }
      continue;
    }
    if (roof) { g.set(x, y, z, "stone_brick_wall"); continue; }   // parapet
    const l = (y - 3) % 3;                              // 0 = floor line, 1-2 = window rows
    if (l === 0) { g.set(x, y, z, y >= top - 3 ? "stone_bricks" : "white_terracotta"); continue; } // spandrel or cornice
    if (pier) g.set(x, y, z, "bricks");
    else if (frame) g.set(x, y, z, "white_terracotta");
    else {
      g.set(x, y, z, "glass_pane", paneState(f));
      const storey = Math.floor((y - 3) / 3);
      gap(x, y, z, f, l === 1 && (u + storey) % 5 === 2 ? "glowstone" : "air");
    }
  }
}

// The gap behind a window: the cell one block inward, if the building is there at that height. Applied after the
// solid pass so it overrides the core there.
function gap(x, y, z, f, block) {
  const ix = x - f.dx, iz = z - f.dz;
  if (hgt(ix, iz) > y) gaps.set(`${ix},${y},${iz}`, block);
}
for (const [k, block] of gaps) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block); }

// Entrance: dark oak door in the shopfront at x 4, a stone hood over it.
g.set(4, 0, 0, "dark_oak_door", door("lower"));
g.set(4, 1, 0, "dark_oak_door", door("upper"));
g.set(4, 2, 0, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// Water tank on the roof of the east wing (x 4, z 11-12 stand on the 24-high tier).
for (const z of [11, 12]) {
  g.set(4, 24, z, "spruce_planks"); g.set(4, 25, z, "spruce_planks");
  g.set(4, 26, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(`${DIR}/NYC1082695.nbt`);
console.log(JSON.stringify({ file: "NYC1082695.nbt", ...info }));
