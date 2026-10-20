import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style commercial block, c. 1990s: a two-storey podium with a
// stone-brick base course, a shopfront ground floor, a glazed upper storey,
// a smooth-stone cornice band and a white parapet, with roof plant on top.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752109";
const W = 17, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const base = Math.min(...G.values());
const top = base + 11; // parapet top, about 11 blocks above lowest ground

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const perimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const paneProps = (x, z) => ({
  north: has(x, z - 1) ? "true" : "false",
  south: has(x, z + 1) ? "true" : "false",
  east: has(x + 1, z) ? "true" : "false",
  west: has(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

// Door location: on the lowest-z edge, nearest the middle of the footprint.
let minZ = Infinity, minX = Infinity, maxX = -Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  minZ = Math.min(minZ, z);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const midX = (minX + maxX) / 2;
let doorX = null;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z !== minZ || !perimeter(x, z)) continue;
  if (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX)) doorX = x;
}

// 1. Foundations, floors and interior structure
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  // ground-floor slab, then first-floor and roof slabs where they sit above ground
  put(x, gr, z, "smooth_stone");
  if (!perimeter(x, z)) {
    if (base + 5 >= gr) put(x, base + 5, z, "smooth_stone");
    if (base + 10 >= gr) put(x, base + 10, z, "smooth_stone");
  }
}

// 2. Perimeter walls, shopfronts, windows, belts, cornice and parapet
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!perimeter(x, z)) continue;
  const isCorner = corner(x, z);
  const bay = (x + z) % 3; // bay 0 = pillar, else glazed

  for (let y = gr; y <= base + 9; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y === base + 5) {
      put(x, y, z, "smooth_stone"); // storey belt
    } else if (isCorner || bay === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps(x, z));
    }
  }

  // Cornice band and parapet
  if (base + 10 >= gr) put(x, base + 10, z, "smooth_stone");
  put(x, base + 11, z, "white_concrete");
}

// 3. Warm lights behind some upper-storey windows
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!perimeter(x, z)) continue;
  if ((x + z) % 3 === 0 || corner(x, z)) continue;
  if ((x + z) % 6 !== 1) continue;
  const dx = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const dz = !has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || perimeter(ix, iz)) continue;
  const y = base + 7;
  if (y <= gnd(ix, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// 4. Roof plant on the roof deck (interior cells only)
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (perimeter(x, z) || base + 10 < gr) continue;
  if (x % 5 === 2 && z % 4 === 2) {
    put(x, base + 11, z, "light_gray_concrete");
    put(x, base + 12, z, "light_gray_concrete");
  }
}

// 5. Entrance, last so it overrides the wall
if (doorX !== null) {
  const dg = gnd(doorX, minZ);
  const dy = dg + 1;
  put(doorX, dy + 2, minZ, "stone_bricks"); // lintel
  put(doorX, dy, minZ, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, dy + 1, minZ, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
