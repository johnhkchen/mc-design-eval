import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-style 1980s mid-rise: two storeys of white tiled piers and blue-tinted
// glazing over a stone base, with a stone cornice and a flat roof terrace.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883598";
const W = 8, H = 23, D = 16;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const cells = list.map(([x, z, g]) => ({ x, z, g }));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const c of cells) groundAt.set(key(c.x, c.z), c.g);
const has = (x, z) => groundAt.has(key(x, z));
const cellG = (x, z) => groundAt.get(key(x, z));

const minG = Math.min(...cells.map((c) => c.g));
const R = minG + 10; // roof deck layer: top of the building is 11 blocks above lowest ground

const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};
const isEdge = (x, z) => facesOf(x, z).length > 0;

const paneProps = (face) =>
  face === "n" || face === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations: solid from y0 up to each cell's ground.
for (const c of cells) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
}

// 2. Walls, floors and roof for every footprint cell.
for (const c of cells) {
  const { x, z, g: gr } = c;
  const faces = facesOf(x, z);
  if (faces.length > 0) {
    const corner = faces.length >= 2;
    const f0 = faces[0];
    const idx = f0 === "n" || f0 === "s" ? x : z;
    for (let y = gr; y <= R; y++) {
      const o = y - gr;
      let blk, props;
      if (y === R || o === 0 || o === 4 || o === 5 || o === 9) {
        blk = "smooth_stone"; // roof cap, base course, lintel and floor belts
      } else if (corner || idx % 2 === 0) {
        blk = "white_concrete"; // piers
      } else {
        blk = "light_blue_stained_glass_pane";
        props = paneProps(f0);
      }
      put(x, y, z, blk, props);
    }
  } else {
    // Interior cell: floor slabs at each storey and the roof deck, air between.
    for (const fy of [gr, gr + 5, R]) {
      if (fy >= gr && fy <= R) put(x, fy, z, fy === R ? "gray_concrete" : "light_gray_concrete");
    }
  }
}

// 3. Entrance on the north (street) face, near the middle of the frontage.
const entryCands = cells.filter(
  (c) => !has(c.x, c.z - 1) && has(c.x - 1, c.z) && has(c.x + 1, c.z)
);
const pool = entryCands.length ? entryCands : cells.filter((c) => !has(c.x, c.z - 1));
let entry = null;
if (pool.length) {
  entry = pool.reduce((best, c) =>
    Math.abs(c.x - 3.5) < Math.abs(best.x - 3.5) ? c : best
  );
}
if (entry) {
  const { x, z, g: gr } = entry;
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  put(x, gr + 1, z, "dark_oak_door", doorProps("lower"));
  put(x, gr + 2, z, "dark_oak_door", doorProps("upper"));
  put(x, gr + 3, z, "light_blue_stained_glass_pane", paneProps("n"));
  // Hanging lantern just inside the door, under the upper floor slab.
  if (isEdge(x, z + 1) === false && has(x, z + 1)) {
    put(x, gr + 4, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Warm light behind some upper windows (glowstone in the interior cell).
for (const c of cells) {
  const { x, z, g: gr } = c;
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const f0 = faces[0];
  const idx = f0 === "n" || f0 === "s" ? x : z;
  if (idx % 2 === 0 || idx % 4 !== 1) continue;
  const [ix, iz] =
    f0 === "n" ? [x, z + 1] :
    f0 === "s" ? [x, z - 1] :
    f0 === "w" ? [x + 1, z] : [x - 1, z];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const yl = gr + 7;
  if (yl > cellG(ix, iz) && yl < R) put(ix, yl, iz, "glowstone");
}

// 5. Roof equipment: a 2x2 stone-capped plant box on the roof terrace.
let plant = null;
for (let x = W - 2; x >= 0 && !plant; x--) {
  for (let z = D - 2; z >= 0 && !plant; z--) {
    const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (sq.every(([a, b]) => has(a, b) && !isEdge(a, b) && cellG(a, b) <= R)) plant = sq;
  }
}
if (plant && R + 2 < H) {
  for (const [a, b] of plant) {
    put(a, R + 1, b, "light_gray_concrete");
    put(a, R + 2, b, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
