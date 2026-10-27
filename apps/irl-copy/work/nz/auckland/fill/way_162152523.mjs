import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A mid-century (1960s-70s) four-storey concrete office block with a flat roof, the kind Newton and Mt Eden
// filled in after the war: a stone plinth, white concrete piers and heads, light-grey spandrels, blue-green
// tinted glass, a dark roof membrane and a white parapet. The lidar roof (17-20 above y 0) is one flat tier at
// 18 with a 1-block parapet, and a small lift overrun on top. Storeys step with each cell's own ground.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152523.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152523.nbt";

const SIZE = [21, 32, 38];
const TOP = 17;                                    // last storey row (the top head or cornice)
const ROOF = 18;                                   // roof membrane; parapet walls are at this row too
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N (low z, the street side), S, W, E
const k = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(k(x, z));
const outward = (c) => DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));

// Ring distance from the outside: 1 = shell (the facade), 2 = the air gap behind the glass, 3+ = solid core.
const dist = new Map();
let frontier = [];
for (const c of F.values()) if (outward(c).length) { dist.set(k(c.x, c.z), 1); frontier.push(c); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const n = F.get(k(c.x + dx, c.z + dz));
    if (n && !dist.has(k(n.x, n.z))) { dist.set(k(n.x, n.z), d + 1); next.push(n); }
  }
  frontier = next;
}

const V = new Voxels(SIZE);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);
const DOOR = { x: 10, z: 1 };                      // the entrance on the street face
const glass = "light_blue_stained_glass";
const lightWindow = (x, y, z) => (x * 31 + z * 17 + y * 7) % 4 === 0;

for (const c of F.values()) {
  const { x, z, g } = c, d = dist.get(k(x, z));
  const ex = outward(c);
  const axisN = ex.some(([, dz]) => dz !== 0), axisE = ex.some(([dx]) => dx !== 0);
  const corner = axisN && axisE;
  const along = axisN ? x : z;                     // position along the face it stands on

  // Foundation: solid from y 0 up to this cell's own ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  for (let y = g; y <= TOP; y++) {
    const rel = (y - g) % 4;                       // 0 spandrel/slab, 1-2 window, 3 head
    if (d >= 3) { put(x, y, z, "stone"); continue; }
    if (d === 2) {
      // air behind the glass, between the slab and the head; everything else is a solid slab/head
      if (y < TOP && (rel === 1 || rel === 2)) continue;
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // d === 1: the facade
    if (y === g) { put(x, y, z, "stone_bricks"); continue; }                  // base course
    if (rel === 0) { put(x, y, z, corner ? "white_concrete" : "light_gray_concrete"); continue; }   // storey line
    if (rel === 3 || corner || along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }      // head, piers
    if (ex.length && axisN && x === DOOR.x && z === DOOR.z) {                                       // entrance door
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    put(x, y, z, glass);
  }

  // Parapet and coping on the facade; a dark membrane over the rest of the roof.
  if (d === 1) {
    put(x, ROOF, z, "white_concrete");
    put(x, ROOF + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, ROOF, z, "gray_concrete");
  }
}

// Warm light behind some windows: glowstone in the air gap just inside the glass.
for (const c of F.values()) {
  const d = dist.get(k(c.x, c.z));
  if (d !== 1) continue;
  const ex = outward(c);
  if (!ex.length) continue;
  const [dx, dz] = ex[0];
  const ix = c.x - dx, iz = c.z - dz;
  if (dist.get(k(ix, iz)) !== 2) continue;
  for (let y = c.g + 1; y <= TOP - 1; y++) {
    const rel = (y - c.g) % 4;
    if (rel !== 1 && rel !== 2) continue;
    if (c.x === DOOR.x && c.z === DOOR.z) continue;
    if (lightWindow(c.x, y, c.z)) put(ix, y, iz, "glowstone");
  }
}

// Entrance lobby lamp, hung from the lintel row behind the door.
{
  const { g } = F.get(k(DOOR.x, DOOR.z));
  put(DOOR.x, g + 2, DOOR.z + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Lift overrun on the roof, and two plant units on the membrane.
for (let x = 12; x <= 14; x++) for (let z = 9; z <= 11; z++) {
  if (!inF(x, z)) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, z === 10 ? "light_blue_stained_glass" : "white_concrete");
}
for (const [x, z] of [[16, 7], [17, 7], [16, 8], [17, 8], [6, 12], [7, 12], [6, 13], [7, 13]]) {
  if (inF(x, z)) put(x, ROOF + 1, z, "iron_block");
}

const stats = V.save(OUT);
console.log(`way_162152523: ${stats.blocks} blocks, palette ${stats.palette}`);
