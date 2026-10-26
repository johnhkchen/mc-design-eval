// 1436 R St NW: a 1920s brick walk-up on a stepped plan (recessed light courts on both flanks, a one-cell bump at the
// back). Three window tiers of two blocks each over a stone plinth, a stone string course per storey, a dentilled
// cornice and a parapet; the front faces north on R Street with a stone-framed entrance. The lidar roof reads 6-7 across
// the footprint, so it is smoothed to one flat roof at 7 blocks; the rear corner's ground is one block up and its
// plinth follows it. Behind each window is one air cell (a pocket) with the floor slabs above and below it solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57809.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57809.cells.json", "utf8"));

const WALL_TOP = 6;          // last wall course; the roof surface is y 7 (the lidar's 7 blocks above y 0)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const WINDOW_ROWS = [1, 3, 5];

const F = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const inF = (x, z) => F.has(`${x},${z}`);
const exteriorFaces = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Each exterior face runs along the wall it lies on: N/S faces run along x at a fixed z, W/E along z at a fixed x.
// Consecutive faces on one plane form a run; a cell's place in its run (rel 0..L) sets its role on the facade.
const runs = new Map();
{
  const planes = new Map();
  for (const [k] of F) {
    const [x, z] = k.split(",").map(Number);
    for (const d of exteriorFaces(x, z)) {
      const [plane, along] = d === "N" || d === "S" ? [z, x] : [x, z];
      const pk = `${d}|${plane}`;
      if (!planes.has(pk)) planes.set(pk, []);
      planes.get(pk).push(along);
    }
  }
  for (const [pk, alongs] of planes) {
    alongs.sort((a, b) => a - b);
    let runStart = alongs[0], prev = alongs[0];
    const flush = (end) => {
      for (let a = runStart; a <= end; a++) runs.set(`${pk}|${a}`, { start: runStart, L: end - runStart, rel: a - runStart });
    };
    for (let i = 1; i <= alongs.length; i++) {
      if (i < alongs.length && alongs[i] === prev + 1) { prev = alongs[i]; continue; }
      if (i < alongs.length) { flush(prev); runStart = alongs[i]; prev = alongs[i]; } else flush(prev);
    }
  }
}

// The facade role of a cell: 'quoin' at corners and run ends, 'window' or 'pier' along a run, and the street face's
// entrance (north, x 0..7, door at x=3 with stone pilasters on either side).
function role(x, z) {
  const ex = exteriorFaces(x, z);
  if (ex.length === 0) return null;
  if (ex.length > 1) return "quoin";
  const d = ex[0];
  const [plane, along] = d === "N" || d === "S" ? [z, x] : [x, z];
  const r = runs.get(`${d}|${plane}|${along}`);
  if (d === "N" && plane === 0 && r.L === 7) {
    return { 1: "window", 2: "pilaster", 3: "door", 4: "pilaster", 5: "window", 6: "pier" }[r.rel] ?? "quoin";
  }
  return r.rel % 2 === 0 ? "pier" : "window";
}

const g = new Voxels([8, 9, 13]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Glass panes connect along the wall they sit in (east-west on the north and south faces, north-south on the others).
const pane = (d) => (d === "N" || d === "S" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [k, { ground }] of F) {
  const [x, z] = k.split(",").map(Number);
  // the foundation and the body: solid from y 0 to the roof, so nothing hangs and each storey stands on the one below
  for (let y = 0; y <= WALL_TOP; y++) {
    const interiorBlock = y === 0 ? "stone_bricks" : y === WALL_TOP ? "gray_concrete" : "bricks";
    set(x, y, z, interiorBlock);
  }
  if (ground > 0) for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");
}

// Facade: every shell cell gets its outer articulation, and each window gets its air pocket behind the pane.
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const ex = exteriorFaces(x, z);
  if (!ex.length) continue;
  const r = role(x, z);
  const d = ex[0];

  set(x, 0, z, "stone_bricks");                                              // plinth course
  for (const y of [2, 4]) set(x, y, z, "smooth_quartz");                  // cream string courses
  set(x, WALL_TOP, z, (x + z) % 2 ? "chiseled_quartz_block" : "smooth_quartz"); // dentilled cornice
  set(x, WALL_TOP + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet

  if (r === "door" || r === "pilaster" || r === "quoin") {
    for (const y of WINDOW_ROWS) set(x, y, z, "smooth_quartz");           // cream quoins and surrounds
  }
  if (r === "pier") for (const y of WINDOW_ROWS) set(x, y, z, "bricks");

  if (r === "window") {
    const [px, pz] = [x - DIRS[d][0], z - DIRS[d][1]];                       // the pocket: one air cell inside the glass
    for (const y of WINDOW_ROWS) {
      set(x, y, z, "glass_pane", pane(d));
      set(px, y, pz, "air");
      if ((x + z + y) % 3 === 0) set(px, y, pz, "glowstone");               // a warm light behind some panes
    }
  }

  if (r === "door") {
    const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    set(x, 1, z, "dark_oak_door", doorState("lower"));
    set(x, 2, z, "dark_oak_door", doorState("upper"));
    set(x, 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // the hood over the door
  }
}

// Roof: a bulkhead for the stair, the entrance door in its north face, and two cooling units on the tar roof.
for (const y of [7, 8]) for (const x of [4, 5]) for (const z of [9, 10]) set(x, y, z, y === 8 ? "smooth_quartz" : "bricks");
set(4, 7, 9, "spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(4, 8, 9, "spruce_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
set(2, 7, 4, "iron_block");
set(5, 7, 6, "iron_block");

const stats = g.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
