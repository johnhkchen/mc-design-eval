import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499452";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, D = 19, H = 30;
const MAX = 18;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { ground: Math.max(0, Math.round(gr)), roof: rf });
}
const inF = (x, z) => x >= 0 && z >= 0 && x <= MAX && z <= MAX && map.has(`${x},${z}`);

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const grounds = [...map.values()].map((c) => c.ground);
const roofs = [...map.values()].map((c) => c.roof);

const Bf = median(grounds);                 // storey datum
const RM = median(roofs);                   // typical roof height

// Per-cell eave height: lidar roof quantised to 3-block tiers (smooths noise,
// lets lower wings step down), total roof 4 blocks above the eave.
const eaveOf = (roof) => {
  const tier = Math.round(roof / 3) * 3;
  const t = Math.min(Math.max(tier, 12), 24);
  return t - 4;
};
// Keep the main block near the typical height so the massing reads as one building.
const eaveCell = (roof) => {
  const e = eaveOf(roof);
  const main = eaveOf(RM);
  return Math.abs(e - main) <= 3 ? e : (e < main ? e : Math.min(e, main + 3));
};

const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const mod5 = (v) => ((v % 5) + 5) % 5;
const d = (x, z) => Math.min(x, z, MAX - x, MAX - z);

const lit = [];
const eaveAt = new Map();

// ---- walls, foundations, facade -------------------------------------
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gc = c.ground;
  const E = eaveCell(c.roof);
  eaveAt.set(key, E);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) set(x, y, z, "stone");

  const nFace = !inF(x, z - 1);
  const sFace = !inF(x, z + 1);
  const wFace = !inF(x - 1, z);
  const eFace = !inF(x + 1, z);
  const perim = nFace || sFace || wFace || eFace;

  let face = null, idx = 0, inward = null;
  if (nFace) { face = "north"; idx = x; inward = [0, 1]; }
  else if (sFace) { face = "south"; idx = x; inward = [0, -1]; }
  else if (wFace) { face = "west"; idx = z; inward = [1, 0]; }
  else if (eFace) { face = "east"; idx = z; inward = [-1, 0]; }

  for (let y = gc; y < E; y++) {
    const rs = mod5(y - Bf);
    const st = Math.floor((y - Bf) / 5);

    if (y === E - 1) {
      // cornice course under the roof
      set(x, y, z, "smooth_stone");
      continue;
    }
    if (rs === 0) {
      // string course at each storey line
      set(x, y, z, "smooth_stone");
      continue;
    }

    if (perim) {
      // pilaster bays on every face: stone bricks; infill: stone
      const pilaster = idx % 3 === 0;
      const bay = idx % 3 === 1;
      const doorCol = idx === 9 && st === 0;

      if (doorCol && rs >= 1 && rs <= 3) {
        if (rs === 1) {
          set(x, y, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (rs === 2) {
          set(x, y, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          set(x, y, z, "stone_bricks");
        }
        continue;
      }

      if (bay && rs >= 1 && rs <= 3) {
        set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
        if (st >= 1 && ((idx + st) % 4 === 0) && rs === 2 && inward) {
          const ix = x + inward[0], iz = z + inward[1];
          if (inF(ix, iz)) lit.push([ix, y, iz]);
        }
        continue;
      }

      set(x, y, z, pilaster ? "stone_bricks" : "stone");
      continue;
    }

    set(x, y, z, "stone");
  }
}

// lit interiors behind some windows (after masonry so they are not overwritten)
for (const [x, y, z] of lit) set(x, y, z, "glowstone");

// ---- roof: four stepped courses of slate with outward-facing stairs ----
for (const [key] of map) {
  const [x, z] = key.split(",").map(Number);
  const E = eaveAt.get(key);
  const dd = d(x, z);
  for (let L = 0; L < 4; L++) {
    if (dd < L) break;
    const y = E + L;
    if (dd === L) {
      let facing;
      if (z === L) facing = "north";
      else if (z === MAX - L) facing = "south";
      else if (x === L) facing = "west";
      else facing = "east";
      set(x, y, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      set(x, y, z, "deepslate_tiles");
    }
  }
}

// stone chimney stacks standing on the roof's flat top
if (inF(5, 5)) {
  const E = eaveAt.get("5,5");
  for (let y = E + 4; y <= E + 6; y++) set(5, y, 5, "stone_bricks");
  set(5, E + 7, 5, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
