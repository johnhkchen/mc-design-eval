import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173680";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup, lowest ground, and bounding box.
const ground = new Map();
let L = Infinity, minX = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  L = Math.min(L, gr);
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}
if (!isFinite(L)) L = 0;

const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const exposed = (x, z) => {
  return {
    N: !inFp(x, z - 1),
    S: !inFp(x, z + 1),
    W: !inFp(x - 1, z),
    E: !inFp(x + 1, z),
  };
};
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// Roof of a 2-storey (5 block each) commercial block, parapet on top.
// Absolute levels: base course L, floor line L+5, cornice/parapet at L+10.
const top = L + 10;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the north face (exposed N), the cell nearest the median x.
const northCells = cells
  .filter(([x, z]) => exposed(x, z).N)
  .map(([x, z]) => [x, z])
  .sort((a, b) => a[0] - b[0]);
let entrance = null;
if (northCells.length) {
  entrance = northCells[Math.floor(northCells.length / 2)];
} else {
  const p = cells.find(([x, z]) => isPerim(x, z));
  if (p) entrance = [p[0], p[1]];
}
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

function facadeBlock(x, z, y) {
  const e = exposed(x, z);
  const horizontalFace = e.N || e.S;
  const t = horizontalFace ? x - minX : z - minZ;
  const corner = (e.N || e.S) && (e.W || e.E);
  const pier = corner || t % 3 === 0;

  if (y === top) return "smooth_quartz";                 // cornice / parapet cap
  if (y === L + 9 || y === L + 5 || y === L + 4) return "white_concrete"; // spandrels
  if (y === L) return "polished_granite";                // base course
  if (y >= L + 1 && y <= L + 3) return pier ? "polished_granite" : "light_blue_stained_glass"; // shopfront
  if (y >= L + 6 && y <= L + 8) return pier ? "white_concrete" : "gray_stained_glass";        // office glazing
  return "white_concrete";
}

for (const [x, z, gr] of cells) {
  const gnd = gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the storey line (interior, perimeter overwritten below).
  if (L + 5 >= gnd) put(x, L + 5, z, "light_gray_concrete");

  // Roof membrane.
  if (top >= gnd) put(x, top, z, "light_gray_concrete");

  // Facade shell on perimeter cells, from this cell's ground to the roof.
  if (isPerim(x, z)) {
    for (let y = Math.max(gnd, L); y <= top; y++) {
      const id = facadeBlock(x, z, y);
      put(x, y, z, id);
    }
  }
}

// Entrance: double door on the north face, awning slab above it.
if (entrance) {
  const [ex, ez] = entrance;
  const gnd = groundAt(ex, ez);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  if (L + 1 >= gnd) {
    put(ex, L + 1, ez, "dark_oak_door", doorProps("lower"));
    put(ex, L + 2, ez, "dark_oak_door", doorProps("upper"));
  }
  if (L + 3 >= gnd) {
    put(ex, L + 3, ez, "polished_granite_slab", { type: "top", waterlogged: "false" });
  }
  // Entrance flanking piers stay as granite; the lintel stays white concrete.
}

// Warm light behind some upper-storey windows: glowstone one cell inside.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const e = exposed(x, z);
  const horizontalFace = e.N || e.S;
  const t = horizontalFace ? x - minX : z - minZ;
  const corner = (e.N || e.S) && (e.W || e.E);
  const pier = corner || t % 3 === 0;
  if (pier) continue;
  if ((t * 7) % 5 !== 0) continue;

  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else if (e.E) ix = x - 1;

  if (!inFp(ix, iz) || isPerim(ix, iz)) continue;
  const gi = groundAt(ix, iz);
  if (L + 7 >= gi) put(ix, L + 7, iz, "glowstone");
}

// Roof plant: a central mechanical box on the roof, with a mast.
const cx = minX + 10;
const cz = minZ + 7;
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) {
    put(x, top + 1, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
      put(x, top + 2, z, "iron_block");
    }
  }
}
if (inFp(cx, cz)) {
  put(cx, top + 3, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
