// DC83078: vacant brick commercial block at 2 I St SE, Washington DC 20003, as a 1.21.1 module.
// Lidar roof heights top out at 4 blocks above y 0 (about 9 m at 0.42 blocks a metre), so this is a two-storey
// brick block with a stone storey line and parapet, not a tower: a shopfront storey (y 1), a storey line (y 2),
// upper windows (y 3) and a coping (y 4). Heights are a 3x3 mean of the footprint's roof cells, snapped to
// 1-4 tiers, with the outer ring kept at least one block high. A 0-height interior is an open lawned light court.
// Walls are one block thick with an air gap behind the glass, floors and roof are slabs on columns, and every
// block stands on the paving at y 0 or on the course below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC83078.cells.json`, "utf8"));
const OUT = `${DIR}/DC83078.nbt`;

const X = 26, Z = 36, Y = 6;
// Palette: red brick walls, pale stone trim and coping, dark granite piers at the shopfront, glass in the openings.
const BRICK = "bricks", TRIM = "smooth_stone", PIER = "polished_granite", COPING = "stone_bricks";
const PAVE = "stone_bricks", LAWN = "grass_block", ROOF = "gray_concrete", COLUMN = "polished_andesite";
const GLASS = "glass_pane", DOOR = "dark_oak_door", LAMP = "lantern", GLOW = "glowstone", UNIT = "iron_block";

const key = (x, z) => `${x},${z}`;
const roofRaw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => roofRaw.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // +x east, -x west, +z south, -z north (I St on the north edge)

// Massing: 5x5 mean of the footprint's lidar roof cells (lidar speckle averages out), snapped to tiers;
// the outer ring is at least 1 block high.
const H = new Map();
for (const [k] of roofRaw) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const r = roofRaw.get(key(x + dx, z + dz)); if (r !== undefined) { s += r; n++; }
  }
  const m = s / n;
  H.set(k, m >= 2.7 ? 4 : m >= 2.1 ? 3 : m >= 1.4 ? 2 : m >= 0.6 ? 1 : 0);
}
for (const [k] of H) {
  const [x, z] = k.split(",").map(Number);
  if (H.get(k) === 0 && DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) H.set(k, 1);
}
const hOf = (x, z) => (inF(x, z) ? H.get(key(x, z)) : -1);   // -1 outside the footprint

// Shell = a built cell with an outside, courtyard or lower neighbour; depth 1 is the shell, depth 2+ the interior.
const built = (x, z) => hOf(x, z) > 0;
const depth = new Map();
const queue = [];
for (const [k, h] of H) {
  if (h <= 0) continue;
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => hOf(x + dx, z + dz) < h)) { depth.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (built(nx, nz) && !depth.has(nk)) { depth.set(nk, d + 1); queue.push([nx, nz]); }
  }
}

// Doorway on the north (street) frontage: the middle cell of the north edge that is two storeys or taller.
const north = [...H].filter(([k, h]) => h >= 2 && k.endsWith(",0")).map(([k]) => Number(k.split(",")[0]));
const doorX = north.length ? north[north.length >> 1] : -1;

const G = new Map();                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return;
  G.set(`${x},${y},${z}`, { block, state });
};

// Walls: which faces of a shell cell are exposed at level y (the neighbour is lower than y, or outside).
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => y > hOf(x + dx, z + dz));
const DIRNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

for (const [k, h] of H) {
  if (h <= 0) continue;
  const [x, z] = k.split(",").map(Number);
  const dpt = depth.get(k);
  put(x, 0, z, PAVE);                       // footing and paving: every footprint cell rests on y 0

  if (dpt === 1) {
    for (let y = 1; y <= h; y++) {
      const faces = exposedDirs(x, z, y);
      if (y === h && h >= 2) { put(x, y, z, COPING); continue; }   // coping on the walls
      if (y === h) { put(x, y, z, BRICK); continue; }              // a one-block wing is all brick
      if (!faces.length) { put(x, y, z, BRICK); continue; }  // a wall that is built on the neighbour below
      const [dx, dz] = faces[0];
      const a = dz !== 0 ? x : z;                          // position along this face
      const pier = a % 3 === 0;
      const isStreet = dz === -1 && z === 0;
      if (isStreet && x === doorX && y <= 2) {
        if (y === 1) put(x, y, z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 1) { put(x, y, z, pier ? PIER : GLASS); continue; }                       // shopfront
      if (h === 4 && y === 2) { put(x, y, z, TRIM); continue; }                           // storey line
      const wy = h === 4 ? 3 : h === 3 ? 2 : 0;
      if (y === wy) { put(x, y, z, pier ? BRICK : GLASS); continue; }                     // upper windows
      put(x, y, z, BRICK);
    }
  } else {
    // Interior: air except a floor slab over the ground storey (two-storey tiers), columns on a 3-block grid and the roof.
    for (let y = 1; y < h; y++) {
      if (h === 4 && y === 2) put(x, y, z, TRIM);
      else if (dpt >= 3 && x % 3 === 1 && z % 3 === 1) put(x, y, z, COLUMN);
    }
    put(x, h, z, ROOF);
  }
}

// Courtyard: zero-height cells inside the footprint are a lawned light court on the paving level.
for (const [k, h] of H) if (h === 0) { const [x, z] = k.split(",").map(Number); put(x, 0, z, LAWN); }

// Warm light: lanterns hung from the roof behind some upper windows, glowstone on the floor behind some shopfront glass.
for (const [k, h] of H) {
  if (depth.get(k) !== 1) continue;
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of exposedDirs(x, z, 1)) {
    const a = dz !== 0 ? x : z;
    const ix = x - dx, iz = z - dz;                    // the cell inside this face
    if (depth.get(key(ix, iz)) !== 2) continue;
    if (a % 6 === 1 && h >= 2) put(ix, 1, iz, GLOW);
    const wy = h === 4 ? 3 : h === 3 ? 2 : 0;
    if (wy && a % 6 === 2) put(ix, wy, iz, LAMP, { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant: two air-conditioning units on the top roof, standing on the roof slab.
for (const [k, h] of H) {
  if (h !== 4 || depth.get(k) < 3) continue;
  const [x, z] = k.split(",").map(Number);
  if (x % 6 === 3 && z % 6 === 3) put(x, 5, z, UNIT);
}

// Glass panes connect to whatever is beside them, as they do in the game.
const has = (x, y, z) => G.has(`${x},${y},${z}`);
for (const [k, { block }] of G) {
  if (block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  G.set(k, { block, state: { north: String(has(x, y, z - 1)), south: String(has(x, y, z + 1)), east: String(has(x + 1, y, z)), west: String(has(x - 1, y, z)), waterlogged: "false" } });
}

const v = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of G) {
  const [x, y, z] = k.split(",").map(Number);
  v.set(x, y, z, block, state);
}
const stats = v.save(OUT);
console.log(`DC83078: ${stats.blocks} blocks, ${stats.palette} palette entries, door at x=${doorX}`);
console.log(`heights:`); for (let z = 0; z < Z; z++) { let s = ""; for (let x = 0; x < X; x++) { const h = hOf(x, z); s += h < 0 ? " ." : ` ${h}`; } console.log(s); }
