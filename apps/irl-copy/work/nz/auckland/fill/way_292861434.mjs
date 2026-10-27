// Choice Backpackers, Auckland CBD edge: a 1970s-80s concrete hotel/office slab, 13 storeys (4 blocks each) on a
// stepped massing, with a 5-storey west wing and a 3-storey east wing. The shell is one block thick: concrete piers and
// spandrels, tinted glass panes in light-grey frames, a lit window here and there, and an air gap behind every wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861434.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861434.nbt";

const W = 21, D = 27, H = 66;
const g = new Voxels([W, H, D]);
const S = new Set();                                   // every placed cell, for pane connections
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); S.add(`${x},${y},${z}`); };
const k2 = (x, z) => `${x},${z}`;

// Massing: the lidar roof quantised down to whole storeys (4 blocks) gives flat tiers with clean setbacks.
// Roof 0 (no lidar height) becomes a one-storey lean-to; the top never sits below the ground plus one storey.
const foot = new Map();
for (const [x, z, ground, roof] of JSON.parse(readFileSync(CELLS, "utf8"))) {
  const top = Math.max(4 * Math.floor(roof / 4), 4 * Math.ceil((ground + 4) / 4));
  foot.set(k2(x, z), { ground, top });
}
const topAt = (x, z) => { const f = foot.get(k2(x, z)); return f ? f.top : -1; };
// which faces of a cell are exposed at height y: a neighbour outside the footprint, or one with no storey at y
const exposed = (x, z, y) => ({
  ex: topAt(x - 1, z) <= y || topAt(x + 1, z) <= y,
  ez: topAt(x, z - 1) <= y || topAt(x, z + 1) <= y,
});
const lit = (x, z, k) => (x * 5 + z * 7 + k * 3) % 10 === 0;  // about one window in ten glows at dusk

for (const [key, { ground, top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const K = top / 4;                                   // storeys in this column

  // base course and foundation: solid from y 0 up to the lidar ground under the cell
  for (let y = 0; y < Math.max(ground, 1); y++) put(x, y, z, "stone_bricks");

  for (let k = 0; k < K; k++) {
    const b = 4 * k;
    if (k > 0) put(x, b, z, "light_gray_concrete");    // floor slab of every storey (also the string course on the ring)
    const { ex, ez } = exposed(x, z, b);
    if (!ex && !ez) continue;                          // interior: the air gap and the floor slab only
    if (ex && ez) {                                    // corner pier
      for (const y of [b + 1, b + 2, b + 3]) if (y >= ground) put(x, y, z, "white_concrete");
      continue;
    }
    const idx = ex ? z : x;                            // position along the wall, for the window bays
    const mullion = idx % 3 === 0;
    for (const y of [b + 1, b + 2]) {
      if (y < ground) continue;                        // foundation already there
      if (mullion) put(x, y, z, "light_gray_concrete");
      else if (k > 0 && lit(x, z, k)) put(x, y, z, "glowstone");
      else put(x, y, z, "light_blue_stained_glass_pane");
    }
    if (k === 0) put(x, 3, z, "smooth_stone");          // signage band over the shopfront
    else put(x, b + 3, z, "white_concrete");           // spandrel
  }

  // roof: cornice on the exposed edge, flat roof inside, a 1-block parapet on the edge
  const roofRing = exposed(x, z, top - 1);
  const edge = roofRing.ex || roofRing.ez;
  put(x, top, z, edge ? "smooth_stone" : "light_gray_concrete");
  if (edge) put(x, top + 1, z, "white_concrete");
}

// Rooftop plant room on the 13-storey core, with a lightning rod
for (let x = 10; x <= 12; x++) for (let z = 5; z <= 7; z++) for (let y = 53; y <= 55; y++) put(x, y, z, "gray_concrete");
put(11, 56, 6, "lightning_rod");

// Entrance on the front (z 25): stone steps up from the street, a double door, a lantern under the signage band
put(12, 0, 25, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
put(12, 1, 25, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(12, 2, 25, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(11, 2, 25, "lantern", { hanging: "true", waterlogged: "false" });
put(13, 2, 25, "lantern", { hanging: "true", waterlogged: "false" });

// Glass panes connect to whatever is beside them, as in the game
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) {
    const b = g.get(x, y, z)?.block;
    if (!b?.endsWith("_stained_glass_pane")) continue;
    const c = (dx, dz) => (S.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
    put(x, y, z, b, { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" });
  }
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}`);
