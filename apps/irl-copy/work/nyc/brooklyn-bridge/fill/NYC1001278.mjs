import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001278";
const W = 21, H = 32, D = 10;

// ---- read footprint: [x, z, ground, roof] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = new Map();
for (const e of rows) {
  const [x, z, gr, rf] = Array.isArray(e) ? e : [e.x, e.z, e.ground, e.roof];
  if (x == null || z == null) continue;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = Math.max(0, Math.min(H - 6, Math.round(gr ?? 0)));
  let r = Math.round(rf ?? (g + 4));
  r = 2 * Math.round(r / 2);
  r = Math.max(g + 4, Math.min(H - 3, r));
  cells.set(`${x},${z}`, { g, r });
}

const has = (x, z) => cells.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

const paneZFace = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneXFace = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, { g: gy, r }] of cells) {
  const [x, z] = key.split(",").map(Number);

  // foundation up to each cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const nZ = !has(x, z - 1), pZ = !has(x, z + 1);
  const nX = !has(x - 1, z), pX = !has(x + 1, z);
  const zFace = nZ || pZ;
  const xFace = nX || pX;
  const corner = zFace && xFace;
  const facade = zFace || xFace;
  const along = zFace && !xFace ? x : z;

  for (let y = gy; y < r; y++) {
    const rel = y - gy;

    if (!facade) {
      if (y === r - 1) {
        g.set(x, y, z, "smooth_stone");
      } else if (rel % 2 === 0) {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    // ---- street facade with entrance ----
    if (nZ && x === 10 && rel <= 1) {
      const half = rel === 0 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (nZ && (x === 9 || x === 11) && rel <= 1) {
      // calcite door jambs
      g.set(x, y, z, "calcite");
      continue;
    }
    if (nZ && x >= 9 && x <= 11 && rel === 2) {
      // calcite lintel over the entrance
      g.set(x, y, z, "calcite");
      continue;
    }

    if (y === r - 1) {
      g.set(x, y, z, corner ? "calcite" : "stone_brick_wall");
      continue;
    }
    if (y === r - 2) {
      g.set(x, y, z, "calcite");
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, corner || along % 3 === 0 ? "calcite" : "polished_granite");
      continue;
    }
    if (corner || along % 3 === 0) {
      g.set(x, y, z, "calcite");
      continue;
    }
    if (rel % 2 === 1) {
      const lit = (rel % 4 === 1) && ((along + Math.floor(rel / 2)) % 7 === 3);
      if (lit) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "glass_pane", zFace ? paneZFace : paneXFace);
      }
      continue;
    }
    g.set(x, y, z, rel % 4 === 0 ? "calcite" : "bricks");
  }

  // roof equipment on the roof deck
  if (!facade && (x * 3 + z) % 11 === 0 && x > 2 && x < W - 3 && r + 2 <= H) {
    g.set(x, r, z, "stone_bricks");
    g.set(x, r + 1, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
