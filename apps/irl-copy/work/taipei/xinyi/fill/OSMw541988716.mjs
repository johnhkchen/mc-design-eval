import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988716";
const W = 21, H = 23, D = 11;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));
const cells = [...ground].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const xs = cells.map(c => c.x), zs = cells.map(c => c.z);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const G = Math.min(...cells.map(c => c.gr)); // lowest ground = base of the building

const has = (x, z) => ground.has(`${x},${z}`);
const exposed = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1),
  w: !has(x - 1, z), e: !has(x + 1, z),
});
const groundAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, b);
};

// Storey plan (absolute, from lowest ground G):
//  G        ground-floor slab / base course
//  G+1..G+4 ground storey (shopfront, 4 blocks clear)
//  G+5      first-floor slab + stone storey line
//  G+6..G+9 upper storey (window grid)
//  G+10     roof slab / cornice
//  G+11     parapet
const ROOF_TOP = G + 11;
const doorX = Math.round((minX + maxX) / 2);

for (const { x, z, gr } of cells) {
  const e = exposed(x, z);
  const perim = e.n || e.s || e.w || e.e;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!perim) {
    // Interior: floor slabs, roof deck, and rooftop plant
    if (G >= gr) put(x, G, z, "light_gray_concrete");
    if (G + 5 >= gr) put(x, G + 5, z, "light_gray_concrete");
    if (G + 10 >= gr) put(x, G + 10, z, "light_gray_concrete");
    if (x >= minX + 4 && x <= minX + 8 && z >= minZ + 3 && z <= minZ + 6 && G + 10 >= gr) {
      put(x, G + 11, z, "iron_block");
    }
    continue;
  }

  // Perimeter wall
  const isCorner = (e.n || e.s) && (e.e || e.w);
  const along = (e.n || e.s) ? x - minX : z - minZ;
  const mull = along % 2 === 0;
  const pillar = mull || isCorner;
  const isDoor = e.s && x === doorX && z === maxZ;

  for (let y = gr; y <= ROOF_TOP; y++) {
    let b = null;
    if (y === gr) {
      b = "stone_bricks";                                  // base course
    } else if (y <= G + 4) {
      if (y === G + 4) b = isDoor ? "lantern" : "light_gray_concrete"; // lintel / door lamp
      else if (isDoor) b = null;                            // entrance opening
      else b = pillar ? "light_gray_concrete" : "glass";    // shopfront glazing
    } else if (y === G + 5) {
      b = "smooth_stone";                                   // storey line
    } else if (y <= G + 9) {
      b = pillar ? "white_concrete" : "cyan_stained_glass"; // upper windows
    } else if (y === G + 10) {
      b = "smooth_stone";                                   // cornice
    } else {
      b = "stone_brick_wall";                               // parapet
    }
    if (b) put(x, y, z, b);
  }

  // Warm light behind some upper-storey windows
  if (!pillar && along % 4 === 1) {
    let ix = x, iz = z;
    if (e.n) iz = z + 1; else if (e.s) iz = z - 1;
    else if (e.w) ix = x + 1; else if (e.e) ix = x - 1;
    if (has(ix, iz)) {
      const ie = exposed(ix, iz);
      const ig = groundAt(ix, iz);
      if (!(ie.n || ie.s || ie.w || ie.e) && G + 7 >= ig) {
        put(ix, G + 7, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
