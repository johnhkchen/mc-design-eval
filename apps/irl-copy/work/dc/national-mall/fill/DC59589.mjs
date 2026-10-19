// DC59589: 425 2nd St NW, a 1920s red-brick Residential-Transient block (rooming house or small hotel) in the
// Judiciary Square edge of the city. Read from the lidar record: a 16 x 52 slab whose wings stand at 6 blocks (three
// storeys of 2 blocks), a 7-block middle band, and an 8-block core on the west side with a 2-block mechanical penthouse.
// Load-bearing red brick (bricks) with white stone bands, cornices and parapets (calcite), a stone_bricks plinth, glass
// panes in brick piers, one dark-oak door on the north face under a calcite lintel, two brick chimneys and a pair of
// iron AC units on the wing roof. Warm lights (glowstone, lanterns) sit in some rooms behind the glass.
//
// Storeys sit on absolute rows: even rows are stone bands (floor lines), odd rows are windows, and the top two rows are a
// cornice and parapet. Each column fills from y 0 to its ground as foundation, then its storey rows up to its lidar tier.
// A wall face is exterior where the neighbour is outside the footprint or stands lower than this row, so setbacks get
// their own walls and cornices. Interior cells are air at window rows, with a solid floor slab at each band and a solid roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59589.cells.json`, "utf8"));
const W = 16, D = 52, H = 12;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const OPPOSITE = { N: "S", S: "N", W: "E", E: "W" };

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise), then three flat tiers: 6, 7 and 8 blocks.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s >= 8 ? 8 : s === 7 ? 7 : 6;
};

const cell = new Map();
for (const [x, z, G] of cells) cell.set(key(x, z), { x, z, g: G, T: tierOf(x, z) });
const at = (x, z) => cell.get(key(x, z));
// The height a neighbour stands to: 0 outside the footprint (a wall runs all the way down), its tier inside.
const topOf = (x, z) => (inside(x, z) ? at(x, z).T : 0);

// Exterior faces of cell c at row y: a neighbour outside the footprint, or one whose roof is below this row.
const exteriorFaces = (c, y) => FACES.filter(([, dx, dz]) => y >= topOf(c.x + dx, c.z + dz)).map(([f]) => f);
// Piers every third cell: by x on the north and south faces, by z on the east and west faces.
const isPierFace = (c, f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0;

const DOOR = { x: 13, z: 0 };
const LINTEL = { x: 13, z: 0, y: 3 };

const FOUND = "stone", PLINTH = "stone_bricks", WALL = "bricks", BAND = "calcite", FLOOR = "stone", ROOF = "gray_concrete", PANE = "glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR_STATE = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// The block at one cell and row, decided by its exterior faces and its storey row.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [FOUND];
  const ef = exteriorFaces(c, y);
  if (ef.length === 0) {                                                     // interior: floor slabs and roof deck, air at window rows
    if (y === T - 1) return [ROOF];
    return y % 2 === 0 ? [FLOOR] : null;
  }
  if (y === 0) return [PLINTH];
  if (y === T - 1) return [BAND];                                             // parapet on the exterior
  if (y === T - 2) return [BAND];                                             // cornice
  if (y % 2 === 0) return [BAND];                                             // stone floor line
  if (ef.some((f) => isPierFace(c, f))) return [WALL];
  const f = ef.find((face) => !isPierFace(c, face));
  const ns = f === "N" || f === "S";
  return [PANE, { north: ns ? "false" : "true", south: ns ? "false" : "true", east: ns ? "true" : "false", west: ns ? "true" : "false" }];
};

for (const c of cell.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (b) put(c.x, y, c.z, b[0], b[1]);
  }
}

// Entrance: a dark oak door on the north face, two blocks tall, on the plinth, under a calcite lintel.
put(DOOR.x, 1, DOOR.z, "dark_oak_door", DOOR_STATE("lower"));
put(DOOR.x, 2, DOOR.z, "dark_oak_door", DOOR_STATE("upper"));
put(LINTEL.x, LINTEL.y, LINTEL.z, BAND);

// Warm light in rooms behind some windows: glowstone on the floor-line row, lanterns standing on the floor slab.
for (const c of cell.values()) {
  for (let y = 1; y < c.T - 2; y += 2) {
    if (c.x === DOOR.x && c.z === DOOR.z) continue;
    const ef = exteriorFaces(c, y);
    if (!ef.length || ef.some((f) => isPierFace(c, f))) continue;
    const f = ef.find((face) => !isPierFace(c, face));
    const [, dx, dz] = FACES.find(([n]) => n === OPPOSITE[f]);                 // one step inward, away from the glass
    const ix = c.x + dx, iz = c.z + dz;
    if (!inside(ix, iz)) continue;
    const inner = at(ix, iz);
    if (exteriorFaces(inner, y).length) continue;                             // only rooms, not another wall
    const h = hash(c.x, y, c.z);
    if (h % 12 === 0) put(ix, y, iz, "glowstone");
    else if (h % 12 === 7) put(ix, y, iz, "lantern", LANTERN);
  }
}

// Roof: a 2-block mechanical penthouse on the west core, two brick chimneys and iron AC units on the wing roof.
for (let z = 4; z <= 9; z++) for (const x of [7, 8]) {
  put(x, 8, z, PLINTH);
  put(x, 9, z, BAND);
}
for (const [x, z] of [[3, 22], [12, 44]]) { put(x, 6, z, WALL); put(x, 7, z, WALL); }
for (const [x, z] of [[2, 14], [13, 14]]) put(x, 6, z, "iron_block");

const { blocks, palette } = v.save(`${DIR}/DC59589.nbt`);
console.log(`DC59589: ${blocks} blocks, palette ${palette}`);
