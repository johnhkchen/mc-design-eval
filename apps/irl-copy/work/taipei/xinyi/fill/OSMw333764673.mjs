import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333764673";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 43, H = 165, D = 41;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const A = new Set(ground.keys());
const gnd = (x, z) => ground.get(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// distance from the outer ring of the footprint (1 = edge)
const dist = new Map();
const queue = [];
for (const k of A) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !A.has(key(x + dx, z + dz)))) {
    dist.set(k, 1);
    queue.push(k);
  }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);
  for (const [dx, dz] of NB) {
    const n = key(x + dx, z + dz);
    if (A.has(n) && !dist.has(n)) {
      dist.set(n, d + 1);
      queue.push(n);
    }
  }
}

// setback tiers: full body, upper body (inset 5), penthouse (inset 10)
const B = new Set([...A].filter((k) => (dist.get(k) ?? 0) >= 6));
let P = new Set([...A].filter((k) => (dist.get(k) ?? 0) >= 11));
if (P.size === 0) P = new Set(B);

const edgeOf = (S, x, z) => NB.some(([dx, dz]) => !S.has(key(x + dx, z + dz)));
const cornerOf = (S, x, z) => {
  const ex = !S.has(key(x + 1, z)) || !S.has(key(x - 1, z));
  const ez = !S.has(key(x, z + 1)) || !S.has(key(x, z - 1));
  return ex && ez;
};

// entrance on the south face (max z) of the central column
const doorX = 21;
let doorZ = -1;
for (const k of A) {
  const [x, z] = k.split(",").map(Number);
  if (x === doorX && z > doorZ && edgeOf(A, x, z)) doorZ = z;
}

const GRANITE = "polished_granite";
const GLASS = "light_blue_stained_glass";

// rhythm of one storey on an outer wall: floor line, glass bays, piers, sill
function rhythm(S, x, y, z) {
  const r = y % 5;
  if (cornerOf(S, x, z)) return put(x, y, z, "quartz_pillar", { axis: "y" });
  if (r === 0) return put(x, y, z, "light_gray_concrete");
  if (r === 4) return put(x, y, z, "white_concrete");
  if ((x + z) % 3 === 0) return put(x, y, z, "quartz_block");
  put(x, y, z, GLASS);
}

function facadeCell(S, x, z, y, gr, lobby) {
  if (lobby && y < gr + 4) {
    const isDoor = x === doorX && z === doorZ;
    if (isDoor && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      return put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
    }
    if (y === gr) return put(x, y, z, GRANITE);
    if (isDoor && (y === gr + 2 || y === gr + 3)) return put(x, y, z, "light_gray_concrete");
    if (cornerOf(S, x, z) || (x + z) % 3 === 0) return put(x, y, z, "quartz_block");
    return put(x, y, z, GLASS);
  }
  rhythm(S, x, y, z);
}

// lamps behind some windows, placed in the air gap inside the shell
function lamp(S, x, z, y, gr) {
  if (y % 5 !== 2 || y <= gr + 4) return;
  if ((x * 7 + z * 13 + y * 3) % 17 !== 0) return;
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (S.has(key(nx, nz)) && !edgeOf(S, nx, nz)) {
      put(nx, y, nz, "shroomlight");
      return;
    }
  }
}

// --- build each footprint column ---
for (const k of A) {
  const [x, z] = k.split(",").map(Number);
  const gr = gnd(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // tier A: full footprint, gr .. 138, roof slab at 139
  const edgeA = edgeOf(A, x, z);
  for (let y = gr; y < 139; y++) {
    if (!edgeA) {
      if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    } else {
      facadeCell(A, x, z, y, gr, true);
      lamp(A, x, z, y, gr);
    }
  }
  // entrance canopy over the doorway, on the outer row
  if (edgeA && Math.abs(x - doorX) <= 2 && z >= doorZ - 1) {
    put(x, gr + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  put(x, 139, z, "light_gray_concrete");

  // tier B: 140 .. 152, roof at 153, parapet on the outer rim
  if (B.has(k)) {
    const edgeB = edgeOf(B, x, z);
    for (let y = 140; y < 153; y++) {
      if (!edgeB) {
        if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
      } else {
        facadeCell(B, x, z, y, 140, false);
        lamp(B, x, z, y, 140);
      }
    }
    put(x, 153, z, "light_gray_concrete");
    if (edgeB && !P.has(k)) put(x, 154, z, "white_concrete");
  }

  // penthouse: 154 .. 158, roof at 159
  if (P.has(k)) {
    const edgeP = edgeOf(P, x, z);
    for (let y = 154; y < 159; y++) {
      if (!edgeP) {
        if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
      } else {
        if (y % 5 === 4) put(x, y, z, "light_gray_concrete");
        else if ((x + z + y) % 4 === 0) put(x, y, z, "iron_bars");
        else put(x, y, z, "white_concrete");
      }
    }
    put(x, 159, z, "white_concrete");
  }
}

// antenna mast on the penthouse, nearest its centre
let cx = 0, cz = 0;
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  cx += x; cz += z;
}
cx /= P.size; cz /= P.size;
let best = null, bestD = Infinity;
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  const d2 = (x - cx) ** 2 + (z - cz) ** 2;
  if (d2 < bestD) { bestD = d2; best = [x, z]; }
}
if (best) {
  const [mx, mz] = best;
  for (let y = 160; y < 164; y++) put(mx, y, mz, "iron_bars");
  put(mx, 164, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
