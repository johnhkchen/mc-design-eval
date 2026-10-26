import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC87533.cells.json`, "utf8"));

// Early-1900s brick commercial block: stone plinth, red brick walls, a stone
// cornice and parapet on one flat roof tier, storefront at street level (z = 0).
const W = 15, H = 18, D = 4;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(`${x},${z}`, { gr, rf });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEnvelope = (x, z) =>
  z === 0 || z === D - 1 || !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth lidar noise into one flat roof tier: median roof, never below the
// highest ground plus a usable height.
const roofs = cells.map(([, , , rf]) => rf).sort((a, b) => a - b);
const maxGround = Math.max(...cells.map(([, , gr]) => gr));
const R = Math.max(roofs[Math.floor(roofs.length / 2)], maxGround + 5);

const winCol = (x) => x >= 1 && x <= W - 2 && x % 3 !== 0;
const paneProps = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Storey base rows: ground storey, then every 3 rows while room remains below
// the cornice (rows R-2 and R-1 are cornice and parapet).
const storeyBases = (gr) => {
  const bases = [gr];
  for (let f = gr + 3; f <= R - 5; f += 3) bases.push(f);
  return bases;
};

// Pass 1: foundations, shell, interior air gap and floor slabs.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const env = isEnvelope(x, z);
  const bases = storeyBases(gr);

  for (let y = gr; y < R; y++) put(x, y, z, env ? "bricks" : "air");

  if (!env) {
    put(x, gr, z, "smooth_stone");
    for (const f of bases.slice(1)) put(x, f, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
  } else {
    // Stone cornice band and parapet cap on the envelope.
    put(x, R - 2, z, "stone_bricks");
    put(x, R - 1, z, "bricks");
    put(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: facade articulation on front (z = 0) and back (z = D - 1).
for (const [x, z, gr] of cells) {
  if (!(z === 0 || z === D - 1)) continue;
  const bases = storeyBases(gr);

  // Stone plinth course and a projecting-looking dentil row under the cornice.
  put(x, gr, z, "stone_bricks");
  if ((x + z) % 2 === 0 && R - 3 > gr) put(x, R - 3, z, "stone_brick_stairs", { facing: z === 0 ? "north" : "south", half: "bottom", shape: "straight", waterlogged: "false" });

  bases.forEach((b, k) => {
    if (k === 0 && z === 0) return; // storefront handled below
    if (!winCol(x)) return;
    put(x, b, z, "stone"); // sill
    if (b + 2 <= R - 3) {
      put(x, b + 1, z, "glass_pane", paneProps);
      put(x, b + 2, z, "glass_pane", paneProps);
    }
    if (k === bases.length - 1 && b + 3 <= R - 3) put(x, b + 3, z, "stone"); // head course
  });
}

// Pass 3: storefront on the street front (z = 0), ground storey.
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  if (x < 1 || x > W - 2) continue;

  put(x, gr + 3, z, "stone"); // fascia band

  for (const row of [gr + 1, gr + 2]) {
    if (x % 4 === 0) put(x, row, z, "bricks");          // pier
    else if (x === 7) { /* door below */ }
    else if (x === 2) put(x, row, z, "oak_planks");     // boarded for vacancy
    else put(x, row, z, "glass_pane", paneProps);
  }
}

// Entrance: centre bay door with a small stone canopy over it.
if (has(7, 0)) {
  const gr = cellMap.get("7,0").gr;
  put(7, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(7, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(7, gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Pass 4: warm light behind a few upper-storey windows.
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  const bases = storeyBases(gr);
  if (bases.length < 2) continue;
  const b = bases[1];
  if ((x === 5 || x === 11) && has(x, 1) && b + 2 <= R - 3) put(x, b + 1, 1, "glowstone");
}

g.save(`${dir}/DC87533.nbt`);
