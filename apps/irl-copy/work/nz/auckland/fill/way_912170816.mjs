// way/912170816: a small three-storey shop-top block, Edwardian (c.1910s), the common Auckland main-street type of
// Mt Eden / Newton: red brick walls, cream plaster bands and a parapet, a timber shopfront at street level, a flat roof
// with a plant cabinet. The lidar roof is flat at y 11 over every cell, so the massing is one box; the slope under it
// (ground 0 on the north-west, 1 on the south-east) is taken up by a stone plinth on the downhill cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170816.cells.json", "utf8"));
const g = new Voxels([10, 24, 8]);

// storeys on absolute heights: ground 0..3 (shopfront), first 4..7 (windows), second 8..10 (windows, then the parapet)
const TOP = 10;
const foot = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
const inF = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => ({ n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) });
const isWall = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };
const DOOR = [1, 0];      // the north face, the street side

const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const door = (y, half) => ({ half, facing: "south", hinge: "left", open: "false", powered: "false" });

for (const [x, z, ground] of cells) {
  const e = exposed(x, z);
  const perim = isWall(x, z);
  const corner = (e.n || e.s) && (e.w || e.e);
  const along = e.n || e.s ? x : z;          // position along the exposed face: bays on even cells, piers on odd
  const bay = !corner && along % 2 === 0;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  // foundation: the plinth under the downhill cells, from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor and ceiling slabs per storey, air between (the glass has air behind it)
    for (const y of [ground, 3, 4, 7, 8, 9]) set(x, y, z, "smooth_stone");
    set(x, TOP, z, "gray_concrete");   // roof membrane
    continue;
  }

  // every exposed cell: base course, shopfront, storey bands, windows, parapet
  if (isDoor) {
    set(x, ground, z, "oak_door", door(ground, "lower"));   // the street door, two tall, set in the shopfront
    set(x, ground + 1, z, "oak_door", door(ground + 1, "upper"));
    set(x, 2, z, "glass");                                  // transom over the door
    set(x, 3, z, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" }); // canopy hood
  } else {
    set(x, ground, z, "stone_bricks");
    for (let y = ground + 1; y <= 2; y++) set(x, y, z, bay ? "glass" : "dark_oak_planks"); // glazing / timber frame
  }
  if (!isDoor) {
    set(x, 3, z, "smooth_quartz");     // fascia
  }
  set(x, 4, z, "smooth_quartz");       // first-floor sill
  for (const y of [5, 6]) set(x, y, z, bay ? "glass" : "bricks");
  set(x, 7, z, "smooth_quartz");       // first-floor head band
  set(x, 8, z, "smooth_quartz");       // second-floor sill
  set(x, 9, z, bay ? "glass" : "bricks");
  set(x, TOP, z, "smooth_quartz");     // parapet / cornice
  if (corner) set(x, TOP + 1, z, "stone_brick_wall"); // corner pinnacles break the flat parapet line
}

// warm light: glowstone in the interior just behind a shopfront window, lanterns hung from the ground-floor ceiling
for (const [x, z, ground] of cells) {
  if (isWall(x, z)) continue;
  const behindGlass = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => inF(a, b) && g.get(a, 2, b)?.block === "minecraft:glass");
  if (behindGlass && (x + z) % 2 === 0) set(x, ground + 1, z, "glowstone");
  else set(x, 2, z, "lantern", { hanging: "true" });
}

// roof plant: a small cabinet on four interior roof cells near the middle
for (const [x, z] of [[4, 3], [5, 3], [4, 4], [5, 4]]) {
  if (inF(x, z) && !isWall(x, z)) { set(x, TOP + 1, z, "stone_bricks"); set(x, TOP + 2, z, "iron_block"); }
}

// sanity: no solid block without a solid block directly beneath it (lanterns hang; the plant sits on the roof)
let floating = 0;
for (const [x, z] of cells) for (let y = 1; y <= 12; y++) {
  const b = g.get(x, y, z)?.block;
  if (b && b !== "minecraft:lantern" && !g.get(x, y - 1, z)) { floating++; console.warn(`air beneath ${b} at ${x},${y},${z}`); }
}
if (floating) console.warn(`${floating} blocks with air directly beneath`);

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170816.nbt");
console.log(`built way/912170816: ${out.blocks} blocks, ${out.palette} palette entries`);
