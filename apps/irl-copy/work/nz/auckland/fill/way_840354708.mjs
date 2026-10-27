// A three-storey Auckland commercial block of the 1920s-30s: brick walls on a volcanic-basalt base, stone string courses
// and quoins, a shopfront on the south (street) face with a recessed door, and a flat roof with a plant unit. Its
// lidar roof heights are smoothed onto three tiers (4, 8, 11 above y 0: one, two and three storeys), so the west wing
// steps down from the main body. Walls are a one-brick shell with an air gap behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354708.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354708.nbt";

const TIERS = [4, 8, 11];
const tier = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
const key = (x, z) => `${x},${z}`;

// footprint cell -> { g: ground (floor starts here), R: top layer of the massing (cornice/roof) }
const foot = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) foot.set(key(x, z), { g, R: tier(r) });

// a voxel is part of the massing from its cell's ground up to its roof tier
const inV = (x, y, z) => { const c = foot.get(key(x, z)); return !!c && y >= c.g && y <= c.R; };
const exposed = (x, y, z) => ({ xp: !inV(x + 1, y, z), xm: !inV(x - 1, y, z), zp: !inV(x, y, z + 1), zm: !inV(x, y, z - 1) });

const floors = (c) => [...new Set([c.g, 4, 8])].filter((f) => f < c.R);
const STRINGS = [4, 8];                                                     // storey lines (stone), the rest of the wall is brick
const glassRow = (y, g) => [g, 4, 8].some((b) => y === b + 1 || y === b + 2); // two glazed rows per storey
const DOOR = { x: 2, z: 8 };                                                // entrance on the south (street) face

// the wall shell: one brick thick, basalt base and quoins, storey lines, shopfront or upper windows in 2-of-3 bays
function shellSpec(x, y, z, c, e) {
  const corner = (e.xp || e.xm) && (e.zp || e.zm);
  const u = e.zp || e.zm ? x : z;                                           // position along the face
  if (y === c.R) return ["stone_brick_wall", null];                         // cornice / parapet cap
  if (y === c.g || corner) return ["polished_andesite", null];              // base course and quoins
  const door = x === DOOR.x && z === DOOR.z && e.zp;
  if (door && (y === c.g + 1 || y === c.g + 2)) {
    const half = y === c.g + 1 ? "lower" : "upper";
    return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
  }
  if (door && y === c.g + 3) return ["dark_oak_planks", null];              // fascia over the door
  if (STRINGS.includes(y)) return ["stone_bricks", null];
  if (glassRow(y, c.g)) {
    const shopfront = e.zp && y <= c.g + 2;
    const pier = u % 3 === 0;
    if (shopfront) return pier ? ["dark_oak_log", { axis: "y" }] : ["glass_pane", null];
    return pier ? ["bricks", null] : ["glass_pane", null];
  }
  return ["bricks", null];
}

// the building's own floors and roof deck; air between them so the glass looks into an empty room
function interiorSpec(y, c) {
  if (y === c.R) return ["stone", null];
  if (floors(c).includes(y)) return ["smooth_stone", null];
  return null;
}

const g = new Voxels([14, 24, 9]);
const put = (x, y, z, spec) => { if (spec) g.set(x, y, z, spec[0], spec[1] ?? undefined); };

// pass 1: the shell and the interior
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) put(x, y, z, ["stone_bricks", null]);       // foundation to the lowest ground
  for (let y = c.g; y <= c.R; y++) {
    const e = exposed(x, y, z);
    const lateral = e.xp || e.xm || e.zp || e.zm;
    put(x, y, z, lateral ? shellSpec(x, y, z, c, e) : interiorSpec(y, c));
  }
}

// pass 2: warm light one bay behind some lower glazed rows (glass, one air block, then the light on the floor)
let lit = 0;
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g + 1; y <= c.R; y++) {
    if (!glassRow(y, c.g) || !(y === c.g + 1 || y === 5 || y === 9)) continue;
    const e = exposed(x, y, z);
    if (!(e.xp || e.xm || e.zp || e.zm) || (x === DOOR.x && z === DOOR.z)) continue;
    if ((x * 7 + y * 3 + z) % 4 !== 0) continue;
    const [dx, dz] = e.zp ? [0, -2] : e.zm ? [0, 2] : e.xp ? [-2, 0] : [2, 0];
    const tx = x + dx, tz = z + dz;
    if (!inV(tx, y, tz)) continue;
    const te = exposed(tx, y, tz);
    if (te.xp || te.xm || te.zp || te.zm) continue;                           // only interior cells
    if (interiorSpec(y, foot.get(key(tx, tz))) !== null) continue;             // keep the floor slabs
    g.set(tx, y, tz, c.g === 0 && y <= 3 ? "glowstone" : "shroomlight");
    lit++;
  }
}

// roof: an air-conditioning unit on the deck of the main body
for (const [x, z] of [[6, 4], [7, 4], [6, 5], [7, 5]]) g.set(x, 12, z, "iron_block");

const { blocks, palette } = g.save(OUT);
console.log(JSON.stringify({ blocks, palette, lit, out: OUT }));
