import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499612";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 24, D = 38;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Index footprint cells
const cm = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const c of cells) {
  const [x, z, gr, roof] = c;
  cm.set(x + "," + z, { gr: Math.round(gr), roof: Math.round(roof) });
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const has = (x, z) => cm.has(x + "," + z);
const span = xmax - xmin + 1;
const zspan = zmax - zmin + 1;

// Roof profile across the width: eave 1 rising to 4 at the ridge
const hx = (x) => {
  const d = Math.min(x - xmin, xmax - x);
  return Math.min(4, Math.floor((d * 4) / (span / 2)) + 1);
};
const stairFacing = (x) => (x - xmin < span / 2 ? "west" : "east");
const wallTopOf = (gr, roof) => Math.min(gr + 9, Math.max(gr + 8, roof - 4));

for (const key of cm.keys()) {
  const [x, z] = key.split(",").map(Number);
  const { gr, roof } = cm.get(key);
  const wt = wallTopOf(gr, roof);
  const ring = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation from y 0 up to ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Storey floor slab / string course
  put(x, gr + 4, z, ring ? "smooth_stone" : "smooth_stone");

  if (ring) {
    const onZface = !has(x, z - 1) || !has(x, z + 1);
    const idx = onZface ? x - xmin : z - zmin;
    const spanI = onZface ? span : zspan;
    const isCorner = idx === 0 || idx === spanI - 1;

    // Inward neighbour for lamp placement
    let ix = null, iz = null;
    if (!has(x - 1, z)) { ix = x + 1; iz = z; }
    else if (!has(x + 1, z)) { ix = x - 1; iz = z; }
    else if (!has(x, z - 1)) { ix = x; iz = z + 1; }
    else if (!has(x, z + 1)) { ix = x; iz = z - 1; }

    for (let y = gr + 1; y <= wt - 1; y++) {
      let b;
      if (y === gr + 1) b = "granite";                    // base course
      else if (y === gr + 4) b = "smooth_stone";          // string course
      else if (y === wt - 1) b = "smooth_stone";          // cornice band
      else if (isCorner || idx % 3 === 0) b = "polished_andesite"; // pilasters
      else b = "stone_bricks";

      const inStorey =
        (y >= gr + 2 && y <= gr + 3) || (y >= gr + 5 && y <= wt - 2);
      const isWin =
        !isCorner && idx % 3 === 1 && inStorey && y !== gr + 1 && y !== wt - 1;

      if (isWin) {
        put(x, y, z, "glass");
        if (y === gr + 2 && idx % 6 === 1 && ix !== null && has(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
        if (y === gr + 6 && idx % 6 === 4 && ix !== null && has(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, b);
      }
    }
  }

  // Roof: deepslate tiles, stepped with stairs toward the ridge
  const h = hx(x);
  for (let y = wt; y <= wt + h - 2; y++) put(x, y, z, "deepslate_tiles");
  const top = wt + h - 1;
  const toward = x - xmin < span / 2 ? x + 1 : x - 1;
  if (has(toward, z) && hx(toward) > h) {
    put(x, top, z, "deepslate_tile_stairs", {
      facing: stairFacing(x), half: "bottom", shape: "straight", waterlogged: "false",
    });
  } else {
    put(x, top, z, "deepslate_tiles");
  }
}

// Entrance on the south (zmax) face, nearest the middle, with lintel and lantern
{
  const midx = xmin + span / 2;
  let best = null;
  for (const key of cm.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (z !== zmax) continue;
    if (best === null || Math.abs(x - midx) < Math.abs(best - midx)) best = x;
  }
  if (best !== null) {
    const { gr } = cm.get(best + "," + zmax);
    // door opening
    put(best, gr + 1, zmax, "oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(best, gr + 2, zmax, "oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // dark stone surround and lintel above the door
    for (const dx of [-1, 1]) {
      if (has(best + dx, zmax)) {
        put(best + dx, gr + 1, zmax, "stone_bricks");
        put(best + dx, gr + 2, zmax, "stone_bricks");
        put(best + dx, gr + 3, zmax, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
    put(best, gr + 3, zmax, "stone_brick_slab", { type: "top", waterlogged: "false" });
    // lantern hung inside the lintel
    if (has(best, zmax - 1)) put(best, gr + 2, zmax - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Two chimney stacks on the roof
for (const [dx, dz] of [[9, 6], [18, 28]]) {
  const cx = xmin + dx, cz = zmin + dz;
  if (!has(cx, cz)) continue;
  const { gr, roof } = cm.get(cx + "," + cz);
  const wt = wallTopOf(gr, roof);
  const top = wt + hx(cx) - 1;
  for (let y = top + 1; y <= top + 3; y++) put(cx, y, cz, "stone_bricks");
  put(cx, top + 4, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
