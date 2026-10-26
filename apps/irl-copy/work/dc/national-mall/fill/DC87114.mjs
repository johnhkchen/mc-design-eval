import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Hotel Washington, 1434 F St NW. Early-20th-century (1918) Beaux-Arts style hotel:
// a rusticated stone base, a pale limestone-like facade with regular bays, a heavy
// cornice, and a flat roof with a central penthouse. About 12 storeys in roughly 19 blocks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87114";
const W = 17, H = 31, D = 29;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr, rf] of raw) {
  cells.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => cells.has(`${x},${z}`);
const get = (x, z) => cells.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Wide smoothing (5x5 mean), then quantize to even heights so storeys align.
const meanRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c = get(x + dx, z + dz);
    if (c) { s += c.r; n++; }
  }
  return s / n;
};

const quant = new Map();
const counts = new Map();
for (const [k] of cells) {
  const [x, z] = k.split(",").map(Number);
  const q = 2 * Math.round(meanRoof(x, z) / 2);
  quant.set(k, q);
  counts.set(q, (counts.get(q) || 0) + 1);
}
// Main roof level = most common quantized height.
let mode = 0, best = -1;
for (const [q, n] of counts) if (n > best) { best = n; mode = q; }

const cellList = [];
for (const [k, c] of cells) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.g;
  const q = quant.get(k);
  // Cells near the main roof level take it exactly (one clean roof plane);
  // others keep their own storey-aligned step (lower wings, setbacks).
  const R0 = Math.abs(q - mode) <= 2 ? mode : q;
  const R = Math.min(H - 5, Math.max(gr + 6, R0));
  cellList.push({ x, z, gr, R, perim: isPerim(x, z) });
}

// Entrance: north face (min z), non-corner, column closest to the middle.
let door = null;
{
  let bestD = Infinity;
  for (const c of cellList) {
    if (!c.perim) continue;
    const n = !has(c.x, c.z - 1), w = !has(c.x - 1, c.z), e = !has(c.x + 1, c.z);
    if (n && !w && !e) {
      const d = Math.abs(c.x - 8);
      if (d < bestD) { bestD = d; door = `${c.x},${c.z}`; }
    }
  }
}

const isWinRow = (y, gr) =>
  y === gr + 2 || y === gr + 3 || (y >= gr + 5 && (y - gr - 5) % 2 === 0);

// Pass 1: foundation and solid massing.
for (const c of cellList) {
  for (let y = 0; y <= c.gr; y++) put(c.x, y, c.z, "stone_bricks");
  for (let y = c.gr + 1; y <= c.R - 1; y++) put(c.x, y, c.z, "stone");
}

// Pass 2: facade on perimeter cells.
for (const c of cellList) {
  if (!c.perim) continue;
  const { x, z, gr, R } = c;
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const zFace = n || s, xFace = w || e;
  const corner = zFace && xFace;
  const runX = zFace;
  const u = runX ? x : z;
  const pier = corner || u % 3 === 0;
  const isDoor = door === `${x},${z}`;

  for (let y = gr + 1; y <= R - 1; y++) {
    if (y === gr + 1) { put(x, y, z, "stone_bricks"); continue; }
    if (isDoor && (y === gr + 2 || y === gr + 3)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 2 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (!pier && isWinRow(y, gr) && y <= R - 2) {
      if (y < gr + 4) {
        put(x, y, z, "glass");
      } else if (runX) {
        put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
      continue;
    }
    put(x, y, z, "calcite");
  }
  // Cornice course on top of the facade.
  put(x, R, z, "quartz_slab", { type: "top", waterlogged: "false" });
}

// Pass 3: air gap behind each glazed bay, with warm lights in some of them.
for (const c of cellList) {
  if (!c.perim) continue;
  const { x, z, gr, R } = c;
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const zFace = n || s, xFace = w || e;
  if (zFace && xFace) continue; // corners have no windows
  const runX = zFace;
  const u = runX ? x : z;
  const pier = u % 3 === 0;
  const isDoor = door === `${x},${z}`;
  const out = n ? [0, -1] : s ? [0, 1] : w ? [-1, 0] : [1, 0];
  const ix = -out[0], iz = -out[1];
  const px = x + ix, pz = z + iz;
  if (!has(px, pz) || isPerim(px, pz)) continue;

  if (isDoor) {
    put(px, gr + 2, pz, "air");
    put(px, gr + 3, pz, "air");
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if (pier) continue;
  for (let y = gr + 2; y <= R - 2; y++) {
    if (!isWinRow(y, gr)) continue;
    put(px, y, pz, "air");
    if ((x + z + y) % 4 === 0) put(px, y, pz, "glowstone");
  }
}

// Pass 4: one central penthouse block on the main roof, no scattered plant.
for (const c of cellList) {
  if (c.perim) continue;
  if (c.R !== mode) continue;
  if (c.x >= 5 && c.x <= 11 && c.z >= 9 && c.z <= 19 && c.R + 2 < H) {
    put(c.x, c.R, c.z, "stone_bricks");
    put(c.x, c.R + 1, c.z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
