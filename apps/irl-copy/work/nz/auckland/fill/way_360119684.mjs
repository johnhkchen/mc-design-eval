// Way 360119684: a three-storey brick shop-top block on Auckland's volcanic basalt plinth, 1920s-30s commercial. The lidar
// roof is flat at 11 blocks over the whole footprint (9 and 10 at the outline are edge noise), so it gets one flat roof
// tier with a parapet, a stair housing and AC plant. Shell only: a 1-block wall, floor slabs per storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119684.cells.json", "utf8"));

const ROOF = 11;                                  // flat roof surface above y 0 (lidar's 9-10 at the outline smoothed up)
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inside = (x, z) => ground.has(key(x, z));
const outward = (x, z) => {                       // the faces of a cell that look out of the footprint
  const out = [];
  if (!inside(x, z - 1)) out.push("north");
  if (!inside(x, z + 1)) out.push("south");
  if (!inside(x + 1, z)) out.push("east");
  if (!inside(x - 1, z)) out.push("west");
  return out;
};
const isWall = (x, z) => inside(x, z) && outward(x, z).length > 0;
const isInterior = (x, z) => inside(x, z) && !isWall(x, z);

const g = new Voxels([30, 24, 29]);

// Storey bands on the outer wall: y0 plinth, 1-2 shopfront / window, 3 string course, 4-5 window, 6 string course,
// 7-8 window, 9 cornice, 10 parapet brick. Interior: floor slabs at 0, 3, 6 and the roof membrane at 10.
const WINDOW_ROWS = new Set([1, 2, 4, 5, 7, 8]);
const wallBlock = (x, y, z) => {
  if (y === 0) return "polished_basalt";
  if (y === 3 || y === 6 || y === 9) return "smooth_quartz";
  if (y === 10) return "bricks";
  if (WINDOW_ROWS.has(y)) return (x + z) % 3 === 0 ? "bricks" : "glass";   // a brick pier every third cell
  return "bricks";
};
const interiorBlock = (y) => {
  if (y === 0 || y === 3 || y === 6) return "smooth_stone";
  if (y === 10) return "stone";
  return null;
};

for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_basalt");   // foundation under the uphill cells
  for (let y = gr; y < ROOF; y++) {
    if (isWall(x, z)) g.set(x, y, z, wallBlock(x, y, z));
    else { const b = interiorBlock(y); if (b) g.set(x, y, z, b); }
  }
  if (isWall(x, z)) g.set(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// The entrance: a dark oak door on the south-facing wall nearest the middle, lintel above in quartz.
const southWalls = cells.filter(([x, z]) => isWall(x, z) && outward(x, z).includes("south"));
const mid = (Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0]))) / 2;
const [dx, dz] = southWalls.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid))[0] ?? [null, null];
if (dx !== null) {
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, 1, dz, "dark_oak_door", { ...base, half: "lower" });
  g.set(dx, 2, dz, "dark_oak_door", { ...base, half: "upper" });
}

// Warm light behind some windows: glowstone on the shopfront, lanterns standing on the upper floors.
const LIGHT = { 1: ["glowstone", null], 4: ["lantern", { hanging: "false", waterlogged: "false" }], 7: ["lantern", { hanging: "false", waterlogged: "false" }] };
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isWall(x, z)) continue;
  const inward = ["north", "south", "east", "west"].find((d) => {
    const [ox, oz] = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[d];
    return isInterior(x + ox, z + oz);
  });
  if (!inward) continue;
  const [ox, oz] = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[inward];
  const ix = x + ox, iz = z + oz;
  for (const y of [1, 4, 7]) {
    if (x === dx && z === dz) continue;
    if (!WINDOW_ROWS.has(y) || wallBlock(x, y, z) !== "glass") continue;
    if ((x * 7 + z * 13 + y) % 5 !== 0) continue;   // about one window in five
    const [block, state] = LIGHT[y];
    g.set(ix, y, iz, block, state ?? undefined);
  }
}

// Roof: a stair housing (bricks, quartz cap) on the interior cell furthest from the walls, and AC units nearby.
let hub = null;
for (const [x, z] of cells) {
  const ring = [];
  for (let dx2 = -1; dx2 <= 1; dx2++) for (let dz2 = -1; dz2 <= 1; dz2++) ring.push([x + dx2, z + dz2]);
  if (!ring.every(([a, b]) => isInterior(a, b))) continue;
  const d = Math.hypot(x - 14.5, z - 14);
  if (!hub || d < hub.d) hub = { x, z, d };
}
if (hub) {
  for (let x = hub.x - 1; x <= hub.x + 1; x++) for (let z = hub.z - 1; z <= hub.z + 1; z++)
    for (let y = ROOF; y <= ROOF + 2; y++) g.set(x, y, z, "bricks");
  for (let x = hub.x - 1; x <= hub.x + 1; x++) for (let z = hub.z - 1; z <= hub.z + 1; z++)
    g.set(x, ROOF + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  const ac = [];
  for (const [x, z] of cells) {
    if (!isInterior(x, z) || Math.max(Math.abs(x - hub.x), Math.abs(z - hub.z)) < 4) continue;
    if (ac.some(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - z)) < 3)) continue;
    if (ac.length < 3 && (x + z) % 4 === 0) ac.push([x, z]);
  }
  for (const [x, z] of ac) g.set(x, ROOF, z, "light_gray_concrete");
}

const result = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119684.nbt");
console.log(JSON.stringify({ ...result, footprint: cells.length, door: dx === null ? null : [dx, dz], housing: hub && [hub.x, hub.z] }));
