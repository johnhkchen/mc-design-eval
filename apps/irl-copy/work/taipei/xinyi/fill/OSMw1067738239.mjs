import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738239";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 33, D = 22;
const g = new Voxels([W, H, D]);

// Bounds-checked setter; props are optional.
const S = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> ground
const gmap = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(x + "," + z, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => gmap.has(x + "," + z);
const isPerim = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

// Storeys: 4 x 5 blocks, floor slabs at gr + 5k, parapet at gr + 21, penthouse to gr + 23.
for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Floor slabs for every level incl. roof deck (interior air gaps between)
  for (let k = 0; k <= 4; k++) S(x, gr + 5 * k, z, "smooth_stone");

  if (!isPerim(x, z)) continue;

  const N = !has(x, z - 1), So = !has(x, z + 1), Wd = !has(x - 1, z), E = !has(x + 1, z);
  const ns = N || So;
  const corner = ns && (Wd || E);
  const idx = ns ? x : z;
  const pillar = corner || idx % 3 === 0;

  // Base course
  S(x, gr, z, "polished_granite");

  for (let k = 0; k <= 3; k++) {
    for (let t = 1; t <= 3; t++) {
      const y = gr + 5 * k + t;
      if (pillar) S(x, y, z, "white_concrete");
      else S(x, y, z, k === 0 ? "glass_pane" : "cyan_stained_glass_pane");
    }
    // Spandrel band between windows of each storey
    S(x, gr + 5 * k + 4, z, "light_gray_concrete");
  }

  // Warm light behind some upper-floor glass (interior cell is air gap)
  if (!corner) {
    let dx = 0, dz = 0;
    if (N) dz = 1; else if (So) dz = -1; else if (Wd) dx = 1; else if (E) dx = -1;
    const ix = x + dx, iz = z + dz;
    for (let k = 0; k <= 3; k++) {
      if (!pillar && (idx + k) % 2 === 0 && has(ix, iz) && !isPerim(ix, iz)) {
        S(ix, gr + 5 * k + 2, iz, k === 0 ? "glowstone" : "shroomlight");
      }
    }
  }

  // Parapet cornice
  S(x, gr + 21, z, "smooth_quartz");
}

// Roof-level penthouse, inset from the perimeter
for (const [x, z, gr] of cells) {
  if (x >= minX + 4 && x <= maxX - 4 && z >= minZ + 4 && z <= maxZ - 4) {
    S(x, gr + 21, z, "light_gray_concrete");
    S(x, gr + 22, z, "light_gray_concrete");
    S(x, gr + 23, z, "smooth_stone");
  }
}

// Entrance on the north (min z) face, centred along its width
const northXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
if (northXs.length) {
  const doorX = northXs[Math.floor(northXs.length / 2)];
  const gr = gmap.get(doorX + "," + minZ);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  S(doorX, gr + 1, minZ, "dark_oak_door", doorProps("lower"));
  S(doorX, gr + 2, minZ, "dark_oak_door", doorProps("upper"));
  S(doorX, gr + 3, minZ, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
