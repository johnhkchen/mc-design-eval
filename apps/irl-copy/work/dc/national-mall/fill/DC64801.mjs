// 1107 7th St NW, Washington DC 20001: a flat-roofed brick apartment block, two storeys of windows over a
// stone shopfront/base row, with a limestone (calcite) string course, a stone cornice, a dark tar roof and a
// small mechanical penthouse. The lidar gives roof 4 above y0 everywhere, so it is one flat massing, no setbacks.
// Walls are one block thick on the perimeter; the interior is air (behind the glass) with a floor and a ceiling slab.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64801.cells.json", "utf8"));
const W = 12, D = 6, H = 16;
const roofAt = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const onFoot = (x, z) => roofAt.has(`${x},${z}`);

// the plan: "x,y,z" -> { block, state }; anything absent is air
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);

// front = z 0 (street face), back = z D-1, west = x 0, east = x W-1
const frontWin = [1, 2, 4, 7, 9, 10], frontDoor = [5, 6], backWin = [2, 3, 5, 6, 8, 9], sideWin = [1, 2, 3, 4];
const doorState = (x, half) => ({ facing: "north", half, hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });

for (const [key, { g, r }] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  const top = r - 1;
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  for (let y = g; y <= top; y++) {
    if (!perimeter) {
      // interior: a floor slab on the ground storey, air for the storey, a ceiling slab, the tar roof deck on top
      if (y === 0) put(x, y, z, "smooth_stone");
      else if (y === 2) put(x, y, z, "smooth_stone");
      else if (y === top) put(x, y, z, "deepslate_tiles");
      continue;
    }
    const front = z === 0, back = z === D - 1;
    const win = front ? frontWin.includes(x) : back ? backWin.includes(x) : sideWin.includes(z);
    const door = front && frontDoor.includes(x);
    if (y === 0) {
      // base course: stone, shopfront glass on the street face
      if (front && win) put(x, y, z, "glass_pane");
      else if (door) put(x, y, z, "dark_oak_door", doorState(x, "lower"));
      else put(x, y, z, "stone_bricks");
    } else if (y === 1) {
      if (door) put(x, y, z, "dark_oak_door", doorState(x, "upper"));
      else if (win) put(x, y, z, "glass_pane");
      else put(x, y, z, "bricks");
    } else if (y === 2) {
      // storey line, a canopy lintel over the entrance
      if (door) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "calcite");
    } else {
      put(x, y, z, "stone_bricks");   // cornice
    }
  }
}

// the lanterns sit on the ground-storey floor behind the glass; the entrance lantern hangs under the ceiling slab
for (const [x, z] of [[2, 1], [9, 1], [3, 4], [8, 4]]) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
put(5, 1, 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof penthouse: a small mechanical box on the tar deck, set back from the street face
for (const x of [8, 9]) for (const z of [2, 3]) put(x, 4, z, "light_gray_concrete");

// glass panes connect to their in-plane neighbours (other panes and the wall's full faces)
const paneDirs = (x, y, z) => {
  const s = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (z === 0 || z === D - 1) { s.east = has(x + 1, y, z) ? "true" : "false"; s.west = has(x - 1, y, z) ? "true" : "false"; }
  else { s.south = has(x, y, z + 1) ? "true" : "false"; s.north = has(x, y, z - 1) ? "true" : "false"; }
  return s;
};
for (const [k, v] of plan) if (v.block === "glass_pane") { const [x, y, z] = k.split(",").map(Number); v.state = paneDirs(x, y, z); }

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64801.nbt";
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
