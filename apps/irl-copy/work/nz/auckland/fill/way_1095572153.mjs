// way 1095572153 (Eden Terrace-style 1920s plastered-brick shop with a parapet): one storey plus parapet, shop tip to the north
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572153.cells.json", "utf8"));
const g = new Voxels([8, 19, 9]);

const key = (x, z) => `${x},${z}`;
const inS = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inS.has(key(x, z));
const TOP = Math.max(...cells.map((c) => c[3]));           // lidar roof height above y 0 (6 across the footprint)
const FLOOR = 0, BASE = 1, WIN_LO = 2, WIN_HI = 3, DECK = TOP - 2, PARAPET = TOP - 1;

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const faces = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);
const perimeter = (x, z) => faces(x, z).length > 0;
const corner = (x, z) => faces(x, z).length > 1;

// the shop tip (north, z 0): a door and a shopfront under a dark fascia
const DOOR = [2, 0], SHOP = [3, 0];
const isFront = (x, z) => z === 0 && (x === DOOR[0] || x === SHOP[0]);

for (const [x, z] of cells) {
  g.set(x, FLOOR, z, "stone_bricks");                                   // footing and floor slab under the whole footprint
  if (perimeter(x, z)) {
    g.set(x, BASE, z, "stone_bricks");                                  // base course
    for (let y = WIN_LO; y <= WIN_HI; y++) g.set(x, y, z, corner(x, z) ? "quartz_pillar" : "smooth_quartz", corner(x, z) ? { axis: "y" } : undefined);   // quoins at the convex corners
    g.set(x, DECK, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // cornice line on the wall top
    g.set(x, PARAPET, z, corner(x, z) ? "chiseled_quartz_block" : "smooth_quartz");
  } else {
    g.set(x, DECK, z, "smooth_stone");                                  // roof deck over the interior
  }
}

for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  const bay = faces(x, z).length === 1 && (x + z) % 3 !== 0 && !isFront(x, z);   // flat faces: two bays in three, a pier every third cell
  if (bay) for (let y = WIN_LO; y <= WIN_HI; y++) g.set(x, y, z, "glass_pane");   // window bay (connections set below)
}

// shopfront: door at the left of the tip, glass at the right, dark fascia over both
if (has(...DOOR) && has(...SHOP)) {
  const [dx, dz] = DOOR, [sx, sz] = SHOP;
  g.set(dx, BASE, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, BASE + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(sx, BASE, sz, "glass");
  g.set(sx, BASE + 1, sz, "glass");
  for (const x of [dx, sx]) g.set(x, WIN_HI, 0, "dark_oak_planks");   // fascia
}

// warm light: hanging lanterns under the deck in the interior, and iron plant on the roof
for (const [x, z] of cells) {
  if (perimeter(x, z)) continue;
  if ((x + z) % 3 === 0) g.set(x, WIN_HI, z, "lantern", { hanging: "true", waterlogged: "false" });
}
const plant = cells.filter(([x, z]) => !perimeter(x, z)).filter((_, i, a) => i === 0 || i === a.length - 1);
for (const [x, z] of plant) g.set(x, PARAPET, z, "iron_block");

// glass panes connect to solid neighbours and to other panes, never to air
const DIRS_STATE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (let z = 0; z < 9; z++) for (let x = 0; x < 8; x++) {
  for (let y = 0; y < 19; y++) {
    const here = g.get(x, y, z);
    if (!here || here.block !== "minecraft:glass_pane") continue;
    const state = { waterlogged: "false" };
    for (const [name, [dx, dz]] of Object.entries(DIRS_STATE)) {
      const n = g.get(x + dx, y, z + dz);
      state[name] = String(!!n && (n.block === "minecraft:glass_pane" || n.block !== "minecraft:air"));
    }
    g.set(x, y, z, "glass_pane", state);
  }
}

// no floating blocks: everything above y 0 rests on a block below it, or hangs from one above
const floating = [];
for (let z = 0; z < 9; z++) for (let x = 0; x < 8; x++) for (let y = 1; y < 19; y++) {
  const b = g.get(x, y, z); if (!b) continue;
  const under = g.get(x, y - 1, z), above = g.get(x, y + 1, z);
  // the roof deck is a floor slab spanning the interior, carried by the perimeter ring (requested: a slab per storey)
  if (b.block === "minecraft:smooth_stone") continue;
  if (!under && !(b.block === "minecraft:lantern" && above)) floating.push([x, y, z, b.block]);
}
if (floating.length) console.warn("floating:", floating);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572153.nbt");
