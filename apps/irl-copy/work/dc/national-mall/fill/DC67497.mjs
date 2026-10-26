import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67497.cells.json`, "utf8"));

const W = 21, H = 33, D = 16;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Footprint lookup
const cm = new Map();
for (const [x, z, gr, ro] of cells) cm.set(`${x},${z}`, { x, z, G: gr, R: ro });
const has = (x, z) => cm.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outward = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz)) || null;
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// One global storey grid (from the lowest ground) so tiers line up across the block
const Gmin = Math.min(...[...cm.values()].map(c => c.G));
const tops = new Map();
let maxTop = 0;
for (const c of cm.values()) {
  let top = Gmin + 4 * Math.round((c.R - Gmin) / 4);
  top = Math.max(top, c.G + 8);
  top = Math.min(top, H - 6);
  tops.set(`${c.x},${c.z}`, top);
  if (top > maxTop) maxTop = top;
}

// Front entrance: front (north, z-) edge cell nearest the middle
let doorCell = null;
for (const c of cm.values()) {
  const o = outward(c.x, c.z);
  if (!o || o[0] !== 0 || o[1] !== -1) continue;
  if (!doorCell || Math.abs(c.x - 10) < Math.abs(doorCell.x - 10)) doorCell = c;
}
const doorX = doorCell ? doorCell.x : 10;

for (const c of cm.values()) {
  const { x, z, G } = c;
  const top = tops.get(`${x},${z}`);

  // Solid foundation up to ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs on the global storey grid, roof slab; air between
    put(x, G, z, "smooth_stone");
    for (let y = Gmin; y < top; y += 4) if (y > G) put(x, y, z, "smooth_stone");
    put(x, top, z, "smooth_stone");
    continue;
  }

  const o = outward(x, z) || [0, -1];
  const alongX = o[0] === 0;
  const corner = isCorner(x, z);
  const odd = (x + z) % 2 === 1;
  const frontDoorRow = o[0] === 0 && o[1] === -1;
  const nearDoor = frontDoorRow && Math.abs(x - doorX) <= 1;
  const isDoor = frontDoorRow && x === doorX;

  for (let y = G; y < top; y++) {
    const rel = y - Gmin;
    const s = Math.floor(rel / 4);
    const k = rel % 4;
    let b, p = undefined, glass = false;

    if (corner) {
      // Quoin columns: stone pilasters at the corners
      b = k === 0 ? "smooth_sandstone" : "smooth_sandstone";
      if (k === 2 && s > 0) b = "stone_bricks";
    } else if (k === 0) {
      b = "smooth_sandstone"; // storey line / sill band
    } else if (s === 0) {
      if (k === 3) b = "smooth_sandstone"; // shop transom
      else if (nearDoor) b = "polished_andesite"; // entrance surround
      else if (odd) { b = "glass_pane"; glass = true; }
      else b = "polished_andesite";
    } else {
      if (k === 3) b = "bricks"; // spandrel
      else if (odd) { b = "glass_pane"; glass = true; }
      else b = "stone_bricks"; // mullions
    }

    if (b === "glass_pane") {
      p = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    }

    // Entrance door and warm transom light
    if (isDoor && s === 0 && (k === 1 || k === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north", hinge: "left", open: "false", powered: "false",
        half: k === 1 ? "lower" : "upper",
      });
      continue;
    }
    if (isDoor && s === 0 && k === 3) {
      put(x, y, z, "shroomlight");
      continue;
    }

    put(x, y, z, b, p);

    // Warm lights behind some windows
    if (glass && (x * 7 + z * 3 + s) % 4 === 0) {
      const ix = x - o[0], iz = z - o[1];
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "shroomlight");
    }
  }

  // Solid cornice course and parapet
  put(x, top, z, "smooth_sandstone");
  put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant on the tallest tier, set back from the parapet
for (const c of cm.values()) {
  const { x, z } = c;
  const top = tops.get(`${x},${z}`);
  if (top !== maxTop || isEdge(x, z)) continue;
  if (x >= 6 && x <= 14 && z >= 5 && z <= 10) {
    put(x, top + 1, z, "light_gray_concrete");
    if (x >= 7 && x <= 13 && z >= 6 && z <= 9) put(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC67497.nbt`);
