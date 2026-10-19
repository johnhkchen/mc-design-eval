// 10 East 52nd Street, 1930 Midtown commercial and office block: an 8-storey (24-block) brick-and-limestone slab on a
// granite base, with a 2-block limestone parapet at 26 blocks (the lidar's roof). Footprint 8 x 28; the street is the
// north face (low z), a granite-and-glass shopfront with a double iron entrance at x 3-4. A six-storey rear wing
// (lidar 17-18, 18 blocks) steps down the south end, and a one-storey shopfront wing (lidar 3) sits on the street at
// the NW corner. The four lidar-0 notches are filled to the body, so the envelope is closed. Brick piers every third
// block, two glass panes between them, a limestone belt course at every storey line. Behind each pane: an air gap
// and a floor slab (no interiors), and some panes hold glowstone in the gap. Roof: tar, a small equipment box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035478.cells.json`, "utf8"));
const X = 8, Y = 27, Z = 28;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_ID = { N: 0, S: 1, W: 2, E: 3 };
const BODY = 24, PARAPET = 26, REAR = 18;

// Solid column height (blocks above y 0) per footprint cell: smoothed from the lidar into three tiers.
const topOf = (x, z) => {
  if (x === 1 && z === 0) return 3;                                  // street shopfront wing (lidar 3)
  if (z >= 25 && cell.get(`${x},${z}`).roof <= 18) return REAR;       // rear wing (lidar 17-18)
  const perimeter = Object.values(DIRS).some(([dx, dz]) => !inFoot(x + dx, z + dz));
  return perimeter ? PARAPET : BODY;                                  // notches (lidar 0) fill to the body
};
const solid = (x, y, z) => inFoot(x, z) && y < topOf(x, z);
const exposedDirs = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !solid(x + dx, y, z + dz); });

// Glass panes face along the wall: a north or south face runs along x, so its panes connect east and west.
const pane = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (u, y, f) => (u * 5 + y * 7 + f * 3) % 7 === 0;   // sparse, deterministic warm panes

const g = new Voxels([X, Y, Z]);
const openings = [];

// 1. Solid core, roof tops, and the facade on every exposed face.
for (const [x, z, ground] of cells) {
  const H = topOf(x, z);
  for (let y = 0; y < H; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation
    const ex = exposedDirs(x, y, z);
    if (!ex.length) { g.set(x, y, z, y === H - 1 ? "gray_concrete" : "smooth_stone"); continue; }   // interior: floor slabs, tar roof
    const d = ex[0], [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                                    // position along the face
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                 // base course
    if (y === H - 1 || y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }       // cornice and storey belts
    if (d === "N" && z === 0 && y < 3) {                                           // street shopfront
      if (x === 3 || x === 4) {                                                    // double iron entrance
        g.set(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 3 ? "left" : "right", open: "false", powered: "false" });
      } else if (x === 0 || x === 7) {
        g.set(x, y, z, "polished_granite");
      } else {
        g.set(x, y, z, "glass_pane", pane(d));
        openings.push({ x, y, z, d, lit: false });
      }
      continue;
    }
    if (u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                       // brick pier
    g.set(x, y, z, "glass_pane", pane(d));
    openings.push({ x, y, z, d, lit: lit(u, y, FACE_ID[d]) });
  }
}

// 2. Air gap and floor slab behind each pane: the cell one block in is air (glowstone behind a lit pane), the floor
// slab at each storey line is left as core. Only cells that are solid and not on an outer face are carved.
for (const o of openings) {
  const [dx, dz] = DIRS[o.d];
  const ix = o.x - dx, iz = o.z - dz;
  if (!solid(ix, o.y, iz) || exposedDirs(ix, o.y, iz).length) continue;
  g.set(ix, o.y, iz, o.lit ? "glowstone" : "air");
}

// 3. Roof equipment: a small cooling box on the tar roof, clear of the parapet.
for (let x = 2; x <= 3; x++) for (let z = 9; z <= 10; z++) for (let y = BODY; y < BODY + 2; y++) g.set(x, y, z, "light_gray_concrete");

const out = g.save(`${DIR}/NYC1035478.nbt`);
console.log(`NYC1035478.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
