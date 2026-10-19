// SEA1270159762: covered walkway / bike-and-bus shelter, 17 x 4 (footprint from the manifest, box from leftovers.json).
// Gray concrete slab base, steel (iron bar) posts every 4 blocks on the long sides, a flat gray canopy with a yellow
// stripe edge, two benches under it, glass back panels in two bays, low stone-brick kerb walls, hanging lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270159762";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const leftovers = JSON.parse(readFileSync(`${DIR}/leftovers.json`, "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
const box = leftovers.find((q) => q.id === ID).box;
const [X0, Z0] = [box[0], box[1]];
const W = box[2] - box[0] + 1, D = box[3] - box[1] + 1, H = 10;
const FP = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFP = (x, z) => FP.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const bar = (ax) => (ax === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const post = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
const kerb = { east: "low", west: "low", north: "none", south: "none", up: "true", waterlogged: "false" };
const slab = (type) => ({ type, waterlogged: "false" });

const cells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) cells.push([x, z]);

// slab base: solid foundation y0-1, gray concrete base and a light floor
for (const [x, z] of cells) { g.set(x, 0, z, "gray_concrete"); g.set(x, 1, z, "light_gray_concrete"); }

// posts every 4 blocks on the back (z=0) and front (z=D-1) edges, plus the end corners
const posts = [0, 4, 8, 12, 16];
for (const x of posts) for (const z of [0, D - 1]) for (const y of [2, 3]) g.set(x, y, z, "iron_bars", post);

// back (z=0) panel: glass in two bays, low stone-brick kerb elsewhere, open above the kerb
const GLASS = new Set([1, 2, 3, 9, 10, 11]);
for (let x = 1; x < W - 1; x++) {
  if (posts.includes(x)) continue;
  if (GLASS.has(x)) { g.set(x, 2, 0, "glass_pane", bar("x")); g.set(x, 3, 0, "glass_pane", bar("x")); }
  else g.set(x, 2, 0, "stone_brick_wall", kerb);
}

// ends (x=0, x=W-1): low kerb between the corner posts
for (let z = 1; z < D - 1; z++) for (const x of [0, W - 1]) g.set(x, 2, z, "stone_brick_wall", { east: "none", west: "none", north: "low", south: "low", up: "true", waterlogged: "false" });

// two benches under the canopy, seats at y2 on the row in front of the back panel
for (const [x0, x1] of [[5, 7], [13, 15]]) for (let x = x0; x <= x1; x++) g.set(x, 2, 2, "oak_slab", slab("bottom"));

// hanging lanterns under the canopy
for (const x of [2, 14]) g.set(x, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// flat canopy at y4: light gray deck, the yellow stripe on the street (front) edge only
for (const [x, z] of cells) g.set(x, 4, z, z === D - 1 ? "yellow_concrete" : "light_gray_concrete");

const out = g.save(`${DIR}/${ID}.nbt`);
console.log(ID, "size", [W, H, D], "blocks", out.blocks, "palette", out.palette);
