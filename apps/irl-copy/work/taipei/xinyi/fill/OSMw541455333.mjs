import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455333";
const W = 26, H = 47, D = 22;
const TOP = 35;          // roof slab top, ~7 storeys of 5 blocks
const PEN_TOP = 41;      // penthouse roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.max(0, Math.round(gr)));
const inF = (x, z) => G.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// distance from the outer edge (edge = 1), used for the penthouse core
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (isEdge(x, z)) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
while (queue.length) {
  const [x, z] = queue.shift();
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const D_of = (x, z) => dist.get(key(x, z)) ?? 0;

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

// per-cell facade info
const info = new Map();
for (const [x, z] of cells) {
  const nN = !inF(x, z - 1), nS = !inF(x, z + 1), nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const e = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  let idx = 0, pillar = false, entrance = false, inward = null;
  if (e && !corner) {
    idx = (nN || nS) ? x - minX : z - minZ;
    pillar = idx % 3 === 0;
    if (nN) { entrance = Math.abs(x - midX) <= 1; inward = [x, z + 1]; }
    else if (nS) { inward = [x, z - 1]; }
    else if (nW) { inward = [x + 1, z]; }
    else if (nE) { inward = [x - 1, z]; }
  }
  info.set(key(x, z), { e, corner, idx, pillar: corner || pillar, entrance, inward });
}

// ---- main envelope, column by column ----
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  const f = info.get(key(x, z));

  for (let y = 0; y <= TOP; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }

    if (y === TOP) { put(x, y, z, "light_gray_concrete"); continue; }

    const b = Math.floor(y / 5) * 5;
    const rel = y - b;

    if (y % 5 === 0 || y === gr) {
      // storey slab line
      if (f.e && y === gr) put(x, y, z, "polished_granite");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }

    // storey body (rel 1..4)
    if (!f.e) continue; // interior air: no interiors

    if (f.pillar) { put(x, y, z, "white_concrete"); continue; }
    if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    const ground = b === 0;
    if (ground && f.entrance && rel <= 2) continue;          // doorway opening
    if (ground && f.entrance && rel === 3) { put(x, y, z, "glass"); continue; }
    if (ground) { put(x, y, z, "glass"); continue; }          // shopfront

    put(x, y, z, "light_blue_stained_glass");

    // warm light behind some windows on odd storeys
    const storey = b / 5;
    if (f.inward && rel === 2 && f.idx % 6 === 1 && storey % 2 === 1) {
      const [ix, iz] = f.inward;
      if (inF(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // parapet on the outer edge above the roof
  if (f.e) put(x, TOP + 1, z, "white_concrete");

  // entrance lantern hanging under the transom
  if (f.entrance && !f.corner && f.e) {
    // lantern sits at the centre of the door opening, hanging from the spandrel
    if (Math.abs(x - midX) < 0.5) put(x, 3, z, "lantern", { hanging: "true" });
  }
}

// ---- penthouse core (dist >= 5), roof at PEN_TOP ----
for (const [x, z] of cells) {
  const d = D_of(x, z);
  if (d < 5) continue;

  for (let y = TOP + 1; y <= 40; y++) {
    if (d === 5) {
      if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }
  put(x, PEN_TOP, z, "light_gray_concrete");

  // plant screen on the central mass
  if (d >= 9) {
    put(x, PEN_TOP + 1, z, "gray_concrete");
    put(x, PEN_TOP + 2, z, "gray_concrete");
  }
}

// lightning rod / antenna on the centre
const cx = Math.round(midX), cz = Math.round(midZ);
if (inF(cx, cz)) {
  for (let y = 44; y <= 46; y++) put(cx, y, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
