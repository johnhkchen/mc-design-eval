// 801 R St NW: a three-storey brick walk-up (c.1910s, LeDroit Park / Shaw edge). Flat lidar roof at 4 blocks on a
// flat lot, so the massing is one box: brick walls on the footprint perimeter, dressed stone piers and a stone
// cornice, glass panes in a bay grid, a double entrance on the front (z=0), a ground floor slab, and a roof deck
// with two rooftop condenser units. The interior is an air gap behind the glass (z=1) and a floor slab at ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58458.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..4
const g = new Voxels([10, 16, 5]);

const BRICK = "bricks", STONE = "smooth_stone", TRIM = "stone_bricks", ROOF = "stone";
const PANE = (x, z) => ({ east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
// the ground of each cell comes from the record; y 0 is the lowest ground, and the massing stands on it
const ground = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { ground: gr, roof }]));
const inFootprint = (x, z) => ground.has(`${x},${z}`);
const roofAt = (x, z) => ground.get(`${x},${z}`).roof;   // 4 everywhere on this lot

// ---- 1. the shell: the outer ring is solid to the roof, the interior is hollow (air) above the ground slab
for (const [x, z] of cells) {
  const edge = x === 0 || x === 9 || z === 0 || z === 4;
  const top = roofAt(x, z) - 1;                             // the roof's top layer is y 3
  for (let y = 0; y < top; y++) {
    if (edge) g.set(x, y, z, BRICK);
  }
  // roof deck and cornice at y 3 (the top layer)
  g.set(x, top, z, edge ? STONE : ROOF);
}

// ---- 2. piers: dressed stone at the corners and between bays on the front and back, brick elsewhere
const isPier = (x) => x === 0 || x === 3 || x === 6 || x === 9;
for (const z of [0, 4]) for (let x = 0; x < 10; x++) {
  if (!isPier(x)) continue;
  for (let y = 0; y < 3; y++) g.set(x, y, z, TRIM);        // plinth and pier faces, stone-dressed
}
for (let y = 0; y < 3; y++) { g.set(0, y, 0, TRIM); g.set(9, y, 0, TRIM); g.set(0, y, 4, TRIM); g.set(9, y, 4, TRIM); }

// ---- 3. the interior: an air gap behind the glass at z=1, a ground floor slab behind it, and open rooms
for (let x = 1; x <= 8; x++) for (let z = 1; z <= 3; z++) {
  for (let y = 0; y < 3; y++) g.set(x, y, z, "air");      // ensure the air
  if (z >= 2) g.set(x, 0, z, STONE);                       // ground floor slab (behind the air gap)
}

// ---- 4. window bays: x 1-2 and 7-8 on the front, 1-2, 4-5 and 7-8 on the back; glass panes over three storeys
const bays = [[1, 2], [7, 8]];
const backBays = [[1, 2], [4, 5], [7, 8]];
for (const [a, b] of bays) for (let y = 0; y < 3; y++) for (let x = a; x <= b; x++) {
  g.set(x, y, 0, "glass_pane", PANE(x, 0));
}
for (const [a, b] of backBays) for (let y = 0; y < 3; y++) for (let x = a; x <= b; x++) {
  g.set(x, y, 4, "glass_pane", PANE(x, 4));
}
// end walls: one window bay of three panes on each end at storey 1 and 2, centred on z 1-3
for (const x of [0, 9]) for (let y = 0; y < 3; y++) for (let z = 1; z <= 3; z++) {
  g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
}
// keep the ends' pier corners as stone, so the end windows sit between dressed stone
for (const x of [0, 9]) for (let y = 0; y < 3; y++) { g.set(x, y, 0, TRIM); g.set(x, y, 4, TRIM); }

// ---- 5. the entrance: a double door on the front centre, lower and upper halves; stone lintel above
const door = (x, half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
g.set(4, 0, 0, "oak_door", door(4, "lower", "left"));
g.set(4, 1, 0, "oak_door", door(4, "upper", "left"));
g.set(5, 0, 0, "oak_door", door(5, "lower", "right"));
g.set(5, 1, 0, "oak_door", door(5, "upper", "right"));
// stone surround over the doors (the lintel row is the storey-2 band over the entrance)
g.set(4, 2, 0, TRIM); g.set(5, 2, 0, TRIM);
// ---- 6. warm light: lanterns hang from the roof deck in the air gap behind the panes, a shroomlight sits at the ground
const lantern = { hanging: "true", waterlogged: "false" };
g.set(4, 2, 1, "lantern", lantern);                       // the entrance hall, under the deck
g.set(2, 2, 1, "lantern", lantern);
g.set(7, 2, 1, "lantern", lantern);
g.set(8, 0, 1, "shroomlight");

// ---- 7. roof: two condenser units on the deck (above the roof line, as real equipment is)
g.set(2, 4, 2, "iron_block");
g.set(7, 4, 2, "iron_block");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58458.nbt");
console.log(JSON.stringify(stats));
