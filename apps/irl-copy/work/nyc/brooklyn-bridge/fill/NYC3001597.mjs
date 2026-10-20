import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001597";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 22, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup and one flat roof level (lidar noise smoothed to the median).
const raw = [];
const fp = new Map();
for (const [x, z, gr0, rf0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(H - 8, Math.round(gr0)));
  raw.push(Math.round(rf0));
  fp.set(`${x},${z}`, { gr, rf: 0 });
}
raw.sort((a, b) => a - b);
const roofLevel = Math.min(H, raw.length ? raw[Math.floor(raw.length / 2)] : 16);
for (const v of fp.values()) v.rf = Math.min(H, Math.max(v.gr + 6, roofLevel));

const inside = (x, z) => fp.has(`${x},${z}`);

// Street face = smallest z.
let zFront = Infinity;
for (const k of fp.keys()) zFront = Math.min(zFront, Number(k.split(",")[1]));

const frontXs = [...fp.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([, z]) => z === zFront)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

for (const [k, { gr, rf }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const perimeter = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  const onFront = z === zFront;
  const onBack = !inside(x, z + 1);
  const idx = (onFront || onBack) ? x : z;

  // Solid foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < rf; y++) {
    const off = y - gr;
    const top = y === rf - 1;

    if (!perimeter) {
      // Interior: floor slab per storey and roof deck; air between.
      if (top || off % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Parapet and cornice
    if (top) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === rf - 2) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    // Base course
    if (off === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    // Storey string courses (floor lines)
    if (off % 3 === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance: stone surround, oak door centred on the street face
    const isDoorCol = onFront && x === doorX;
    const isDoorSurround = onFront && Math.abs(x - doorX) === 1 && off <= 2;
    if (isDoorCol && off <= 1) {
      g.set(x, y, z, "oak_door", {
        facing: "south", half: off === 0 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false"
      });
      continue;
    }
    if (isDoorCol && off === 2) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (isDoorSurround) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Window bands: punched openings in brick, glass pane with stone sill/head
    const edgeLimit = (onFront || onBack) ? W - 1 : D - 1;
    const isWindow = idx % 2 === 1 && idx > 0 && idx < edgeLimit;
    if (isWindow) {
      if (off % 3 === 1) {
        g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "glass_pane");
      }
      // warm light behind some windows, one block in from the face
      if (off % 3 === 2 && (idx + gr + off) % 4 === 1) {
        const bz = onFront ? z + 1 : (onBack ? z - 1 : z);
        if (bz === z || inside(x, bz)) g.set(x, y, bz, "glowstone");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
