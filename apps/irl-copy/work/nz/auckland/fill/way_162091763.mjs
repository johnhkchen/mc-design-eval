// way 162091763: an 18 x 20 interwar brick commercial block, three storeys on a two-storey podium,
// Auckland's CBD-era shopfront at ground level. Massing follows the lidar roof: cells at roof 12 rise to a
// tower top (12); cells at 10-11 stop at a podium with a parapet (11). Walls are one cell thick with an air
// gap (depth 2) behind the glass; floor slabs at y0, y5, y9 span the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091763.cells.json", "utf8"));
const g = new Voxels([18, 25, 20]);

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];                  // +z is the street (front) face
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));

// depth 1 = a cell with a footprint edge (the wall), 2 = the air gap behind it, 3+ = the solid interior
const depth = new Map();
let frontier = [];
for (const c of cell.values()) {
  if (DIRS.some(([dx, dz]) => !cell.has(key(c.x + dx, c.z + dz)))) { depth.set(key(c.x, c.z), 1); frontier.push(c); }
}
for (let d = 2; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (cell.has(k) && !depth.has(k)) { depth.set(k, d); next.push(cell.get(k)); }
  }
  frontier = next;
}

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glass = (face) => (face[1] !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

// the face a wall cell shows: the street face if it has one, else the first exposed side
const faceOf = (c) => DIRS.find(([dx, dz]) => !cell.has(key(c.x + dx, c.z + dz)));
const inward = (face) => [-face[0], -face[1]];

// the front wall's middle cell takes the entrance
const front = [...cell.values()].filter((c) => depth.get(key(c.x, c.z)) === 1 && faceOf(c)[1] === 1)
  .sort((a, b) => a.x - b.x);
const doorCell = front[Math.floor(front.length / 2)];

for (const c of cell.values()) {
  const d = depth.get(key(c.x, c.z));
  const { x, z } = c;
  const core = c.roof >= 12;

  // foundation and plinth: solid from y 0 up to the cell's ground, and the ground-floor slab
  for (let y = 0; y < Math.max(c.ground, 1); y++) put(x, y, z, "stone_bricks");

  if (d === 1) {
    const face = faceOf(c), isFront = face[1] === 1;
    const k = face[1] !== 0 ? x : z;                               // the bay index along the wall
    const ground = k % 3 !== 0, upper = k % 2 === 0;               // shop glass 2 of 3 bays; offices 1 of 2
    const st = glass(face);
    const inner = cell.get(key(x + inward(face)[0], z + inward(face)[1]));
    const innerGap = inner && depth.get(key(inner.x, inner.z)) === 2;
    const isDoor = c === doorCell;

    put(x, 1, z, "stone_bricks");                                  // plinth course
    if (isDoor) {
      put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      for (const y of [2, 3]) put(x, y, z, ground ? "glass_pane" : "bricks", ground ? st : undefined);
    }
    put(x, 4, z, isFront ? "dark_oak_planks" : "smooth_stone");     // fascia / sign band
    put(x, 5, z, "stone_bricks");                                  // string course over the first floor
    put(x, 6, z, upper ? "white_concrete" : "bricks");             // sill
    put(x, 7, z, upper ? "glass_pane" : "bricks", upper ? st : undefined);
    put(x, 8, z, upper ? "white_concrete" : "bricks");             // head
    put(x, 9, z, "stone_bricks");                                  // string course over the second floor

    if (core) {
      put(x, 10, z, upper ? "glass_pane" : "bricks", upper ? st : undefined);
      put(x, 11, z, "stone_bricks");                               // tower cornice
    } else {
      put(x, 10, z, "stone_brick_wall");                           // podium parapet
    }

    if (innerGap && ground && k % 6 === 1) put(inner.x, 1, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
    if (innerGap && upper && k % 4 === 0) put(inner.x, 7, inner.z, "glowstone");
    if (innerGap && core && upper && k % 4 === 2) put(inner.x, 10, inner.z, "shroomlight");
  } else {
    // the interior: the floor slabs at y5 and y9 (the gap cells above hold air), and roof decks over the solid core
    put(x, 5, z, "smooth_stone");
    put(x, 9, z, "smooth_stone");
    if (core && d >= 3) { put(x, 10, z, "light_gray_concrete"); put(x, 11, z, "light_gray_concrete"); }
    if (!core && d >= 2) put(x, 10, z, "light_gray_concrete");  // podium roof, its gap cells open to the sky
  }
}

// roof plant on the tower's solid roof, the nearest cells to two targets (about 13 blocks to its top)
const deck = [...cell.values()].filter((c) => c.roof >= 12 && depth.get(key(c.x, c.z)) >= 3);
for (const [tx, tz] of [[6, 9], [11, 13]]) {
  const c = deck.reduce((best, n) => (Math.hypot(n.x - tx, n.z - tz) < Math.hypot(best.x - tx, best.z - tz) ? n : best));
  put(c.x, 12, c.z, "iron_block");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091763.nbt");
console.log(JSON.stringify(stats));
