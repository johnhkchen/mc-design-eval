// DC63115: 1731 New Hampshire Ave NW, Washington DC 20009, as a 1.21.1 module. Hotel-large, read as a 1910s-20s brick
// hotel on a limestone base: a calcite plinth, a 3-block ground storey (shopfront glass, brick piers, the door on the
// north front), then 2-block storeys with calcite string courses, glass rows and brick piers, and a calcite cornice.
// The lidar roof is smoothed with a 3x3 median and snapped to tiers (3 for the low wing, 10, 11, 12 for the main mass),
// so the central block stands a storey proud. Everything is solid up to its own tier, so nothing floats; interiors are
// an air gap behind the glass with a floor slab per storey, and a few glowstone lamps sit behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63115.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/DC63115.nbt`;

const X = 21, Z = 20, Y = 24;
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
// [dx, dz, axis of the face, name]: the along-wall axis is x for a north/south face and z for an east/west face
const DIRS = [[0, -1, "x", "n"], [0, 1, "x", "s"], [1, 0, "z", "e"], [-1, 0, "z", "w"]];

// Tiers: the lidar roof's 5x5 mean (noise out; a 3x3 median checkerboards the parapet), snapped to the nearest of
// 3 (the low wing), 10 and 11 (the main mass). The core where the 3x3 median holds at 12 stands a storey proud.
const TIERS = [3, 10, 11];
const tier = new Map();
for (const c of F.values()) {
  const at = (rad, fn) => { const v = []; for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); } return fn(v); };
  const mean = at(2, (v) => v.reduce((a, b) => a + b, 0) / v.length);
  let t = TIERS.reduce((best, t) => (Math.abs(t - mean) < Math.abs(best - mean) ? t : best));
  if (t === 11 && at(1, (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; }) >= 12) t = 12;
  tier.set(key(c.x, c.z), t);
}
const T = (x, z) => (inF(x, z) ? tier.get(key(x, z)) : 0);

// A wall cell has a face to the outside (no footprint cell beside it) or a step down to a lower tier; its facade
// direction is the outward face if it has one, else the step face. Corners (two outward faces) are quoins.
const faceOf = (x, z) => {
  const out = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const step = DIRS.filter(([dx, dz]) => inF(x + dx, z + dz) && T(x + dx, z + dz) < T(x, z));
  return { out, step, wall: out.length + step.length > 0, facade: out[0] ?? step[0] };
};
const isCorner = (f) => f.out.some(([, , a]) => a === "x") && f.out.some(([, , a]) => a === "z");

// Palette
const BRICK = "bricks";                // the red-brick walls, piers between bays
const STONE = "calcite";               // limestone: plinth, string courses, quoins, cornice
const FLOOR = "smooth_stone";          // interior floor slabs, ground slab
const ROOF = "stone_bricks";           // roof deck
const GLASS = "glass_pane";
const LAMP = "glowstone";
const AC = "iron_block";               // roof units
const DOOR = "dark_oak_door";
const LANTERN = "lantern";

const g = new Voxels([X, Y, Z]);
const placed = new Map();              // "x,y,z" -> block name, for pane connections
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };

const STRINGS = [3, 5, 7, 9];          // storey lines: floor slabs inside
const STRING_STONE = [3];              // the wall's one limestone string course; the rest of the brick face is red brick
const isWindowRow = (y) => y >= 4 && y % 2 === 0;   // 4, 6, 8, 10
const DOOR_CELL = [9, 1], DOOR_FACING = "north";   // the front door on the north face

for (const c of F.values()) {
  const { x, z } = c;
  const Rc = T(x, z), f = faceOf(x, z);
  if (!f.wall) {
    // interior: ground slab, a floor slab per storey, the roof deck on top; the air between is the rooms
    for (let y = 0; y < Rc; y++) {
      if (y === 0 || (STRINGS.includes(y) && y < Rc - 1)) put(x, y, z, FLOOR);
      else if (y === Rc - 1) put(x, y, z, ROOF);
    }
    continue;
  }
  const [dx, dz, axis] = f.facade;
  const along = axis === "x" ? x : z;                // position along the facade
  const corner = isCorner(f);
  const pier = corner || along % 3 === 0;            // brick and quoin piers between window bays
  const isDoor = x === DOOR_CELL[0] && z === DOOR_CELL[1];
  for (let y = 0; y < Rc; y++) {
    if (isDoor && (y === 1 || y === 2)) {
      put(x, y, z, DOOR, { facing: DOOR_FACING, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (y === Rc - 1) {
      put(x, y, z, STONE);                           // cornice
    } else if (y === 0) {
      put(x, y, z, STONE);                           // limestone plinth
    } else if (corner) {
      put(x, y, z, STONE);                           // quoins run the full height
    } else if (y <= 2) {
      put(x, y, z, pier ? BRICK : GLASS);            // ground storey: shopfront glass between brick piers
    } else if (STRING_STONE.includes(y)) {
      put(x, y, z, STONE);                           // storey string course
    } else if (isWindowRow(y)) {
      put(x, y, z, pier ? BRICK : GLASS);            // window row
    } else {
      put(x, y, z, BRICK);                           // brick head band
    }
  }
}

// Warm light: a glowstone lamp in the room behind some upper-storey windows, and lanterns inside the lobby by the door.
for (const c of F.values()) {
  const { x, z } = c;
  const f = faceOf(x, z);
  if (!f.wall || !f.facade || f.out.length === 0) continue;
  const [dx, dz] = f.facade;
  const xi = x - dx, zi = z - dz;                    // the room behind this wall
  if (!inF(xi, zi) || faceOf(xi, zi).wall) continue;
  for (const y of [4, 6, 8, 10]) {
    if (y >= T(xi, zi) - 1) continue;
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    put(xi, y, zi, LAMP);
  }
}
put(DOOR_CELL[0], 1, DOOR_CELL[1] + 1, LANTERN, { hanging: "false", waterlogged: "false" });
put(DOOR_CELL[0] - 2, 1, 3, LANTERN, { hanging: "false", waterlogged: "false" });

// Roof units: a few air-conditioning boxes on the main roof, set off the parapet.
for (const c of F.values()) {
  const { x, z } = c;
  const Rc = T(x, z);
  if (faceOf(x, z).wall || Rc < 10) continue;
  if (x % 5 === 2 && z % 4 === 1 && x > 3 && x < 17) put(x, Rc, z, AC);
}

// Glass panes connect to their neighbours (panes and solid blocks), so the glass reads as continuous bands.
const SOLID = (b) => b && b !== GLASS;
for (const [k, b] of placed) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (dx, dz) => {
    const n = placed.get(`${x + dx},${y},${z + dz}`);
    return n === GLASS || SOLID(n) ? "true" : "false";
  };
  g.set(x, y, z, GLASS, { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

const info = g.save(OUT);
console.log(`DC63115: ${info.blocks} blocks, ${info.palette} palette entries -> ${OUT}`);
