// SEA1270159763: small utility / service shed, 10 x 4 with the south-east corner notched (footprint from the manifest).
// Stone foundation, light-gray walls with andesite ribs (corrugated look), an iron door on the street side, an iron-bar
// louvered vent, a glass service window, a flat roof with a slab edge, and a small rooftop vent.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270159763";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const leftovers = JSON.parse(readFileSync(`${DIR}/leftovers.json`, "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
const box = leftovers.find((q) => q.id === ID).box;
const [X0, Z0] = [box[0], box[1]];
const W = box[2] - box[0] + 1, D = box[3] - box[1] + 1, H = 10;
const FP = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFP = (x, z) => FP.has(`${x},${z}`);
const edge = (x, z) => inFP(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFP(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const bar = (ax) => (ax === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const pane = (ax) => bar(ax);
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const cells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) cells.push([x, z]);
const walls = cells.filter(([x, z]) => edge(x, z));

// solid stone foundation under the whole footprint, y0-1
for (const [x, z] of cells) { g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks"); }

// walls y2-3: light gray concrete with andesite ribs on alternate columns (corrugated)
for (const [x, z] of walls) {
  const rib = x % 2 === 1 ? "andesite" : "light_gray_concrete";
  g.set(x, 2, z, rib); g.set(x, 3, z, rib);
}

// street-side iron door (south edge, x=2): lower half y2, upper half y3
g.set(2, 2, 3, "iron_door", door("lower"));
g.set(2, 3, 3, "iron_door", door("upper"));

// louvered vent on the north wall: iron bar slats, two rows
for (const x of [5, 6, 7]) for (const y of [2, 3]) g.set(x, y, 0, "iron_bars", bar("x"));

// service window on the east wall (x=9, z=1)
g.set(9, 2, 1, "glass_pane", pane("z"));
g.set(9, 3, 1, "glass_pane", pane("z"));

// shallow flat roof at y4: smooth stone deck, stone-brick slab edge along the perimeter
for (const [x, z] of cells) {
  if (edge(x, z)) g.set(x, 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, 4, z, "smooth_stone");
}

// small rooftop vent: an iron block with an iron-bar grille on top
g.set(3, 5, 1, "iron_block");
g.set(3, 6, 1, "iron_bars", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });

const out = g.save(`${DIR}/${ID}.nbt`);
console.log(ID, "size", [W, H, D], "blocks", out.blocks, "palette", out.palette);
