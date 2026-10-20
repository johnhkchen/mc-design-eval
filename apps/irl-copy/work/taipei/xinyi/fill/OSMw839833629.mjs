// Record: no name. Footprint 17x21, roof about 11 blocks above lowest ground.
// Read as a 2-storey reinforced-concrete commercial block of the 1970s-80s Xinyi
// fringe: white-painted concrete frame, grey spandrels, dark base course, shopfront
// glazing on the ground storey, pane windows above, a dark lintel band on the street
// (south) face, a flat parapet roof with a central water tank.
// Storey 1: g+1..g+4, slab g+5, storey 2: g+6..g+9, roof slab g+10, parapet g+11.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833629";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inside = (x, z) => gmap.has(`${x},${z}`);
const G = (x, z) => gmap.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const missing = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  w: !inside(x - 1, z),
  e: !inside(x + 1, z),
});

const isWindowIdx = (i) => i % 3 === 1;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Pass 1: foundation, floor slabs, roof slab across the whole footprint.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");
}

// Pass 2: facade on perimeter cells.
// Front (street) face = the z-max side.
const frontCands = cells
  .filter(([x, z]) => {
    const m = missing(x, z);
    return m.s && !m.w && !m.e;
  })
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontCands.length ? frontCands[Math.floor(frontCands.length / 2)] : null;

for (const [x, z, gr] of cells) {
  const m = missing(x, z);
  if (!(m.n || m.s || m.w || m.e)) continue;

  const onZFace = (m.n || m.s) && !(m.w || m.e);
  const onXFace = (m.w || m.e) && !(m.n || m.s);
  const pillar = !onZFace && !onXFace; // corner or single cell

  // Pane connection properties for the wall's run direction.
  const paneProps = onZFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const idx = onZFace ? x : z;
  const isWindow = !pillar && isWindowIdx(idx);
  const isFront = m.s && onZFace;

  // Base course.
  put(x, gr + 1, z, "polished_andesite");

  // Ground storey: shopfront glazing, lintel band.
  for (const y of [gr + 2, gr + 3]) {
    if (pillar || !isWindow) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  if (isFront) put(x, gr + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  else put(x, gr + 4, z, "white_concrete");

  // Upper storey: spandrels above and below, windows between.
  put(x, gr + 6, z, "light_gray_concrete");
  for (const y of [gr + 7, gr + 8]) {
    if (pillar || !isWindow) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  put(x, gr + 9, z, "light_gray_concrete");

  // Parapet.
  put(x, gr + 11, z, "white_concrete");

  // Warm light behind some upper windows.
  if (isWindow && hash(x, gr, z) % 3 === 0) {
    let ix = x, iz = z;
    if (m.s) iz = z - 1;
    else if (m.n) iz = z + 1;
    else if (m.e) ix = x - 1;
    else if (m.w) ix = x + 1;
    if (inside(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
}

// Pass 3: entrance door on the street face, centre of the front run.
for (const [x, z, gr] of cells) {
  if (x !== doorX) continue;
  const m = missing(x, z);
  if (!m.s || m.w || m.e) continue;
  put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Transom above the door.
  put(x, gr + 3, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  put(x, gr + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 4: roof equipment, a central water tank on a 3x3 plinth if it fits.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let fits = true;
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++)
    if (!inside(cx + dx, cz + dz)) fits = false;
if (fits) {
  const gr = G(cx, cz);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(cx + dx, gr + 11, cz + dz, "light_gray_concrete");
      put(cx + dx, gr + 12, cz + dz, "light_gray_concrete");
    }
  put(cx, gr + 13, cz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
