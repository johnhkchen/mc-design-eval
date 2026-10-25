import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499510";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 18, DP = 16;
const g = new Voxels([W, H, DP]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= DP) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- read cells -------------------------------------------------------------
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { ground: Math.round(gr), roof: Math.round(rf) });
}
const has = (x, z) => map.has(`${x},${z}`);

// Building floor line: highest ground under the footprint (clamped so it fits).
let G = 0;
for (const c of map.values()) G = Math.max(G, c.ground);
G = Math.min(G, 12);

// Smoothed roof height: median of lidar roof values (absolute from y 0).
const roofs = [...map.values()].map((c) => c.roof).sort((a, b) => a - b);
const topRaw = roofs.length ? roofs[Math.floor(roofs.length / 2)] : G + 6;

// Storeys of 3 blocks (rows: slab, window, window). Roof deck sits on top of them.
let n = Math.round((topRaw - G - 1) / 3);
n = Math.max(1, Math.min(5, n));
while (G + 3 * n + 1 > H - 1 && n > 1) n--;
const R = G + 3 * n; // roof deck row

// Materials
const FOUND = "granite";
const WALL = "smooth_quartz";
const SLAB = "stone_bricks";
const DECK = "deepslate_tiles";
const PARAPET = "stone_bricks";
const GLASS = "glass_pane";

// ---- build ------------------------------------------------------------------
for (const [key, cell] of map) {
  const [x, z] = key.split(",").map(Number);
  const ground = cell.ground;

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exposed = [exN, exS, exW, exE].filter(Boolean).length;
  const ring = exposed > 0;

  // Foundation: solid from y 0 up to the floor line (at least the cell's ground).
  for (let y = 0; y < Math.max(ground, G); y++) put(x, y, z, FOUND);

  // Ground-floor slab (base course on ring, floor everywhere).
  put(x, G, z, SLAB);

  for (let k = 0; k < n; k++) {
    const F = G + 3 * k;
    if (k > 0) put(x, F, z, SLAB); // storey slab / band course

    for (const y of [F + 1, F + 2]) {
      if (!ring) continue; // interior: air gap behind the facade

      // Corners and multi-face cells stay solid; single faces get window grids.
      let windowable = false;
      if (exposed === 1) {
        if (exN || exS) windowable = x % 2 === 1;
        else windowable = z % 2 === 1;
      }

      // Main entrance on the north face, centre bay, ground floor.
      if (exN && x === 5 && k === 0) {
        if (y === F + 1) {
          put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }

      if (windowable) put(x, y, z, GLASS);
      else put(x, y, z, WALL);
    }

    if (ring) {
      // Rows of the storey body between slabs are already handled above.
    }
  }

  // Roof deck on every cell; parapet course on the ring only.
  put(x, R, z, DECK);
  if (ring && R + 1 <= H - 1) put(x, R + 1, z, PARAPET);
}

// ---- warm lights behind selected ground/upper windows -----------------------
for (const [key] of map) {
  const [x, z] = key.split(",").map(Number);
  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exposed = [exN, exS, exW, exE].filter(Boolean).length;
  if (exposed !== 1) continue;
  if (!((exN || exS) ? x % 2 === 1 : z % 2 === 1)) continue;

  // Inward neighbour (interior air cell behind the glass).
  let ix = x, iz = z;
  if (exN) iz = z + 1;
  else if (exS) iz = z - 1;
  else if (exW) ix = x + 1;
  else if (exE) ix = x - 1;
  if (!has(ix, iz) || ((has(ix, iz)) && (!has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz)))) continue;

  for (let k = 0; k < n; k++) {
    if ((x + z + k) % 3 !== 0) continue;
    const y = G + 3 * k + 1;
    if (y < R) put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
