// The Iroquois Hotel, 47 West 44 Street, a 1900 Renaissance Revival hotel: load-bearing red brick on a granite base,
// calcite (limestone) string courses, a dentil course and a cornice, a 13-storey block at roof 40 with a 3-storey east
// wing (roof 11) and a 3-block-lower front bay (roof 36) at the street edge. Footprint 19 x 8 cells (x 0..18, z 0..7);
// z 0 is the street front, where the lidar reads open ground at x 7..13: that is the set-back entrance forecourt.
// Each footprint cell is a solid column from y 0 to its roof; the exterior faces get the stone and brick articulation,
// the inside is air with a floor slab per storey, and lit rooms sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034220.cells.json", "utf8"));

// Lidar roofs smoothed into flat tiers. Under 3 blocks is open ground (the forecourt and the light court), not building.
// The 36..41 readings are one 40-block tower, except the front bay at z 0, x 2..6, which stays a storey lower.
const roofFor = (x, z, roof) => {
  if (roof < 3) return 0;
  if (roof < 30) return 11;
  return z === 0 && x >= 2 && x <= 6 ? 36 : 40;
};
const FOOT = new Map();
for (const [x, z, , roof] of cells) { const R = roofFor(x, z, roof); if (R) FOOT.set(`${x},${z}`, { R }); }
const at = (x, z) => FOOT.get(`${x},${z}`);
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.R; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isSlabRow = (y, R) => y === 0 || (y % 3 === 0 && y < R - 1) || y === R - 1;
// A parapet stands on the edge of a tier: beside open ground or a lower tier.
const edge = (x, z, R) => DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.R < R; });

const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // a front or rear face
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // an end face
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The exterior block for an exposed cell at height y. u runs along its face: x on the street and rear faces, z on the ends.
function exterior(x, y, z, R, dirs) {
  const alongX = dirs.some(([, dz]) => dz !== 0);
  const corner = alongX && dirs.some(([dx]) => dx !== 0);
  const u = alongX ? x : z;
  const pane = alongX ? PANE_ALONG_X : PANE_ALONG_Z;
  if (y === 0) return ["polished_granite"];                                  // granite base course
  if (y === R - 1) return ["calcite"];                                        // cornice
  if (y === R - 2) return [u % 2 ? "bricks" : "calcite"];                    // dentil course
  if (y % 3 === 0) return ["calcite"];                                        // string course at each floor line
  if (y < 3) return u % 3 === 0 ? ["polished_granite"] : ["glass_pane", pane];  // shopfront: granite piers, glass between
  if (corner) return [Math.floor(y / 3) % 2 ? "bricks" : "calcite"];         // quoins alternate at the corners
  return u % 3 === 0 ? ["bricks"] : ["glass_pane", pane];                    // brick piers, a window bay between each
}

const W = 19, H = 53, D = 8;
const g = new Voxels([W, H, D]);
for (const [key, { R }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const dirs = exposedDirs(x, y, z);
    if (dirs.length) { const [block, state] = exterior(x, y, z, R, dirs); g.set(x, y, z, block, state); }
    else if (isSlabRow(y, R)) g.set(x, y, z, "stone");
  }
  if (edge(x, z, R)) g.set(x, R, z, (x + z) % 2 ? "bricks" : "calcite");   // parapet with calcite coping every other block
}

// Lit rooms behind some panes: a single-face window cell whose inside cell is an air gap (not a slab, not exposed).
for (const [key, { R }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < R - 2; y++) {
    if (y % 3 === 0 || (x * 5 + y * 7 + z * 3) % 7 !== 0) continue;
    const dirs = exposedDirs(x, y, z);
    if (dirs.length !== 1) continue;
    const [dx, dz] = dirs[0];
    const u = dz !== 0 ? x : z;
    if (u % 3 === 0) continue;                                               // a pier, not a pane
    const ix = x - dx, iz = z - dz, ci = at(ix, iz);
    if (!ci || !solid(ix, y, iz) || exposedDirs(ix, y, iz).length || isSlabRow(y, ci.R)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// The entrance: a door in the forecourt wall, a paved set-back, granite posts carrying a canopy, two hanging lanterns.
for (const y of [1, 2]) g.set(9, y, 1, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
for (let x = 7; x <= 13; x++) g.set(x, 0, 0, "stone_bricks");
for (const x of [8, 10, 12]) for (let y = 1; y <= 3; y++) g.set(x, y, 0, "polished_granite");
for (let x = 8; x <= 12; x++) g.set(x, 4, 0, "polished_granite");
g.set(9, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(11, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Roof equipment on the 40-block tower: a stair bulkhead and two chimney shafts, each capped in calcite.
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) { for (let y = 40; y <= 42; y++) g.set(x, y, z, "stone_bricks"); g.set(x, 43, z, "calcite"); }
for (const [x, z] of [[7, 2], [12, 6]]) { for (let y = 40; y <= 42; y++) g.set(x, y, z, "bricks"); g.set(x, 43, z, "calcite"); }

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034220.nbt";
console.log(g.save(out));
