// DC68058: a two-storey brick commercial block on the Mall's flank, 7 x 3 blocks, roof 6 above y 0.
// Front (z 0) faces north: a granite base, a shopfront with a central door under a quartz string course,
// then one row of punched windows and a quartz parapet cap. Brick side and back walls, stone roof deck.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68058.cells.json", "utf8"));   // [x, z, ground, roof]

// lidar roof heights are noisy: the modal height is the building's roof, and a cell within one block of it is that roof
const modal = (() => { const n = new Map(); for (const c of cells) n.set(c[3], (n.get(c[3]) ?? 0) + 1); return [...n].sort((a, b) => b[1] - a[1])[0][0]; })();
const top = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, Math.abs(r - modal) <= 1 ? modal : r]));
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));

const g = new Voxels([7, 18, 3]);
const pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const perimeter = (x, z) => x === 0 || x === 6 || z === 0 || z === 2;
const front = (z) => z === 0;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const k = `${x},${z}`, roof = top.get(k), ground0 = ground.get(k);
  // y 0: base course (granite), which is also the foundation where the ground rises (x 4..6 at the front)
  g.set(x, 0, z, "polished_granite");
  for (let y = 1; y < ground0; y++) g.set(x, y, z, "polished_granite");

  // y 3: storey line / floor slab between the two storeys (quartz string course on the front, floor inside)
  g.set(x, 3, z, z === 1 && x >= 1 && x <= 5 ? "smooth_stone" : "smooth_quartz");

  // y 5: parapet cap on the perimeter (quartz), roof deck inside (smooth stone), up to the roof height
  for (let y = 5; y < roof; y++) g.set(x, y, z, perimeter(x, z) ? "smooth_quartz" : "smooth_stone");

  if (!perimeter(x, z)) continue;   // the interior (z 1, x 1..5) is air behind the glass, apart from the lights below

  // ground storey, y 1..2: shopfront with piers at x 0, 4, 6; the door at x 2; glazing at x 1, 3, 5
  // upper storey, y 4: piers at even x, windows at x 1, 3, 5
  for (const y of [1, 2, 4]) {
    if (!front(z)) { g.set(x, y, z, "bricks"); continue; }
    if (x % 2 === 0) g.set(x, y, z, y === 4 ? "bricks" : "smooth_quartz");
    else if (y === 4 || x !== 2) g.set(x, y, z, "glass_pane", pane);
  }
}

// the door in the centre of the shopfront, and the lights behind the glass
g.set(2, 1, 0, "dark_oak_door", door("lower"));
g.set(2, 2, 0, "dark_oak_door", door("upper"));
g.set(1, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(5, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, 4, 1, "glowstone");
g.set(3, 4, 1, "lantern", { hanging: "false", waterlogged: "false" });

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68058.nbt");
console.log(JSON.stringify({ modalRoof: modal, ...r }));
