// NYC1035400: 4 East 46 Street, a 1939 commercial & office block (Moderne, pale stone piers, dark glass, granite base).
// Massing from the lidar roof record: the street end (z 0-9) and the west party-wall fin (x 0) rise to 24 blocks (8 storeys
// of 3); the rear (z 10-22) steps down to 21 (7 storeys). The z 9 partition is the setback face above the rear roof.
// Solid shell: the footprint ring, the partition, and a floor slab per storey; interior air sits behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035400.cells.json`, "utf8"));

const X = 8, Z = 23, SETBACK = 9;
const PIER = "smooth_quartz", SPANDREL = "polished_andesite", BASE = "polished_granite", PANE = "light_blue_stained_glass_pane";
const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const inFootprint = (x, z) => footprint.has(key(x, z));

// Heights from the lidar: street end and west fin 24, rear 21 (the 20-22 readings and a 0 dropout at 5,16 smooth to 21).
const H = (x, z) => (x === 0 || z <= SETBACK ? 24 : 21);
const ring = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const partition = (x, z) => z === SETBACK && x > 0 && x < X - 1;
const wall = (x, z, y) => y < H(x, z) && (ring(x, z) || partition(x, z));

// Which face a wall cell sits on: u runs along it (x on the street and back faces, z on the sides), and piers mark the bay grid.
function faceOf(x, z) {
  if (z === 0 || z === Z - 1 || partition(x, z)) return { u: x, last: X - 1 };
  return { u: z, last: Z - 1 };
}
const inward = (x, z) => (z === 0 ? [0, 1] : z === Z - 1 || partition(x, z) ? [0, -1] : x === 0 ? [1, 0] : [-1, 0]);

// Window bays: 2 glass, 1 pier (corners and every third column are piers). The street face has a shopfront and a door at x 3.
function isPane(x, z, y) {
  if (!wall(x, z, y) || y === 0 || y === H(x, z) - 1 || y % 3 === 0) return false;
  if (z === 0 && y < 3) return false;
  const { u, last } = faceOf(x, z);
  return !(u % 3 === 0 || u === last);
}

function paneState(x, z, y) {
  const win = (a, b) => isPane(a, b, y) ? "true" : "false";
  const zFace = z === 0 || z === Z - 1 || partition(x, z);
  return zFace
    ? { east: win(x + 1, z), west: win(x - 1, z), north: "false", south: "false", waterlogged: "false" }
    : { north: win(x, z - 1), south: win(x, z + 1), east: "false", west: "false", waterlogged: "false" };
}

function skin(x, z, y) {
  const h = H(x, z), { u, last } = faceOf(x, z);
  if (y === 0 || y === h - 1) return [BASE];                          // base course and cornice
  if (z === 0 && x === 3 && (y === 1 || y === 2)) {                   // street entrance, double iron door
    return ["iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 3 && z === 0 && x >= 2 && x <= 5) return [BASE];          // entrance canopy lintel
  if (y % 3 === 0) return [SPANDREL];                                 // storey line
  if (u % 3 === 0 || u === last) return [y < 3 ? BASE : PIER];        // piers, granite at the base
  if (z === 0 && y < 3) return ["glass"];                             // shopfront glass
  return [PANE, paneState(x, z, y)];
}

const g = new Voxels([X, 24, Z]);

// Foundation to each cell's ground (all 0 on this footprint, so nothing is added), then the shell and the floors.
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFootprint(x, z)) continue;
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    if (wall(x, z, y)) { const [b, s] = skin(x, z, y); g.set(x, y, z, b, s); }
    else if (y % 3 === 0 && y < h - 1) g.set(x, y, z, "smooth_stone");   // a floor slab per storey
    else if (y === h - 1) g.set(x, y, z, "deepslate_tiles");             // tar roof on the interior
  }
}

// Warm light behind some glass on the storeys above the street: glowstone on the inside of a lit pane's bottom row.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFootprint(x, z)) continue;
  for (let y = 1; y < H(x, z); y++) {
    if (!isPane(x, z, y) || y % 3 !== 1 || (x + z + Math.floor(y / 3)) % 4 !== 0) continue;
    const [dx, dz] = inward(x, z), nx = x + dx, nz = z + dz;
    if (inFootprint(nx, nz) && !wall(nx, nz, y)) g.set(nx, y, nz, "glowstone");
  }
}

// Lanterns hanging from the ceilings of the entrance and the shop.
for (const [x, y, z] of [[3, 2, 1], [2, 2, 2], [5, 2, 2]]) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a plant room block at the rear and a ventilation stack.
for (let y = 21; y <= 22; y++) for (let x = 3; x <= 4; x++) for (let z = 13; z <= 15; z++) g.set(x, y, z, PIER);
for (let x = 3; x <= 4; x++) for (let z = 13; z <= 15; z++) g.set(x, 23, z, BASE);
for (let y = 21; y <= 22; y++) g.set(6, y, 18, "waxed_oxidized_copper");

const out = `${dir}/NYC1035400.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries, size ${g.size.join(" x ")}`);
