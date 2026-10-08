// Decor pass for fixtures/spruce-hallway.nbt -> out.nbt
//   node demos/spruce-hallway/beautify.mjs
//
// Brief: a taiga hillside-base service corridor — dark spruce timber frame on a pale stone footing,
// black-iron lanterns on the bay rhythm. West side = the "machine side": the live redstone line runs
// on its own plank strip against a stone kick course, so it reads as a showcased channel. East side =
// the "storage side": recessed panels and shelf niches between proud posts.
// Bays: posts every 4 blocks (z = 0,4,8,12,16,20), five 3-cell bays.
// Function: x=1,y=0..1 (floor strip + line) and x=1,y=2 (air above the line) are never written.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStructure } from "../../scripts/nbt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const IN = join(HERE, "..", "..", "fixtures", "spruce-hallway.nbt");
const OUT = join(HERE, "out.nbt");

const g = await loadStructure(IN);
const [W, , L] = g.size; // 7 x 6 x 21
g.resize([W + 1, 7, L]); // +x: backing for east recesses; +y: coffered ceiling (both into the hillside)

const B = {
  plank: "spruce_planks",
  log: "stripped_spruce_log",
  post: "spruce_log",
  stone: "stone_bricks",
  field: "polished_andesite",
  air: "air",
};
const POSTS = [0, 4, 8, 12, 16, 20];
const isPost = (z) => POSTS.includes(z);
const LINE_X = 1; // the redstone line column — never touch y 0..2 here

// Guard: refuse to write the function column (belt and braces on top of check.mjs).
const set0 = g.set.bind(g);
g.set = (x, y, z, ...rest) => {
  if (x === LINE_X && y <= 2) throw new Error(`generator tried to write function cell ${x},${y},${z}`);
  return set0(x, y, z, ...rest);
};
const fill = (a, b, block, state) => {
  for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
    for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
      for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) g.set(x, y, z, block, state);
};

// ---- clear old decor: the ad-hoc torches go; light moves onto the rhythm
for (const c of [...g]) if (c.block === "minecraft:wall_torch") g.unset(...c.pos), g.set(...c.pos, B.air);

// ================= PASS 1+2: structure + materials =================

// Floor: west border = the existing plank strip under the line (x=1, untouched); field = andesite;
// east border = planks; a log band under every frame line ties floor to ceiling.
for (let z = 0; z < L; z++) {
  fill([2, 0, z], [4, 0, z], isPost(z) ? B.log : B.field, isPost(z) ? { axis: "x" } : undefined);
  g.set(5, 0, z, B.plank);
}

// Walls, one bay line at a time.
function frameLine(z) {
  // west: post in the wall plane, corbel bracket above the channel, beam across
  g.set(0, 1, z, "chiseled_stone_bricks"); // post footing, in line with the kick course
  fill([0, 2, z], [0, 4, z], B.post, { axis: "y" });
  g.set(1, 3, z, "spruce_stairs", { facing: "west", half: "top" });
  // east: post standing proud of the wall on a stone plinth
  g.set(5, 1, z, "chiseled_stone_bricks"); // footing: the post lands on stone, not on the floor
  fill([5, 2, z], [5, 3, z], B.post, { axis: "y" });
  fill([6, 1, z], [6, 4, z], B.post, { axis: "y" });
  // beam (y=4) and ceiling rib (y=5)
  fill([1, 4, z], [5, 4, z], B.log, { axis: "x" });
  fill([1, 5, z], [5, 5, z], B.log, { axis: "x" });
}

function bay(z0, kind) {
  const zs = [z0 + 1, z0 + 2, z0 + 3];
  for (const z of zs) {
    // west wall (machine side): stone kick course behind the line, plank panel, log top rail
    g.set(0, 1, z, B.stone);
    fill([0, 2, z], [0, 3, z], B.plank);
    g.set(0, 4, z, B.log, { axis: "z" });
    // east wall (storage side): stone base course, recessed panel (wall cell left empty, backing at x=7)
    g.set(6, 1, z, B.stone);
    g.set(6, 4, z, B.log, { axis: "z" });
    fill([7, 1, z], [7, 4, z], B.plank);
    fill([6, 2, z], [6, 3, z], B.air);
    // ceiling: purlins on the long edges, coffer recessed one block up
    g.set(1, 5, z, B.log, { axis: "z" });
    g.set(5, 5, z, B.log, { axis: "z" });
    fill([2, 5, z], [4, 5, z], B.air);
    fill([2, 6, z], [4, 6, z], B.plank);
  }
  // east recess contents
  if (kind === "panel") {
    for (const z of zs) for (const y of [2, 3]) g.set(6, y, z, "spruce_trapdoor", { facing: "west", open: true, half: "bottom" });
  } else {
    // shelf niche: a slab ledge with storage on it (this corridor serves the storage wing)
    for (const z of zs) g.set(6, 2, z, "spruce_slab", { type: "top" });
    g.set(6, 3, zs[0], "barrel", { facing: "west" });
    g.set(6, 3, zs[2], "barrel", { facing: "west" });
    g.set(6, 3, zs[1], "decorated_pot");
  }
  // ================= PASS 3: depth and detail =================
  // west: a thin trapdoor shelf over the line, running corbel to corbel (y=3 keeps y=2 above the line clear)
  for (const z of zs) g.set(1, 3, z, "spruce_trapdoor", { facing: "east", half: "top", open: false });
  // ...with a few things the operator leaves on it on the way through (sparse: rest bays have nothing)
  const props = { 4: ["potted_fern", null, "candle"], 12: [null, "lantern", null], 16: ["candle", null, "potted_spruce_sapling"] }[z0];
  if (props) props.forEach((p, i) => p && g.set(1, 4, zs[i], p, p === "candle" ? { candles: 2, lit: false } : p === "lantern" ? { hanging: false } : undefined));
  // light on the rhythm: one lantern hung in each coffer
  g.set(3, 5, z0 + 2, "chain", { axis: "y" });
  g.set(3, 4, z0 + 2, "lantern", { hanging: true });
}

for (const z of POSTS) frameLine(z);
const kinds = ["panel", "niche", "panel", "niche", "panel"];
POSTS.slice(0, -1).forEach((z, i) => bay(z, kinds[i]));

await g.save(OUT);
console.log("wrote", OUT, g.size, g.voxels().length, "blocks");
