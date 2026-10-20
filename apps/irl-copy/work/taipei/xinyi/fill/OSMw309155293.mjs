import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 新光信義金融大樓 (Shin Kong Xinyi Financial Building), c. late 1990s–2000s Taipei office tower.
// Lidar roof ~139 blocks (~99 m) above lowest ground: ~27 storeys of 5 blocks, a stepped crown
// and a plant enclosure. Materials: blue-green glass curtain wall, pale spandrels, dark grey
// mullions, polished granite base, quartz parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309155293";
const W = 67, H = 151, D = 54;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint -> ground
const gr = new Map();
for (const [x, z, h] of cells) gr.set(`${x},${z}`, Math.floor(h));
const has = (x, z) => gr.has(`${x},${z}`);

// cell survives an inward erosion of radius d (square neighbourhood)
const inset = (x, z, d) => {
  for (let dx = -d; dx <= d; dx++)
    for (let dz = -d; dz <= d; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

const key = (x, z) => `${x},${z}`;
const TIERS = [0, 4, 8, 14];
const tierOf = (y, gz) => {
  if (y < 100) return 0;
  if (y < 120) return 4;
  if (y < 135) return 8;
  return 14;
};

// Facade geometry per tier: outer edge cells, and the recessed-glass targets one step inboard.
// A bay on an edge with exactly one open side is recessed one block: the outer cell is left
// open and the glass sits on the inboard cell, giving the curtain wall real depth.
const edgeSet = {}, recessEdge = {}, recessTarget = {};
for (const d of TIERS) {
  const E = new Set(), RE = new Set(), RT = new Set();
  for (const [x, z] of cells) {
    if (!inset(x, z, d)) continue;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const missing = dirs.filter(([dx, dz]) => !inset(x + dx, z + dz, d));
    if (missing.length === 0) continue;
    E.add(key(x, z));
    if (missing.length === 1) {
      const [ox, oz] = missing[0];
      const ix = x - ox, iz = z - oz;
      if (inset(ix, iz, d)) {
        RE.add(key(x, z));
        RT.add(key(ix, iz));
      }
    }
  }
  edgeSet[d] = E;
  recessEdge[d] = RE;
  recessTarget[d] = RT;
}

// overrides for entrance (applied at write time)
const ov = new Map();
const k = (x, y, z) => `${x},${y},${z}`;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  const o = ov.get(k(x, y, z));
  const bid = o ? o[0] : id;
  const pr = o ? o[1] : props;
  if (pr) g.set(x, y, z, bid, pr);
  else g.set(x, y, z, bid);
};

// ---- entrance on the lowest south-facing (min z) edge, centred on its span ----
{
  let minZ = Infinity;
  for (const [x, z] of cells) if (!has(x, z - 1)) minZ = Math.min(minZ, z);
  const xs = cells.filter(([x, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  for (const [x, z, gz0] of cells) {
    if (z !== minZ) continue;
    const gz = Math.floor(gz0);
    const dx = x - mid;
    if (Math.abs(dx) > 3) continue;
    if (Math.abs(dx) <= 1) {
      // glass entrance doors
      ov.set(k(x, gz + 1, z), ["glass", null]);
      ov.set(k(x, gz + 2, z), ["glass", null]);
    } else if (Math.abs(dx) === 2) {
      // door jambs
      for (let y = gz + 1; y <= gz + 3; y++) ov.set(k(x, y, z), ["light_gray_concrete", null]);
    }
    // canopy band over the doors, then a lit lantern pair at the jambs
    if (Math.abs(dx) <= 2) ov.set(k(x, gz + 3, z), ["smooth_quartz", null]);
    if (dx === 0) ov.set(k(x, gz + 4, z), ["glowstone", null]);
  }
}

// ---- build each footprint column ----
for (const [x, z, gz0] of cells) {
  const gz = Math.floor(gz0);

  // foundation under the cell up to its ground
  for (let y = 0; y < gz; y++) put(x, y, z, "stone");

  for (let y = gz; y <= 138; y++) {
    let d;
    if (y < 100) d = 0;
    else if (y < 120) d = 4;
    else if (y < 135) d = 8;
    else d = 14;

    if (!inset(x, z, d)) continue;

    const kk = key(x, z);
    const edge = edgeSet[d].has(kk);

    // roof cap at 134 and plant room 135–138
    if (y === 134) {
      put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y >= 135) {
      if (y === 138) {
        put(x, y, z, "light_gray_concrete");
      } else if (edge) {
        put(x, y, z, (x + z + y) % 2 === 0 ? "iron_bars" : "gray_concrete");
      }
      continue;
    }

    const storeyLine = y % 5 === 0;
    const podiumBase = y < gz + 2;

    if (!edge) {
      if (storeyLine) {
        put(x, y, z, "light_gray_concrete");
      } else if (recessTarget[d].has(kk)) {
        // recessed glazing one block inboard of the facade, with occasional warm lights
        const h = (x * 7 + y * 13 + z * 31) % 13;
        put(x, y, z, h === 0 ? "glowstone" : "light_blue_stained_glass");
      }
      continue;
    }

    // facade
    if (podiumBase) {
      put(x, y, z, "polished_granite");
    } else if (storeyLine) {
      put(x, y, z, y < gz + 15 ? "smooth_quartz" : "light_gray_concrete");
    } else if ((x + z) % 3 === 0) {
      // dark mullions framing each bay
      put(x, y, z, "gray_concrete");
    } else if (recessEdge[d].has(kk)) {
      // open outer bay: the glass sits one block deeper
      continue;
    } else {
      const h = (x * 7 + y * 13 + z * 31) % 13;
      put(x, y, z, h === 0 ? "glowstone" : "light_blue_stained_glass");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
