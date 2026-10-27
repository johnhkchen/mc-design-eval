// A 1930s red-brick shop-and-flat block on Mt Eden / Eden Terrace: a three-storey tower on the north half (lidar roof
// 11) over a two-storey wing to the south (lidar roof 10, the 9s are noise). Shopfront glass on the ground floor, sash-
// style glass bays on the upper floors with cream render bands, sills and a cornice, a parapet on the tower, a flat roof
// with a plant room. Warm light sits behind about a quarter of the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736326.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..15, z 0..17

const WALL = "bricks", BASE = "stone_bricks", TRIM = "smooth_quartz", QUOIN = "smooth_quartz", ROOF = "gray_concrete";
const GLOW = "glowstone", AIR = "air";
// a pane joins its neighbours along the wall it sits in: east/west on a north or south face, north/south on an east or west one
const PANE = (along) => ({ north: String(along === "z"), south: String(along === "z"), east: String(along === "x"), west: String(along === "x"), waterlogged: "false" });

const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => F.has(`${x},${z}`);
// the lidar roof, smoothed over its 3x3 neighbourhood and cut to two flat tiers: the tower (11) and the wing (10)
const smooth = (x, z) => { let s = 0, n = 0; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = F.get(`${x + dx},${z + dz}`); if (c) { s += c.r; n++; } } return s / n; };
const H = (x, z) => (smooth(x, z) >= 10.5 ? 11 : 10);
// outward unit steps for the four faces: N (z-1), S (z+1), W (x-1), E (x+1)
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

const g = new Voxels([16, 24, 18]);
const over = new Map();                       // "x,y,z" -> block | [block, state]: pockets, door, lamps, plant room
const put = (x, y, z, block, state) => over.set(`${x},${y},${z}`, [block, state]);

for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  const h = H(x, z);
  const out = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));                     // faces onto the street
  const step = DIRS.filter(([dx, dz]) => inF(x + dx, z + dz) && H(x + dx, z + dz) < h);   // faces up over the wing roof
  const corner = out.length >= 2;
  const ring = out.length > 0;
  const stepY = step.length ? Math.min(...step.map(([dx, dz]) => H(x + dx, z + dz))) : -1;
  // the face a bay runs along: the first outward face (N/S runs along x, E/W along z)
  const face = out[0];
  const along = face && face[0] === 0 ? x : z;     // x along N/S faces, z along E/W faces
  const pier = ring && !corner && along % 3 === 0; // every third cell is a brick pier
  for (let y = 0; y < h; y++) {
    let block = WALL, state;
    if (ring) {
      if (corner) block = y % 2 === 0 ? QUOIN : WALL;                              // quoins at the corners
      if (y === 0) block = BASE;                                                   // base course
      else if (y === h - 1) block = TRIM;                                          // cornice
      else if (y === 3 || y === 7) block = TRIM;                                   // storey bands
      else if (!corner && !pier && winLayer(y, h)) {
        block = "glass_pane"; state = PANE(face[0] === 0 ? "x" : "z");
        const [dx, dz] = face; const ix = x - dx, iz = z - dz;                     // the air pocket behind the glass
        put(ix, y, iz, (x * 7 + z * 3 + y * 5) % 4 === 0 ? GLOW : AIR);
      }
    } else if (stepY >= 0 && y === stepY) block = TRIM;                            // the first course over the wing roof
    else if (y === h - 1) block = ROOF;                                            // flat roof membrane
    if (block !== WALL || state) put(x, y, z, block, state);
  }
  if (ring && h === 11) put(x, 11, z, TRIM);                                       // parapet course above the tower
}

function winLayer(y, h) {
  return y === 1 || y === 2 || y === 5 || y === 6 || ((y === 8 || y === 9) && h === 11 && y < h - 1);
}

// the entrance: a door in the north face at x 4, a glass transom, and a one-cell vestibule with a hanging lantern
const DOOR_X = 4, DOOR_Z = 0;
put(DOOR_X, 0, DOOR_Z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 1, DOOR_Z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 2, DOOR_Z, "glass_pane", PANE("x"));
for (let y = 0; y < 3; y++) put(DOOR_X, y, DOOR_Z + 1, AIR);
put(DOOR_X, 2, DOOR_Z + 1, "lantern", { hanging: "true", waterlogged: "false" });

// the plant room: a 2 x 2 box on the tower roof, cut from the most central interior tower cells
const interiorTower = (x, z) => inF(x, z) && H(x, z) === 11 && DIRS.every(([dx, dz]) => inF(x + dx, z + dz) && H(x + dx, z + dz) === 11);
let best = null;
for (let x = 1; x < 14; x++) for (let z = 1; z < 14; z++) {
  if (![[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => interiorTower(a, b))) continue;
  const d = Math.abs(x + 0.5 - 8) + Math.abs(z + 0.5 - 6);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  for (let y = 11; y < 14; y++) put(best.x + dx, y, best.z + dz, "light_gray_concrete");   // plant room: plain service walls, not a chimney stack
  put(best.x + dx, 14, best.z + dz, TRIM);
}

// the massing: solid brick up to each cell's tier, then the overrides on top
for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  const h = H(x, z);
  for (let y = 0; y < h; y++) g.set(x, y, z, WALL);
}
for (const [k, [block, state]] of over) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736326.nbt");
