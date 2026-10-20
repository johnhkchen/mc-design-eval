import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1145108056";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks, slab at 5, roof slab at 10, parapet at 11.
const MAX_BASE = 10;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const exposedCell = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const put = (x, y, z, b, st) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, b, st);
  else g.set(x, y, z, b);
};

for (const [x, z, gr] of cells) {
  const base = Math.min(gr, MAX_BASE);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const W_ = !has(x - 1, z);
  const E = !has(x + 1, z);
  const exposed = N || S || W_ || E;
  const entrance = N && x >= 3 && x <= 5;
  // Along-face coordinate and the inward neighbour for warm lights.
  const t = (N || S) ? x : z;
  let inward = null;
  if (N) inward = [x, z + 1];
  else if (S) inward = [x, z - 1];
  else if (W_) inward = [x + 1, z];
  else if (E) inward = [x - 1, z];

  for (let rel = 0; rel <= 12; rel++) {
    const y = base + rel;

    if (rel === 0) {
      put(x, y, z, exposed ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (rel === 5 || rel === 10) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 11) {
      if (exposed) put(x, y, z, "white_concrete");
      else if (x >= 2 && x <= 4 && z >= 8 && z <= 11) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 12) {
      if (!exposed && x >= 2 && x <= 4 && z >= 8 && z <= 11) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (!exposed) continue; // interior air

    // Facade on exposed cells.
    if (rel >= 1 && rel <= 3) {
      if (entrance) {
        if (rel <= 2) put(x, y, z, "glass");
        else put(x, y, z, "white_concrete");
      } else if (t % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else if (rel === 4) {
      if (entrance) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else put(x, y, z, "white_concrete");
    } else if (rel === 6 || rel === 9) {
      put(x, y, z, "white_concrete");
    } else if (rel === 7 || rel === 8) {
      if (t % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane");
    }

    // Warm light behind selected glass bays (inward interior cell).
    if ((rel === 2 || rel === 7) && !entrance && t % 3 !== 0 && t % 6 === 1 && inward && has(inward[0], inward[1]) && !exposedCell(inward[0], inward[1])) {
      put(inward[0], y, inward[1], "glowstone");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
