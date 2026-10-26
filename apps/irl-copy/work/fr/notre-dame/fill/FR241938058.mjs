// FR241938058: an 8-storey residential block of 1700, pale Paris limestone, a mansard-style roof deck. The lidar roof
// (27 blocks at the top, stepping down to 20, 14 and 6 on the wings) is smoothed into four flat tiers. Each storey is
// 3 blocks: a band course, then two rows of windows with calcite piers. Interiors are a floor slab per storey and a
// deck under the roof; the rest is air, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938058.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938058.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([12, 43, 16]);

// lidar roof heights in blocks, smoothed into flat tiers
const tierOf = (r) => (r >= 22 ? 27 : r >= 17 ? 20 : r >= 11 ? 14 : 6);
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { ground, top: tierOf(roof) });
const cell = (x, z) => plan.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces of a cell that show to the open air, or to a lower tier (a setback's wall)
function faces(x, z, top) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = cell(x + dx, z + dz);
    if (!n) out.push({ d, ntop: 0 });
    else if (n.top < top) out.push({ d, ntop: n.top });
  }
  return out;
}

const DOOR = { x: 7, z: 0, d: "N" };   // the street front (north), centre bay

for (const [key, { ground, top }] of plan) {
  const [x, z] = key.split(",").map(Number);
  const ex = faces(x, z, top);
  const wall = ex.length > 0;
  const primary = ex.find((f) => f.ntop === 0) ?? ex[0];
  const corner = ex.length >= 2;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation (none where the ground is 0)

  for (let y = ground; y < top; y++) {
    if (y === top - 1) {                                              // the roof covering / coping
      if (wall) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "deepslate_tiles");
      continue;
    }
    if (y === top - 2) { g.set(x, y, z, wall ? "calcite" : "smooth_stone"); continue; }   // parapet / roof deck
    if (!wall) { if (y % 3 === 0 && y <= top - 4) g.set(x, y, z, "smooth_stone"); continue; }   // floor slabs
    if (y === top - 3) { g.set(x, y, z, "calcite"); continue; }  // cornice
    if (y === 0) { g.set(x, y, z, "calcite"); continue; }         // base course

    if (x === DOOR.x && z === DOOR.z && primary.d === DOOR.d && y <= 2) {   // the entrance: a step, then the door
      if (y === 0) g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    const r = y % 3;
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }        // storey band
    if (corner) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }

    const b = primary.d === "N" || primary.d === "S" ? x : z;        // bay along the face
    if (b % 3 === 0) { g.set(x, y, z, "calcite"); continue; }        // pier
    if (y < primary.ntop) { g.set(x, y, z, "calcite"); continue; }   // a lower wing's roof is in front: no air gap, no glass

    const ns = primary.d === "N" || primary.d === "S";
    const state = ns
      ? { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" }
      : { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", state);

    // warm light behind some panes: the room on the inside of the glass, if it is an open room
    const k = Math.floor(y / 3);
    const [dx, dz] = DIRS[primary.d];
    const ix = x - dx, iz = z - dz;
    if (r === 1 && cell(ix, iz) && faces(ix, iz, cell(ix, iz).top).length === 0) {
      if (k % 2 === 1 && (b + k) % 3 === 1) g.set(ix, y, iz, "glowstone");
      if (k === 6 && (b + k) % 4 === 3) g.set(ix, y, iz, "shroomlight");
    }
  }
}

// chimneys on the main roof, on interior cells
for (const [x, z] of [[7, 3], [9, 8], [4, 12]]) {
  g.set(x, 27, z, "bricks");
  g.set(x, 28, z, "bricks");
  g.set(x, 29, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(OUT);
console.log(JSON.stringify(info));
