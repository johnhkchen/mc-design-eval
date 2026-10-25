import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499746";
const W = 27, H = 24, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(key(x, z), { x, z, g: Math.round(gr), roof });
const inside = (x, z) => cell.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const xs = [...cell.values()].map(c => c.x);
const zs = [...cell.values()].map(c => c.z);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Massing: two storeys (~5 blocks each) above the highest base, mansard to lidar height.
const gVals = [...cell.values()].map(c => c.g);
const roofVals = [...cell.values()].map(c => c.roof).sort((a, b) => a - b);
const medRoof = Math.round(roofVals[Math.floor(roofVals.length / 2)]);
const maxG = Math.max(...gVals);
const E = Math.max(maxG + 10, medRoof - 2);      // top of walls / eaves
const T = Math.max(E + 3, medRoof);              // roof top (mansard, 3 courses)
const F2 = E - 5;                                // upper floor line (absolute)

// BFS distance from the outer edge (edge cells = 0)
const outerDir = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dist = new Map();
const q = [];
for (const c of cell.values()) {
  if (outerDir.some(([dx, dz]) => !inside(c.x + dx, c.z + dz))) {
    dist.set(key(c.x, c.z), 0);
    q.push(c);
  }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of outerDir) {
    const k = key(c.x + dx, c.z + dz);
    const n = cell.get(k);
    if (n && !dist.has(k)) { dist.set(k, d + 1); q.push(n); }
  }
}
const D_ = (c) => dist.get(key(c.x, c.z));

// Entrance: middle of the longest south-facing run of edge cells
const southEdge = [...cell.values()]
  .filter(c => c.z === maxZ && D_(c) === 0 && !inside(c.x, c.z + 1))
  .sort((a, b) => a.x - b.x);
const doorCell = southEdge.length >= 3 ? southEdge[Math.floor(southEdge.length / 2)] : null;
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

// Pass 1: foundations, walls, interior floors
for (const c of cell.values()) {
  const { x, z } = c;
  const gr = c.g;
  const d = D_(c);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d === 0) {
    for (let y = gr; y < E; y++) put(x, y, z, y === gr ? "stone_bricks" : "stone");
    put(x, F2, z, "stone_bricks");            // string course at upper floor line
  } else if (F2 > gr && F2 < E) {
    put(x, F2, z, "smooth_stone");            // interior upper floor slab
  }
}

// Pass 2: corner quoins, pilasters, windows, glow, door
const DIRNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

for (const c of cell.values()) {
  const { x, z } = c;
  const gr = c.g;
  if (D_(c) !== 0) continue;
  if (key(x, z) === doorKey) continue;

  const faces = outerDir.filter(([dx, dz]) => !inside(x + dx, z + dz));
  if (faces.length === 0) continue;

  if (faces.length >= 2) {
    // corner quoin: solid stone bricks column
    for (let y = gr; y < E; y++) put(x, y, z, "stone_bricks");
    continue;
  }

  const [dx, dz] = faces[0];
  const idx = dx !== 0 ? z - minZ : x - minX;
  const L = dx !== 0 ? (maxZ - minZ + 1) : (maxX - minX + 1);
  // 2-wide window bays, 2-wide piers
  const isWin = idx >= 2 && idx <= L - 3 && (idx % 4 === 1 || idx % 4 === 2);
  const isPier = idx % 4 === 0 || idx % 4 === 3 || !isWin;

  if (!isWin) {
    // piers get a stone-brick edge course at the sill to articulate the bays
    put(x, F2 + 4, z, "stone_bricks");
    continue;
  }

  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  // ground floor window with stone sill below and lintel above
  for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane", paneProps);
  put(x, gr + 4, z, "stone_bricks");

  // upper floor window
  for (let y = F2 + 1; y <= F2 + 3; y++) put(x, y, z, "glass_pane", paneProps);
  put(x, F2 + 4, z, "stone_bricks");

  // warm light behind some panes (interior cell inward of the window)
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && D_({ x: ix, z: iz }) >= 1) {
    if (idx % 8 === 1) put(ix, gr + 2, iz, "glowstone");
    if (idx % 8 === 5) put(ix, F2 + 2, iz, "glowstone");
  }
}

// Entrance: framed doorway with a lintel canopy on the south face
if (doorCell) {
  const { x, z } = doorCell;
  const gr = doorCell.g;
  // stone surround: piers either side, lintel above
  for (const ox of [-2, -1, 1, 2]) {
    if (inside(x + ox, z)) {
      put(x + ox, gr + 1, z, "stone_bricks");
      put(x + ox, gr + 2, z, "stone_bricks");
      put(x + ox, gr + 3, z, "stone_bricks");
    }
  }
  for (const ox of [-1, 0, 1]) put(x + ox, gr + 4, z, "stone_bricks");
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // small flat canopy over the lintel, inside the footprint
  for (const ox of [-1, 0, 1]) {
    put(x + ox, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  // lamp in the doorway recess, inside
  if (inside(x, z - 1)) put(x, gr + 3, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: mansard roof, sloped outer course in stairs, then solid tiers
for (let y = E; y <= T; y++) {
  const k = y - E;
  for (const c of cell.values()) {
    const d = D_(c);
    if (d < k) continue;
    if (y === E && d === 0) {
      put(c.x, y, c.z, "stone_bricks");                 // cornice
      continue;
    }
    // outer course of this tier: slope with stairs facing outward
    const isEdge = d === k && y < T;
    if (isEdge) {
      const out = outerDir.find(([dx, dz]) => {
        const n = cell.get(key(c.x + dx, c.z + dz));
        return !n || (dist.get(key(n.x, n.z)) ?? -1) < k;
      });
      if (out) {
        put(c.x, y, c.z, "deepslate_tile_stairs", {
          facing: DIRNAME[`${out[0]},${out[1]}`],
          half: "bottom",
          shape: "straight",
          waterlogged: "false",
        });
        continue;
      }
    }
    put(c.x, y, c.z, "deepslate_tiles");
  }
}

// Chimney rising from the roof, on a cell with roof beneath it
let chim = null;
let bestScore = Infinity;
const cxT = minX + Math.round((maxX - minX) * 0.3);
const czT = minZ + Math.round((maxZ - minZ) * 0.5);
for (const c of cell.values()) {
  if ((D_(c) ?? -1) < T - E) continue;
  const s = Math.abs(c.x - cxT) + Math.abs(c.z - czT);
  if (s < bestScore) { bestScore = s; chim = c; }
}
if (chim) {
  put(chim.x, T + 1, chim.z, "stone_bricks");
  put(chim.x, T + 2, chim.z, "stone_bricks");
  put(chim.x, T + 3, chim.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
