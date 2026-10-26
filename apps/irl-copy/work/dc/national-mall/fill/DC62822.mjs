// 1146 19th St NW: a 1920s-style limestone office block, four storeys over a glazed shopfront, with a
// setback top storey, a terrace on the street side and a mechanical penthouse. Solid walls and floor
// slabs with an air gap behind every window; the lidar roof (12-14) sets the penthouse, the ground sets the plinth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62822.cells.json`, "utf8"));

const W = 15, D = 6, H = 26;
const FRONT = 5;                       // street face (+z); the top storey sets back to z 4
const g = new Voxels([W, H, D]);

const ground = new Map(), roof = new Map();
for (const [x, z, gr, rf] of cells) { ground.set(`${x},${z}`, gr); roof.set(`${x},${z}`, rf); }

// storey lines (floor slabs), roof, cornice; the top storey's front is z 4 from y 11 up
const LINES = [4, 7, 10], ROOF = 13, CORNICE = 14, SETBACK = 11;
const WIN_ROWS = [1, 2, 5, 6, 8, 9, 11, 12];
const PILLARS = new Set([0, 3, 6, 9, 12, 14]);      // limestone bays on the long faces
const frontZ = (y) => (y >= SETBACK ? FRONT - 1 : FRONT);
const inFoot = (x, y, z) => z <= frontZ(y);
const ring = (x, y, z) => x === 0 || x === W - 1 || z === 0 || z === frontZ(y);

// the foundation: solid from y 0 up to each cell's own ground
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gr = ground.get(`${x},${z}`) ?? 0;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");
}

const glass = (y) => (y <= 2 ? "glass_pane" : "light_blue_stained_glass_pane");
const paneState = (x, y, z, onLongFace) => (onLongFace
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (let y = 0; y <= CORNICE; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, y, z)) continue;
  const isRing = ring(x, y, z);
  const longFace = z === 0 || z === frontZ(y);
  const isFrontish = z === frontZ(y);

  // plinth (y 0), floor slabs, roof deck: solid across the footprint
  if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
  if (LINES.includes(y) || y === ROOF) {
    g.set(x, y, z, isRing ? "calcite" : "smooth_stone");
    continue;
  }
  if (!isRing) continue;                     // interior: air behind the glass

  // ring walls
  if (y === 3) { g.set(x, y, z, "polished_andesite"); continue; }    // fascia band
  if (y === CORNICE) { g.set(x, y, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" }); continue; }
  if (WIN_ROWS.includes(y)) {
    if (longFace && !PILLARS.has(x)) { g.set(x, y, z, glass(y), paneState(x, y, z, true)); continue; }
    if (!longFace && z >= 1 && z <= frontZ(y) - 1) { g.set(x, y, z, glass(y), paneState(x, y, z, false)); continue; }
  }
  g.set(x, y, z, "calcite");                // pillars, corners, spandrels
}

// entrance: a glazed lobby with a dark oak door at x 7, glass either side, and a canopy over it
for (let x = 5; x <= 9; x++) g.set(x, 3, FRONT, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
for (const x of [6, 8]) for (const y of [1, 2]) g.set(x, y, FRONT, "glass_pane", paneState(x, y, FRONT, true));
g.set(7, 1, FRONT, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(7, 2, FRONT, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 0, FRONT, "polished_andesite");

// the terrace on the street side above the 3rd storey line: balustrade of iron bars at y 11
for (let x = 0; x < W; x++) g.set(x, 11, FRONT, "iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// mechanical penthouse on the roof where the lidar roof is 14, set back from both faces
for (let z = 1; z <= 3; z++) for (let x = 4; x <= 9; x++) {
  if ((roof.get(`${x},${z}`) ?? 0) < 14) continue;
  g.set(x, 14, z, "stone_bricks");
  g.set(x, 15, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm lights behind the glass: lanterns in the shopfront, glowstone and shroomlight in the storeys
for (const x of [2, 5, 10, 13]) g.set(x, 1, 4, "lantern", { hanging: "false", waterlogged: "false" });
g.set(7, 1, 3, "lantern", { hanging: "false", waterlogged: "false" });
g.set(2, 8, 4, "glowstone");
g.set(10, 8, 4, "glowstone");
g.set(5, 5, 4, "shroomlight");
g.set(8, 5, 4, "shroomlight");
g.set(11, 11, 3, "shroomlight");

const out = g.save(`${DIR}/DC62822.nbt`);
console.log(JSON.stringify(out));
