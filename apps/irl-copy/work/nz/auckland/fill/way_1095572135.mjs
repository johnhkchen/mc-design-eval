import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 1095572135: an Edwardian brick commercial block (c. 1910s-20s) on a corner. Timber shopfronts on the two street
// faces (-z and -x), brick upper floors with stone quoins, smooth-stone string courses at 4 and 7, a stone cornice and
// a brick parapet on the main 10-block body (11 to the top of the parapet), and lower wings stepping down to 7-9 blocks.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572135.cells.json", "utf8"));
const W = 12, D = 10, H = 23;

const top = Array.from({ length: W }, () => Array(D).fill(-1));     // roof height above y0 per footprint cell; -1 = outside
const ground = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) { top[x][z] = r; ground[x][z] = g; }

const topAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : top[x][z]);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const inFp = (x, z) => topAt(x, z) >= 0;
const outsideFace = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
// the faces open to the air at height y: a neighbour outside the footprint, or one whose roof is at or below y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const isWall = (x, y, z) => inFp(x, z) && y < top[x][z] && exposed(x, y, z).length > 0;
// floor lines: the ground floor, a string course at 4, and a second at 7 on the main body only
const floorsOf = (R) => (R >= 10 ? [0, 4, 7] : [0, 4]);
const isStreet = (E) => E.some(([dx, dz]) => dz === -1 || dx === -1);

const g = new Voxels([W, H, D]);
const glow = new Set();   // interior cells behind a lit window (filled after the walls)
const key = (x, y, z) => `${x},${y},${z}`;

// the shopfront entrance: the street face cell at the top-left of the -z face
const DOOR = [2, 0];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const R = top[x][z], cap = R - 1, fl = floorsOf(R);
  for (let y = 0; y < ground[x][z]; y++) g.set(x, y, z, "stone_bricks");   // foundation under any ground above y0
  for (let y = 0; y < R; y++) {
    if (!isWall(x, y, z)) continue;
    const E = exposed(x, y, z);
    const street = isStreet(E);
    const dzFace = E.some(([, dz]) => dz !== 0);           // runs along x
    const bay = dzFace ? x : z;                             // bays repeat along the face
    const corner = E.length > 1;
    const above = fl.find((f) => f > y);                    // the next floor line, undefined in the top storey
    const lintel = above !== undefined && y === above - 1;

    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                      // base course
    if (y === cap) { g.set(x, y, z, "stone_bricks"); continue; }                    // cornice
    if (fl.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }               // string course
    if (y === 1) { g.set(x, y, z, street ? "dark_oak_planks" : "bricks"); continue; }  // sill / shopfront bulkhead
    if (x === DOOR[0] && z === DOOR[1] && street && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR[0] && z === DOOR[1] && y === 3) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (corner) { g.set(x, y, z, y % 2 ? "bricks" : "stone_bricks"); continue; }    // quoins, laid stone and brick
    if (lintel) { g.set(x, y, z, "bricks"); continue; }                             // window heads
    if (bay % 4 === 0) { g.set(x, y, z, street && y <= 3 ? "stone_bricks" : "bricks"); continue; }   // piers, three panes between
    const pane = dzFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", pane);
    if ((x * 7 + y * 5 + z * 3) % 4 === 0) {                                        // a lit room behind this window
      const [dx, dz] = E[0];
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && y < top[ix][iz] && !isWall(ix, y, iz)) glow.add(key(ix, y, iz));
    }
  }
  // parapet on the main body's outside edge: one brick course to 11 blocks
  if (R === 10 && outsideFace(x, z)) g.set(x, 10, z, "bricks");
  // roof plant on the main body's interior: a low concrete plant room
  if (R === 10 && !outsideFace(x, z) && x >= 4 && x <= 6 && z >= 4 && z <= 5) g.set(x, 10, z, "light_gray_concrete");
}

// the interior, once every wall is placed (the lit rooms are known): a stone ground floor, floor slabs at the storey
// lines, a roof slab; air between, so there are no rooms, only the gap behind the glass
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const R = top[x][z], fl = floorsOf(R);
  for (let y = 0; y < R; y++) {
    if (isWall(x, y, z)) continue;
    if (glow.has(key(x, y, z))) g.set(x, y, z, "glowstone");
    else if (y === 0 || y === R - 1) g.set(x, y, z, "stone_bricks");
    else if (fl.includes(y)) g.set(x, y, z, "smooth_stone");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572135.nbt";
const info = g.save(out);
console.log(JSON.stringify({ out, ...info, glow: glow.size }));
