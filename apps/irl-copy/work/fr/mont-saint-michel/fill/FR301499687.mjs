import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499687";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([10, 29, 9]);

// ---- footprint lookup -------------------------------------------------------
const K = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, roof] of cells) cm.set(K(x, z), { x, z, gr: Math.round(gr), roof });
const has = (x, z) => cm.has(K(x, z));
const maxZ = Math.max(...cells.map(c => c[1]));

// smoothed roof tier (median of lidar roof heights, flat across the building)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const T = Math.round(roofs[Math.floor(roofs.length / 2)]);

// distance from the outer wall (0 on the wall)
const dist = new Map();
for (const c of cm.values()) {
  const outer = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  dist.set(K(c.x, c.z), outer ? 0 : Infinity);
}
let changed = true;
while (changed) {
  changed = false;
  for (const c of cm.values()) {
    const k = K(c.x, c.z);
    let best = dist.get(k);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = dist.get(K(c.x + dx, c.z + dz));
      if (n !== undefined && n + 1 < best) best = n + 1;
    }
    if (best !== dist.get(k)) { dist.set(k, best); changed = true; }
  }
}

// ---- facade logic -----------------------------------------------------------
// windows: alternate bays on each face; corners stay solid
const isWin = (x, z) => {
  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  if (!nN || !nS) { if (nW && nE) return x % 2 === 1; return false; }
  if (!nW || !nE) { if (nN && nS) return z % 2 === 0; return false; }
  return false;
};
// some windows carry warm light
const lit = (x, z, s) => ((x * 5 + z * 3 + s * 7) % 4) === 0;
const glowAt = (x, z, s) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && isWin(nx, nz) && lit(nx, nz, s)) return true;
  }
  return false;
};

// front door on the south face, centred on an even bay so it is never a window
const frontXs = cells.filter(c => c[1] === maxZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = has(4, maxZ) ? 4 : frontXs[0];

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// rubble-coursed granite: scatter cobble through the ashlar for texture
const wallId = (x, y, z) => ((x * 7 + y * 3 + z * 5) % 9 === 0) ? "cobblestone" : "stone_bricks";

// ---- massing per cell -------------------------------------------------------
for (const c of cm.values()) {
  const { x, z, gr } = c;
  const d = dist.get(K(x, z));
  const edge = d === 0;

  // plinth: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // three storeys of ~5 blocks; wall top at T-3 (or higher on the downhill side)
  const Wt = Math.max(T - 3, gr + 10);

  if (edge) {
    const win = isWin(x, z);
    const isDoorCell = z === maxZ && x === doorX;
    const frameCell = z === maxZ && (x === doorX - 1 || x === doorX + 1);
    for (let y = gr; y <= Wt; y++) {
      const rr = y - gr;
      const r = rr % 5;
      let id = wallId(x, y, z);
      let props;
      if (y === Wt) id = "smooth_stone";                       // cornice
      else if (r === 0) id = win ? "calcite" : "smooth_stone"; // sill / string course
      else if (r === 4 && win) id = "calcite";                 // lintel
      else if (r >= 1 && r <= 3 && win) id = "glass";          // full glazed bay
      if (frameCell && rr <= 2) id = "calcite";                // door surround
      if (isDoorCell) {
        if (rr <= 1) {
          id = "oak_door";
          props = { facing: "south", half: rr === 0 ? "lower" : "upper", hinge: "left", open: "false" };
        } else if (rr === 2) {
          id = "calcite";                                      // lintel over door
        } else if (rr === 3) {
          id = "smooth_stone_slab";                            // hood
          props = { type: "top", waterlogged: "false" };
        }
      }
      put(x, y, z, id, props);
    }
  } else {
    // interior: floor slabs per storey, an air gap otherwise, warm light behind some windows
    for (let y = gr; y <= Wt; y++) {
      const rr = y - gr;
      const r = rr % 5;
      if (r === 0) put(x, y, z, "spruce_planks");
      else if (r === 2 && glowAt(x, z, Math.floor(rr / 5))) put(x, y, z, "glowstone");
      else if (x === doorX && z === maxZ - 1 && rr === 1) put(x, y, z, "lantern");
    }
  }

  // hipped slate roof, stepping in one block per course from the wall top
  const Rmax = Math.max(2, T - Wt);
  const top = Wt + Math.min(d, Rmax);
  if (!edge) {
    for (let y = Wt + 1; y <= top; y++) put(x, y, z, "deepslate_tiles");
  }

  // a single brick chimney stack on the ridge cell
  if (x === 3 && z === 3 && !edge) {
    for (let y = top + 1; y <= top + 3; y++) put(x, y, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
