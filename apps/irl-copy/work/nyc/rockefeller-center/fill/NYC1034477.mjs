// 37 West 47th Street, 1925: a Midtown office tower under the 1916 setback rule. A central shaft of 22 storeys over
// wings that step down to the north and south, the lidar's roof read as clean three-block tiers. Granite base,
// cream piers and terracotta spandrels, grey glass in a 2-wide window grid, a black tar roof with a cornice and parapet,
// a copper-capped roof plant and a lit office or two. The shell is hollow: exterior walls, a floor slab per storey and air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034477.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 19, D = 26, H = 72;   // x 0..18 (street front faces on z), z 0..25 (low z = uptown)
const STOREY = 3;

// Roof tiers, top exclusive, read from the lidar and smoothed: each row is z, each pair is [height, cells].
// Hole/noise cells in the lidar (1,15 reads 0; 13,1 and 10,1 dip to 7-8) take their tier.
const row = (...pairs) => { const r = pairs.flatMap(([v, n]) => Array(n).fill(v)); if (r.length !== W) throw new Error(`row ${r.length}`); return r; };
const TIER = [
  row([21, 5], [6, 14]),                      // z0  low 2-storey strip on the north edge
  row([21, 19]),                              // z1
  row([27, 5], [21, 14]),                     // z2
  row([33, 19]),                              // z3
  row([42, 6], [33, 13]),                     // z4
  row([42, 1], [45, 18]),                     // z5
  row([51, 19]),                              // z6
  row([57, 19]),                              // z7
  row([63, 19]),                              // z8
  row([63, 5], [68, 9], [63, 5]),             // z9  central shaft, 68 to the top
  row([63, 5], [68, 9], [63, 5]),             // z10
  row([63, 5], [68, 9], [63, 5]),             // z11
  row([63, 5], [68, 9], [63, 5]),             // z12
  row([63, 5], [68, 9], [63, 5]),             // z13
  row([63, 6], [66, 8], [63, 5]),             // z14
  row([57, 1], [60, 16], [63, 2]),            // z15
  row([54, 6], [57, 8], [54, 5]),             // z16
  row([54, 6], [57, 8], [54, 5]),             // z17
  row([51, 5], [57, 9], [54, 1], [51, 4]),    // z18
  row([51, 6], [48, 8], [51, 5]),             // z19
  row([42, 6], [45, 1], [48, 6], [45, 1], [42, 5]),   // z20
  row([42, 6], [45, 1], [48, 6], [45, 1], [42, 5]),   // z21
  row([39, 5], [45, 2], [48, 6], [45, 1], [42, 1], [39, 4]),   // z22
  row([39, 5], [36, 9], [39, 5]),             // z23
  row([30, 7], [36, 6], [30, 6]),             // z24 south end: 30-block wings, 36 over the middle
  row([30, 7], [36, 6], [30, 6]),             // z25
];

// Footprint and ground from the fill cells (the 18,0 corner is outside the footprint).
const GROUND = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g] of cells) GROUND[z][x] = g;
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[z][x] !== null;
const T = (x, z) => TIER[z][x];

const v = new Voxels([W, H, D]);
const panes = [];   // glass pane cells, face recorded, connections set after the walls are placed
const faceOf = new Map();
const key = (x, y, z) => `${x},${y},${z}`;

// Outward face directions a cell at height y is exposed on: a neighbour that is outside the footprint or whose roof is below y.
const exposedDirs = (x, y, z) => {
  const out = [];
  const test = (dx, dz, face) => {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz) || T(nx, nz) <= y) out.push(face);
  };
  test(0, -1, "N"); test(0, 1, "S"); test(-1, 0, "W"); test(1, 0, "E");
  return out;
};

// The skin of an exposed wall block: storey lines, window grid, piers, base course, cornice. Entrance at the south front.
const SOUTH_ENTRANCE = { x0: 7, x1: 11 };
const skin = (x, y, z, face) => {
  const k = Math.floor(y / STOREY), r = y % STOREY, top = T(x, z);
  const ns = face === "N" || face === "S";
  const u = ns ? x : z, uMax = ns ? W - 1 : D - 1;
  const pier = u % 3 === 0 || u === uMax;
  if (y === top - 1) return ["polished_andesite"];                     // cornice course under the roof
  if (face === "S" && z === D - 1 && k === 0 && x >= SOUTH_ENTRANCE.x0 && x <= SOUTH_ENTRANCE.x1) {
    if (r === 2 || x === 7 || x === 11) return ["polished_granite"];   // entrance lintel and reveals
    if (x === 9) return r === 0 ? ["iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }] : ["iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    return ["black_stained_glass_pane"];                               // vestibule glass either side of the door
  }
  if (k === 0) {
    if (r === 0) return ["polished_granite"];                          // base course
    return pier ? ["polished_granite"] : ["light_blue_stained_glass_pane"];   // shopfronts
  }
  if (r === 0) return ["white_terracotta"];                            // spandrel and storey line
  if (pier) return [ns ? "smooth_quartz" : "bricks"];                   // cream piers, brick flanks on the sides
  return ["gray_stained_glass_pane"];
};

// Storey-to-storey lit offices: a glowstone one bay inside a window, on a few upper-floor windows.
const litInside = (x, y, z, face) => {
  if (y < STOREY || y % STOREY === 0) return null;
  if (((x * 7 + y * 5 + z * 11) % 8) !== 0) return null;
  return { N: [x, y, z + 1], S: [x, y, z - 1], W: [x + 1, y, z], E: [x - 1, y, z] }[face];
};

// Pass 1: foundations, shell, floors, roofs, parapets.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const G = GROUND[z][x], Tt = T(x, z);
  for (let y = 0; y < G; y++) v.set(x, y, z, "stone_bricks");         // foundation to the lowest ground
  const perimeter = !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);
  for (let y = G; y < Tt; y++) {
    const dirs = exposedDirs(x, y, z);
    if (dirs.length) {
      const face = dirs.includes("N") ? "N" : dirs.includes("S") ? "S" : dirs[0];
      const [block, state] = skin(x, y, z, face);
      v.set(x, y, z, block, state);
      if (block === "gray_stained_glass_pane" || block === "light_blue_stained_glass_pane" || block === "black_stained_glass_pane") {
        panes.push([x, y, z]); faceOf.set(key(x, y, z), face);
      }
    } else if (y === Tt - 1) v.set(x, y, z, "black_concrete");          // tar roof
    else if (y % STOREY === 0) v.set(x, y, z, "smooth_stone");          // floor slab
  }
  if (perimeter) v.set(x, Tt, z, "smooth_quartz");                      // parapet on the outer edge
}

// Warm offices behind some glass (pass 1 left the bay inside empty).
for (const [x, y, z] of panes) {
  const face = faceOf.get(key(x, y, z));
  const inner = litInside(x, y, z, face);
  if (inner && !v.get(...inner)) v.set(...inner, "glowstone");
}

// Pass 2: pane connections to the piers and neighbouring panes, along the wall plane only.
const solid = (x, y, z) => !!v.get(x, y, z);
for (const [x, y, z] of panes) {
  const face = faceOf.get(key(x, y, z));
  const st = face === "N" || face === "S"
    ? { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false" }
    : { east: "false", west: "false", north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), waterlogged: "false" };
  const b = v.get(x, y, z).block;
  v.set(x, y, z, b, st);
}

// Roof plant: a copper-capped penthouse on the central shaft, and two copper vents on the north wing's roof.
for (let z = 10; z <= 12; z++) for (let x = 8; x <= 10; x++) {
  v.set(x, 68, z, "smooth_quartz"); v.set(x, 69, z, "smooth_quartz"); v.set(x, 70, z, "polished_andesite");
}
for (const x of [3, 15]) { v.set(x, 33, 3, "copper_block"); v.set(x, 34, 3, "copper_block"); }

const { blocks, palette } = v.save(`${DIR}/NYC1034477.nbt`);
console.log(`built NYC1034477: ${blocks} blocks, palette ${palette}, size ${W}x${H}x${D}, panes ${panes.length}`);
