import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87152";
const W = 24, H = 31, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map. Roof heights are quantised to 3-block storeys so tiers stay flat.
const cell = new Map();
for (const [x, z, gr, rf] of cells) {
  const base = Math.max(0, Math.round(gr));
  let top = Math.round(rf);
  const storeys = Math.max(1, Math.round((top - base) / 3));
  top = base + 3 * storeys;
  top = Math.min(top, H - 6);
  cell.set(`${x},${z}`, { x, z, g: base, r: top });
}
const has = (x, z) => cell.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const faces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: nearest footprint cell to x=12 on the z=0 (north) face.
let doorX = null;
for (const xx of [12, 11, 13, 10, 14, 9, 15, 8, 16]) {
  if (has(xx, 0)) { doorX = xx; break; }
}

// Roof plant: grouped penthouse blocks on interior cells, not single stray blocks.
const penthouse = (x, z) =>
  (x >= 6 && x <= 8 && z >= 4 && z <= 6) || (x >= 15 && x <= 16 && z >= 9 && z <= 10);

const LIT = "glowstone"; // one warm colour only, sparse

for (const c of cell.values()) {
  const { x, z, g: gr, r } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const perimeter = fs.length > 0;
  const corner = fs.length > 1;
  const pierAlong = fs.some(([dx, dz]) => (dx !== 0 ? z % 3 === 0 : x % 3 === 0));
  const pier = corner || pierAlong;
  const isDoor = doorX !== null && z === 0 && x === doorX;
  const doorFrame = doorX !== null && z === 0 && Math.abs(x - doorX) === 1;

  for (let y = gr; y < r; y++) {
    const o = y - gr;

    if (!perimeter) {
      // Interior: floor slabs per storey, air gap otherwise, flat roof cap.
      if (y === r - 1) put(x, y, z, "smooth_stone");
      else if (o % 3 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance: door set in a stone surround with a granite lintel.
    if (isDoor && o <= 1) {
      const half = o === 0 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorFrame && o <= 1) { put(x, y, z, "stone_bricks"); continue; }
    if (isDoor && o === 2) { put(x, y, z, "polished_granite"); continue; }
    if (doorFrame && o === 2) { put(x, y, z, "polished_granite"); continue; }

    // Parapet / cornice course on the roof edge.
    if (y === r - 1) { put(x, y, z, "smooth_stone"); continue; }

    // Base course at street level.
    if (o === 0) { put(x, y, z, "stone_bricks"); continue; }

    const m = o % 3;
    if (m === 0) { put(x, y, z, "smooth_stone"); continue; }      // storey floor line
    if (m === 2) { put(x, y, z, "calcite"); continue; }           // head band
    // m === 1: window row
    if (pier) { put(x, y, z, "calcite"); continue; }
    put(x, y, z, "glass_pane");

    // Sparse warm light behind some glass, with an air gap and a lit cell behind.
    const lit = ((x * 5 + z * 3 + o * 2) % 11) === 0;
    if (lit && fs.length) {
      const [dx, dz] = fs[0];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && faces(ix, iz).length === 0) {
        put(ix, y, iz, LIT);
      }
    }
  }

  // Roof plant as grouped two-high stone penthouses on interior cells.
  if (!perimeter && penthouse(x, z)) {
    put(x, r, z, "stone_bricks");
    put(x, r + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
