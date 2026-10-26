// DC75395: 602 Emmanuel Ct NW, a 1920s red-brick walk-up in the Shaw/U Street grain. A three-block flat-roofed
// wall with a one-block-taller central spine (the lidar's 4 against 3), stone base and cornices, window bays on
// the flanks, a dark-oak entrance with a hanging lantern, warm lights behind a few panes, a tar roof with two
// rooftop units. Every cell stands on the one below; the interior is a shell with floor and roof decks, no fit-out.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75395.cells.json`, "utf8"));

// [x, z, ground, roof]: y 0 is the lowest ground (every cell here is 0), roof is the lidar height above it
const roof = new Map(cells.map(([x, z, ground, top]) => {
  if (ground !== 0) throw new Error(`cell ${x},${z} ground ${ground}: foundation fill not wired`);
  return [`${x},${z}`, top];
}));
const H = (x, z) => roof.get(`${x},${z}`);
const edge = (x, z) => x === 0 || x === 5 || z === 0 || z === 5;

// The front is z = 0 (the street face, door centred in the spine); the back is z = 5.
const front = (z) => z === 0;

const door = (x, y, z) => front(z) && x === 3 && y <= 1;
const lantern = (x, y, z) => front(z) && x === 3 && y === 2;
// Window bays: two per flank, three per storey on front and back (the centre one on the front is the lantern)
function windowAt(x, y, z) {
  if (x === 0 || x === 5) return y === 1 && (z === 1 || z === 4);
  if (y === 1) return [1, 2, 4].includes(x);
  if (y === 2) return front(z) ? [2, 4].includes(x) : [2, 3, 4].includes(x);
  return false;
}

const put = new Map();    // "x,y,z" -> { block, state }
const at = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { block, state });
const here = (x, y, z) => put.get(`${x},${y},${z}`)?.block;

for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) {
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    if (!edge(x, z)) {
      // shell interior: a floor slab on the ground, the roof deck on top, air between (no fit-out)
      if (y === 0) at(x, y, z, "smooth_stone");
      else if (y === h - 1) at(x, y, z, "stone");
      continue;
    }
    if (door(x, y, z)) { at(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (lantern(x, y, z)) { at(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (y === 0) { at(x, y, z, "stone_bricks"); continue; }       // base course
    if (y === h - 1) { at(x, y, z, "smooth_stone"); continue; }   // cornice / parapet cap
    if (windowAt(x, y, z)) { at(x, y, z, "glass_pane"); continue; }
    at(x, y, z, "bricks");
  }
}

// Warm light behind a few panes (interior cells, air behind the glass)
at(1, 1, 1, "glowstone");
at(2, 1, 1, "glowstone");
at(4, 2, 1, "shroomlight");

// Rooftop units on the flank roofs (one block above the deck, a half slab each)
at(1, 3, 2, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
at(1, 3, 4, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// Pane connections: a pane joins its neighbours in the wall plane (panes and solid masonry)
const SOLID = new Set(["bricks", "stone_bricks", "smooth_stone", "stone", "glass_pane"]);
const joins = (x, y, z) => SOLID.has(here(x, y, z));
for (const [key, v] of put) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = {
    north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)),
    east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([6, 16, 6]);
for (const [key, v] of put) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC75395.nbt`);
console.log(`DC75395.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
