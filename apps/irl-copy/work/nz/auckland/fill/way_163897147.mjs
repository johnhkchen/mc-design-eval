// Way 163897147, Mt Eden / Eden Terrace side of the CBD: a three-storey interwar brick commercial block with a
// shopfront on its south face, two lower stepped wings to the north and east, and a plant room on the roof.
// Massing: lidar roof heights smoothed into three flat tiers (5, 9, 12 blocks = 1, 2, 3 storeys of 4 + cap).
// Each column is solid from y 0 up to its ground, its floor slabs sit at every 4 blocks, and it is an open shell
// (air) between them. Outer faces get a plinth, quartz string courses and heads, brick piers, and glass panes in
// the bays. Warm lights stand on the floor just inside some panes, so each one has solid support below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_163897147.cells.json", "utf8"));

const W = 30, H = 25, D = 20;
const g = new Voxels([W, H, D]);

// lidar roof -> clean tier: noise below 7 reads as the low wing, 7 to 9 as the middle, 10 and up as the tall core
const tierOf = (r) => (r <= 6 ? 5 : r <= 9 ? 9 : 12);
const key = (x, z) => `${x},${z}`;
const footprint = new Map();
for (const [x, z, ground, roof] of cells) footprint.set(key(x, z), { ground, top: tierOf(roof) });
const cellAt = (x, z) => footprint.get(key(x, z));

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// the first side of column x, z that is open at height y: outside the footprint, or over a lower roof
function openSide(x, y, z) {
  for (const [dx, dz] of DIRS) {
    const n = cellAt(x + dx, z + dz);
    if (!n || n.top <= y) return [dx, dz];
  }
  return null;
}

const WINDOW = "glass_pane", PIER = "bricks", SHOP_PIER = "dark_oak_planks", STRING = "smooth_quartz";

// the shell: every column solid to its tier, with the outer faces dressed and the floor slabs and roof deck solid
for (const [k, { top }] of footprint) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    const side = openSide(x, y, z);
    if (y === top - 1) { g.set(x, y, z, side ? STRING : "smooth_stone"); continue; }   // cap: quartz coping on the edge, deck inside
    if (!side) { if (y % 4 === 0) g.set(x, y, z, "smooth_stone"); continue; }          // interior: floor slab per storey, air between
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }                      // plinth
    if (y % 4 === 0) { g.set(x, y, z, STRING); continue; }                              // string course at each storey line
    if (y % 4 === 3) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }  // head: half-slab, so the course and head don't stack into a band
    const [dx] = side, along = dx !== 0 ? z : x, ground = y < 4;
    const pier = along % 3 === 0;
    g.set(x, y, z, pier ? (ground ? SHOP_PIER : PIER) : WINDOW);
  }
}

// main entrance on the south face, with a warm lantern just inside the door
const DOOR = { x: 7, z: D - 1 };
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 1, DOOR.z, "dark_oak_door", doorState("lower"));
g.set(DOOR.x, 2, DOOR.z, "dark_oak_door", doorState("upper"));
g.set(DOOR.x, 1, DOOR.z - 1, "lantern", { hanging: "false", waterlogged: "false" });

// warm light: standing on the floor just inside a pane (a solid block below it). Shopfronts get one in two so the
// ground floor glows at dusk instead of reading as a black void; upper floors get one window in six.
const LIGHTS = ["lantern", "glowstone", "shroomlight"];
let nLights = 0;
for (const [k, { top }] of footprint) {
  const [x, z] = k.split(",").map(Number);
  for (const y of [1, 5, 9]) {
    if (y >= top - 1) continue;
    const side = openSide(x, y, z);
    if (!side || (x === DOOR.x && z === DOOR.z)) continue;
    if ((x * 7 + z * 13 + y * 5) % (y === 1 ? 2 : 6) !== 0) continue;
    const [dx, dz] = side, ix = x - dx, iz = z - dz;
    const inner = cellAt(ix, iz);
    if (!inner || openSide(ix, y, iz)) continue;
    const kind = LIGHTS[nLights % LIGHTS.length];
    g.set(ix, y, iz, kind, kind === "lantern" ? { hanging: "false", waterlogged: "false" } : undefined);
    nLights++;
  }
}

// roof plant: two units on the tall core, sitting on the roof deck
for (let z = 14; z <= 15; z++) for (let x = 15; x <= 17; x++) g.set(x, 12, z, "iron_block");
g.set(15, 13, 14, "smooth_stone"); g.set(16, 13, 14, "smooth_stone");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_163897147.nbt");
console.log(`way_163897147: ${stats.blocks} blocks, ${stats.palette} palette entries, ${nLights} lights`);
