// Way 1095572154, Mt Eden / Eden Terrace fringe: a two-storey brick and plaster commercial block of the 1900s-1920s
// (Auckland's Edwardian shop-and-flat type). Ground floor is a dark-timber shopfront with a centre door, the upper floor
// has sash-style glazing on quoined brick, quartz string courses and a cornice, and the rear roof carries a stone plant
// room. The lidar roof runs 7-9 blocks, so the west wing is one storey shorter, with a single row of upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_1095572154.cells.json`, "utf8"));

const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// a door's facing is the way it faces the person entering, i.e. back toward the street
const FACING = { N: "south", S: "north", W: "east", E: "west" };
const BASE = "stone_bricks", WALL = "bricks", TRIM = "quartz_block", FLOOR = "smooth_stone", SHOP = "dark_oak_planks";

const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFoot = (x, z) => roof.has(`${x},${z}`);
// the outward faces of a footprint cell: the sides with no footprint cell beside them
const exposed = (x, z) => Object.keys(DIR).filter((d) => !inFoot(x + DIR[d][0], z + DIR[d][1]));
// position along a face: x for the north and south walls, z for the east and west walls
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);

// the street front is the face with the most exposed cells
const count = { N: 0, S: 0, E: 0, W: 0 };
for (const [x, z] of cells) for (const d of exposed(x, z)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));

// the entrance: the middle single-faced cell of the front
const frontCells = cells
  .filter(([x, z]) => { const e = exposed(x, z); return e.length === 1 && e[0] === front; })
  .sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const door = frontCells[Math.floor(frontCells.length / 2)];
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

// glass in a wall that runs along x (north or south face) connects east-west, and the reverse for east or west faces
const pane = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([8, 22, 10]);
const P = (x, y, z, b, s) => g.set(x, y, z, b, s);

// interior first: storey floor at y 4 and the roof deck at each cell's top, then the walls overwrite the ring
for (const [x, z, gr, R] of cells) {
  const T = R >= 8 ? 8 : R - 1;          // lidar 8 and 9 are noise on one flat tier; only the 7 wing steps down                       // top block row of this cell (roof height R above y 0)
  for (let y = 0; y < gr; y++) P(x, y, z, BASE);   // foundation up to the cell's ground (none here: ground is 0)
  P(x, 0, z, BASE);
  P(x, 4, z, FLOOR);
  P(x, T, z, FLOOR);
}

for (const [x, z, , R] of cells) {
  const T = R >= 8 ? 8 : R - 1;          // lidar 8 and 9 are noise on one flat tier; only the 7 wing steps down
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const single = ex.length === 1 ? ex[0] : null;
  const u = single ? along(single, x, z) : -1;
  const pier = !single || u % 3 === 0;   // corners and every third cell are brick piers
  const shop = single === front;
  for (let y = 0; y <= T; y++) {
    if (y === 0) { P(x, y, z, BASE); continue; }
    if (y === T) { P(x, y, z, T === 8 ? WALL : TRIM); continue; }   // parapet on the tall tier, cornice on the wing
    if (y === 1 || y === 2) {
      if (isDoor(x, z)) P(x, y, z, "dark_oak_door", { facing: FACING[front], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (pier) P(x, y, z, shop ? SHOP : WALL);
      else P(x, y, z, "glass_pane", pane(single));
      continue;
    }
    if (y === 3) {
      if (isDoor(x, z)) P(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });   // lamp over the door
      else P(x, y, z, TRIM);                                                              // ground-storey fascia
      continue;
    }
    if (y === 4) { P(x, y, z, !pier ? TRIM : WALL); continue; }   // sills and brick between
    if (y === 7 && T === 8) { P(x, y, z, TRIM); continue; }       // lintel band under the parapet
    if (y >= 5 && y < T) { P(x, y, z, pier ? WALL : "glass_pane", pier ? undefined : pane(single)); }
  }
}

// warm light: glowstone one block inside some windows, on interior cells only, so the glass shows a lit room at dusk
for (const [x, z, , R] of cells) {
  const T = R >= 8 ? 8 : R - 1;          // lidar 8 and 9 are noise on one flat tier; only the 7 wing steps down
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0];
  if (along(d, x, z) % 3 === 0) continue;
  const [dx, dz] = DIR[d];
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || exposed(ix, iz).length) continue;   // the cell inside must be interior
  if (isDoor(x, z)) continue;
  if (d === front && (x + z) % 2 === 0) P(ix, 1, iz, "glowstone");
  else if (d !== front && (x * 3 + z * 5) % 4 === 0 && T >= 6) P(ix, 5, iz, "glowstone");
}

// roof plant: a stone box on the four interior cells of the tallest tier, with a coping slab
for (const [x, z, , R] of cells) {
  if (R !== 9 || exposed(x, z).length) continue;
  if (x >= 3 && x <= 4 && z >= 3 && z <= 4) {
    P(x, 9, z, "stone_bricks");
    P(x, 10, z, "stone_bricks");
    P(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = g.save(`${HERE}/way_1095572154.nbt`);
console.log(JSON.stringify({ front, door, blocks: out.blocks, palette: out.palette }));
