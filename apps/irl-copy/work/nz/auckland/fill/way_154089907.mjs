import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1980s concrete-frame office block on Queen Street's edge: eight storeys over a ground-floor shopfront and lobby,
// a four-storey wing to the south, a six-storey wing to the north, and a plant-topped core in the middle.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089907.cells.json", "utf8"));

// The lidar roof (height above y 0) smoothed into four flat tiers; cells under 12 are noise and take the body.
// rt is each cell's top block: roof height minus one.
const tierRoof = (r) => (r < 12 ? 33 : r >= 35 ? 36 : r >= 30 ? 33 : r >= 25 ? 27 : 16);
const FOOT = new Map();
for (const [x, z, , r] of cells) FOOT.set(`${x},${z}`, { rt: tierRoof(r) - 1 });
const cell = (x, z) => FOOT.get(`${x},${z}`);

const g = new Voxels([33, 49, 32]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// the side of (x, z) at height y that is open to the outside or to a lower roof; null where the cell is interior
function side(x, z, y) {
  for (const [face, dx, dz] of SIDES) {
    const n = cell(x + dx, z + dz);
    if (!n || n.rt < y) return face;
  }
  return null;
}
const isWall = (x, z, y) => !!cell(x, z) && side(x, z, y) !== null;

// storey rows: y % 4 == 0 is the floor deck; rows 1-3 are the storey: glass with mullions, a lintel band at 3;
// the ground storey has a base course at row 1 and a dark fascia at row 3
function facade(face, x, y, z) {
  const u = face === "N" || face === "S" ? x : z;
  const k = Math.floor(y / 4), j = y % 4;
  if (k === 0 && j === 1) return "polished_andesite";
  if (u % 3 === 0) return "light_gray_concrete";
  if (j === 3) return k === 0 ? "black_concrete" : "white_concrete";
  return "light_blue_stained_glass";
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { rt } = cell(x, z);
  for (let y = 0; y <= rt; y++) {
    const face = side(x, z, y);
    if (y === 0) put(x, y, z, "stone_bricks");                                   // foundation under every cell
    else if (y === rt) put(x, y, z, face ? "smooth_stone" : "gray_concrete");   // cornice on the edge, membrane inside
    else if (y % 4 === 0) put(x, y, z, face ? "white_concrete" : "light_gray_concrete");  // floor deck, spandrel on the edge
    else if (face) put(x, y, z, facade(face, x, y, z));
  }
}

// warm lanterns hang from the deck above, a step inside the glass, on the even storeys
const hangOf = (x, z, y) => ({ hanging: "true", waterlogged: "false" });
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (let k = 0; k <= 7; k += 2) {
  const y = 4 * k + 3;
  if (cell(x, z).rt < 4 * k + 4 || isWall(x, z, y) || (x + z) % 6 !== 0) continue;
  if (!SIDES.some(([, dx, dz]) => isWall(x + dx, z + dz, y))) continue;
  put(x, y, z, "lantern", hangOf(x, z, y));
}

// the entrance: a door on the nearest outward-facing wall cell of the south (else any) side, its canopy band above
const FACING = { N: "north", S: "south", W: "west", E: "east" };
let door = null;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const f = side(x, z, 1);
  if (!f) continue;
  const score = (f === "S" ? 0 : 100) + Math.abs(x - 16);
  if (!door || score < door.score) door = { x, z, f, score };
}
const dState = (half) => ({ facing: FACING[door.f], half, hinge: "left", open: "false", powered: "false" });
put(door.x, 1, door.z, "dark_oak_door", dState("lower"));
put(door.x, 2, door.z, "dark_oak_door", dState("upper"));
const along = door.f === "E" || door.f === "W" ? [0, 1] : [1, 0];   // the wall's direction, so the band runs along the face
for (let d = -2; d <= 2; d++) {
  const x = door.x + along[0] * d, z = door.z + along[1] * d;
  if (isWall(x, z, 3)) put(x, 3, z, "black_concrete");
}

// roof equipment on the body's roof (cells topped at 32, the core and wings excluded): 2x2 plant boxes, spaced
const onBody = (x, z) => cell(x, z)?.rt === 32;
let boxes = 0;
for (let z0 = 2; z0 < 28 && boxes < 4; z0 += 6) for (let x0 = 2; x0 < 30 && boxes < 4; x0 += 6) {
  if (![[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]].every(([x, z]) => onBody(x, z))) continue;
  boxes++;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) for (let y = 33; y <= 34; y++) put(x0 + dx, y, z0 + dz, "light_gray_concrete");
}

// the core's plant room: a 7 x 5 box on the 35-high core, walls to 38, a roof at 39
const core = cells.filter(([x, z]) => cell(x, z).rt === 35);
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length);
const cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 2; z <= cz + 2; z++) {
  if (cell(x, z)?.rt !== 35) continue;
  const edge = Math.abs(x - cx) === 3 || Math.abs(z - cz) === 2;
  if (edge) for (let y = 36; y <= 38; y++) put(x, y, z, "light_gray_concrete");   // hollow inside, a roof over it
  put(x, 39, z, "gray_concrete");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089907.nbt");
