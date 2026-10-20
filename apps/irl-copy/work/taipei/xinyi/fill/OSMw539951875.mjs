import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951875.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951875.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const inFp = (x, z) => G.has(x + "," + z);
const DIRS = { N: { dx: 0, dz: -1 }, S: { dx: 0, dz: 1 }, W: { dx: -1, dz: 0 }, E: { dx: 1, dz: 0 } };
const faces = (x, z) => Object.keys(DIRS).filter(k => !inFp(x + DIRS[k].dx, z + DIRS[k].dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // foundation and plinth: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // floor slab per storey and roof deck
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  const f = faces(x, z);
  const edge = f.length > 0;

  if (!edge) {
    // roof equipment box, sitting on the roof deck
    if (x >= 6 && x <= 9 && z >= 5 && z <= 6) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "gray_concrete");
    }
    continue;
  }

  // facade face: prefer south (front), else first exposed face
  const face = f.includes("S") ? "S" : f[0];
  const d = DIRS[face];
  const u = (face === "N" || face === "S") ? x : z;
  const front = face === "S";
  const inX = x - d.dx, inZ = z - d.dz;
  const inward = inFp(inX, inZ) && faces(inX, inZ).length === 0 && G.get(inX + "," + inZ) === gr;
  const doorCell = front && x === 7;

  // ground storey: shopfront glass, pillars, fascia
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (y === gr + 4) { put(x, y, z, "white_terracotta"); continue; }
    if (doorCell && y === gr + 3) { put(x, y, z, "white_terracotta"); continue; }
    if (doorCell) {
      put(x, y, z, "oak_door", doorProps(y === gr + 1 ? "lower" : "upper"));
      continue;
    }
    if (u % 4 === 0) { put(x, y, z, "white_terracotta"); continue; }
    put(x, y, z, "glass");
  }
  if (inward && u % 8 === 2) put(inX, gr + 1, inZ, "glowstone");

  // upper storey: window band with frames, lit windows, parapet
  put(x, gr + 6, z, "white_terracotta");
  for (const y of [gr + 7, gr + 8]) {
    if (u % 3 !== 0) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_terracotta");
  }
  put(x, gr + 9, z, "white_terracotta");
  if (inward && u % 6 === 1) put(inX, gr + 6, inZ, "shroomlight");

  // parapet capping the cornice
  put(x, gr + 11, z, "white_terracotta");
}

g.save(OUT);
