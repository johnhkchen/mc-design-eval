import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1240 9th St NW, Industrial-Misc.: a 1900s brick warehouse on a stone base. Its lidar record reads as a
// low wing (5), a lower street-side range (3-4) with a taller front parapet (6), and one 16-high tower over
// the west-centre. Storeys are 3-block modules: a string course, two rows of window between piers, then the next.
// z = 0 is the street (front) face. A single 16-high cell between 5-high neighbours is a stray return, so it
// is smoothed down to the wing.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72982.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 17, D = 4, Y = 28;
const g = new Voxels([W, Y, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roof.set(key(x, z), r); }
roof.set(key(3, 1), 5); // the stray spike

const foot = (x, z) => roof.has(key(x, z));
const top = (x, z) => roof.get(key(x, z));                 // solid up to (not including) this y
const M = (x, y, z) => foot(x, z) && y >= 0 && y < top(x, z); // the massing, foundation included
const band = (y) => y % 3 === 0;                            // base course (y 0), then a string course every 3
const cap = (x, y, z) => y === top(x, z) - 1;               // the top course of each tier: parapet / roof deck

// the air gap: a cell with solid all round (sides, above, below in the storey) is hollow, sealed inside the wall
const hollow = (x, y, z) => M(x, y, z) && y > 0 && !band(y) && !cap(x, y, z) &&
  M(x - 1, y, z) && M(x + 1, y, z) && M(x, y, z - 1) && M(x, y, z + 1) && M(x, y + 1, z);
const shell = (x, y, z) => M(x, y, z) && !hollow(x, y, z);

// glass panes join along their wall: east-west on a z face, north-south on an x face
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

// the door: a 2-high entrance on the street face, with stone jambs
const DOOR_X = 11;
const door = (y) => ({ id: "oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });

// the outward face a shell cell shows (null if it is all round solid), and the cell just inside it
const OUT = [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]];
function exposedFaces(x, y, z) {
  const out = [];
  for (const [dx, dy, dz] of OUT) if (!M(x + dx, y, z + dz)) out.push([dx, dy, dz]);
  return out;
}

// what goes in one shell cell
function block(x, y, z) {
  const onRoof = !M(x, y + 1, z);
  if (cap(x, y, z)) return { id: "smooth_stone" };         // parapet / roof deck top
  if (y === 0 || band(y)) return { id: "stone_bricks" };  // base course and string courses
  const faces = exposedFaces(x, y, z);
  if (!faces.length) return onRoof ? { id: "smooth_stone" } : { id: "bricks" };
  const [dx, , dz] = faces[0];
  const onZ = dz !== 0;
  const i = onZ ? x : z;                                   // position along the face
  // the street-front entrance bay
  if (onZ && dz === -1 && x === DOOR_X && (y === 1 || y === 2)) return door(y);
  if (onZ && dz === -1 && (x === DOOR_X - 1 || x === DOOR_X + 1) && (y === 1 || y === 2)) return { id: "stone_bricks" };
  if (i % 2 === 0) return { id: "bricks" };                // brick piers between the windows
  // a window: glass with air behind it (the hollow cell inside), a warm light in some of them
  const inX = onZ ? x : x - faces[0][0], inZ = onZ ? z - dz : z;
  if (!hollow(inX, y, inZ)) return { id: "bricks" };
  const lit = (x * 7 + y * 3) % 5 === 0 ? [inX, inZ] : null;
  return { id: "glass_pane", state: pane(onZ), lit };
}

const put = (x, y, z, id, state) => g.set(x, y, z, id, state);

// the ground: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

for (const [x, z] of cells) {
  for (let y = 0; y < top(x, z); y++) {
    if (hollow(x, y, z)) continue;
    const b = block(x, y, z);
    if (!b) continue;
    put(x, y, z, b.id, b.state);
    // a lit window: the glowstone sits in the air gap behind the glass
    if (b.lit) put(b.lit[0], y, b.lit[1], "glowstone");
  }
}

// roof equipment on the flat tiers: an air-handler on the wing, a brick flue on the tower
put(2, 5, 2, "iron_block");
put(12, 4, 2, "iron_block");
put(6, 16, 1, "bricks"); put(6, 17, 1, "bricks");

const res = g.save(`${DIR}/DC72982.nbt`);
console.log(`DC72982: ${res.blocks} blocks, ${res.palette} palette entries`);
