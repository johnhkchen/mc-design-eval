import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499507";
const W = 8, H = 23, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const glassNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Index recorded cells; find global lowest ground so y 0 is the base.
let gmin = Infinity;
for (const [, , ground] of cells) gmin = Math.min(gmin, Math.round(ground));
const raw = new Map();
for (const [x, z, ground, roof] of cells) {
  raw.set(`${x},${z}`, { gr: Math.round(ground) - gmin, R: Math.round(roof) - gmin });
}

// Fill any footprint cell missing from the file from its nearest recorded neighbour.
const map = new Map();
for (let x = 0; x < W; x++) {
  for (let z = 0; z < 29; z++) {
    const k = `${x},${z}`;
    if (raw.has(k)) { map.set(k, raw.get(k)); continue; }
    let best = null, bd = Infinity;
    for (const [kk, v] of raw) {
      const [xx, zz] = kk.split(",").map(Number);
      const d = Math.abs(xx - x) + Math.abs(zz - z);
      if (d < bd) { bd = d; best = v; }
    }
    if (best) map.set(k, { ...best });
  }
}

// Per-cell base and eave height.
const info = new Map();
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.gr;
  const E = clamp(c.R - 3, gr + 10, 19);
  info.set(key, { x, z, gr, E });
}

// Pass 1: foundation, walls, floors, roof.
for (const [key, { x, z, gr, E }] of info) {
  const perim = x === 0 || x === 7 || z === 0 || z === 28;

  for (let y = 0; y < gr; y++) P(x, y, z, "granite");

  if (perim) {
    P(x, gr, z, "polished_granite");
    for (let y = gr + 1; y <= E - 1; y++) P(x, y, z, "stone_bricks");
    P(x, gr + 5, z, "smooth_stone");
    P(x, E - 1, z, "smooth_stone");
  } else {
    P(x, gr, z, "smooth_stone");
    if (gr + 5 < E) P(x, gr + 5, z, "smooth_stone");
  }

  // Slate gable roof, ridge over x = 3..4, running along z.
  const d = Math.min(x, 7 - x);
  for (let y = E; y <= E + d - 1; y++) P(x, y, z, "deepslate_tiles");
  const facing = x < 4 ? "west" : "east";
  P(x, E + d, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

// Pass 2: openings, shopfront, entrance, lanterns.
for (const [key, { x, z, gr, E }] of info) {
  const sideBay = z >= 1 && z <= 27 && ((z - 1) % 5 >= 1) && ((z - 1) % 5 <= 3);

  if ((x === 0 || x === 7) && z >= 1 && z <= 27) {
    if (sideBay) {
      if (x === 0) {
        if (z === 13) {
          // Entrance: stone surround, door, glazed fanlight above.
          P(x, gr + 4, z, "polished_andesite");
          P(x, gr + 3, z, "glass_pane", glassNS);
          P(x, gr + 1, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
          P(x, gr + 2, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
          P(x, gr + 1, z - 1, "polished_andesite");
          P(x, gr + 2, z - 1, "polished_andesite");
          P(x, gr + 1, z + 1, "polished_andesite");
          P(x, gr + 2, z + 1, "polished_andesite");
        } else {
          P(x, gr + 1, z, "polished_andesite");
          for (let y = gr + 2; y <= gr + 3; y++) P(x, y, z, "glass_pane", glassNS);
          P(x, gr + 4, z, "polished_andesite");
        }
      } else {
        P(x, gr + 1, z, "polished_andesite");
        P(x, gr + 2, z, "glass_pane", glassNS);
        P(x, gr + 3, z, "glass_pane", glassNS);
        P(x, gr + 4, z, "polished_andesite");
      }

      if (gr + 9 < E) {
        P(x, gr + 6, z, "polished_andesite");
        P(x, gr + 7, z, "glass_pane", glassNS);
        P(x, gr + 8, z, "glass_pane", glassNS);
        P(x, gr + 9, z, "polished_andesite");
      }
    }

    // Warm lanterns standing on interior floors, glimpsed through the glass.
    if (sideBay && x === 7 && z % 2 === 0) P(1, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (sideBay && x === 0 && z % 3 === 0 && z !== 13) P(1, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (sideBay && gr + 6 < E && z % 3 === 1) P(1, gr + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Gable ends: windows on x = 2..5.
  if ((z === 0 || z === 28) && x >= 2 && x <= 5) {
    P(x, gr + 1, z, "polished_andesite");
    P(x, gr + 2, z, "glass_pane", glassEW);
    P(x, gr + 3, z, "glass_pane", glassEW);
    P(x, gr + 4, z, "polished_andesite");
    if (gr + 9 < E) {
      P(x, gr + 6, z, "polished_andesite");
      P(x, gr + 7, z, "glass_pane", glassEW);
      P(x, gr + 8, z, "glass_pane", glassEW);
      P(x, gr + 9, z, "polished_andesite");
    }
  }
}

// Pass 3: chimneys rising from the roof surface on solid tiles.
for (const [x, z] of [[2, 6], [5, 20]]) {
  const i = info.get(`${x},${z}`);
  if (!i) continue;
  for (let y = i.E + 2; y <= Math.min(i.E + 4, H - 1); y++) P(x, y, z, "stone_bricks");
  P(x, Math.min(i.E + 5, H - 1), z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
