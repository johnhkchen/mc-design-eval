import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3430040";
const W = 33, D = 31;
const ROOF_CAP = 20;

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = new Map();
for (const r of rows) {
  const [x, z, gnd, roof] = r;
  cells.set(`${x},${z}`, { x, z, gnd: Math.round(gnd), roof: Number(roof) });
}
const has = (x, z) => cells.has(`${x},${z}`);

// ---- smooth roof into clean tiers (5x5 mean, capped, snapped to even) -----
for (const c of cells.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = cells.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.roof; n++; }
  }
  let R = Math.round((sum / n) / 2) * 2;
  R = Math.min(R, ROOF_CAP);
  c.R = Math.max(R, c.gnd + 4);
}
// second pass: a cell may not stand more than one tier above its perimeter neighbours
for (const c of cells.values()) {
  let minNb = Infinity;
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const o = cells.get(`${c.x + dx},${c.z + dz}`);
    if (o) minNb = Math.min(minNb, o.R);
  }
  if (minNb < Infinity && c.R > minNb + 4) c.R = minNb + 4;
}
let maxR = 0;
for (const c of cells.values()) maxR = Math.max(maxR, c.R);
const H = maxR + 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  props ? g.set(x, y, z, id, props) : g.set(x, y, z, id);
};

// ---- storey logic (rel = height above the cell's own ground) ---------------
const isFloor = (rel) => rel === 0 || (rel >= 4 && (rel - 4) % 3 === 0);

function facade(x, z, face, rel) {
  const alongX = face === "z";
  const u = alongX ? x : z;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (rel === 0) return ["polished_andesite"];
  if (rel <= 3) {
    if (u % 4 === 0) return ["stone_bricks"];
    if (rel === 3) return ["dark_oak_planks"];
    if (rel === 2 && u % 6 === 3) return ["glowstone"];
    return ["glass"];
  }
  if (u % 4 === 0) return ["bricks"];
  if (isFloor(rel)) return ["smooth_stone"];
  if ((u + rel) % 11 === 3) return ["glowstone"];
  return ["glass_pane", paneProps];
}

// ---- build the body ---------------------------------------------------------
for (const c of cells.values()) {
  const { x, z, gnd, R } = c;
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  let face = null;
  if (!has(x, z - 1) || !has(x, z + 1)) face = "z";
  else if (!has(x - 1, z) || !has(x + 1, z)) face = "x";
  const zMin = !has(x, z - 1);

  for (let y = gnd; y < R; y++) {
    const rel = y - gnd;
    if (y === R - 1) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (perim) {
      // Entrance on the low-z (Jay Street) face: door centred at x=16,
      // flanked by stone pillars, glazed bays either side.
      if (zMin && (x === 15 || x === 17) && (rel === 1 || rel === 2)) {
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (zMin && x === 16 && (rel === 1 || rel === 2)) {
        const props = {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        };
        put(x, y, z, "dark_oak_door", props);
        continue;
      }
      if (zMin && x === 16 && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      const [id, props] = facade(x, z, face, rel);
      put(x, y, z, id, props);
    } else if (isFloor(rel)) {
      put(x, y, z, "smooth_stone");
    }
  }
}

// ---- rooftop mechanical penthouse -----------------------------------------
for (const c of cells.values()) {
  const { x, z, R } = c;
  if (x < 9 || x > 23 || z < 9 || z > 21) continue;
  const edge = x === 9 || x === 23 || z === 9 || z === 21;
  for (let y = R; y <= R + 2; y++) {
    if (edge) {
      if (y === R + 1) put(x, y, z, "glass");
      else put(x, y, z, "light_gray_concrete");
    } else if (y === R + 2) {
      put(x, y, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
