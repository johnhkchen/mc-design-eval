import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499686";
const W = 18, H = 33, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

const cmap = new Map();
for (const [x, z, gr, rf] of cells) cmap.set(key(x, z), { x, z, gr: Math.round(gr), rf: Math.round(rf) });
const inside = (x, z) => cmap.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// distance (in cells) from outside the footprint; edge ring = 1
const dist = new Map();
const q = [];
for (const c of cmap.values()) {
  const edge = DIRS.some(([dx, dz]) => !inside(c.x + dx, c.z + dz));
  if (edge) { dist.set(key(c.x, c.z), 1); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (cmap.has(k) && !dist.has(k)) { dist.set(k, d + 1); q.push(cmap.get(k)); }
  }
}

const minG = Math.min(...[...cmap.values()].map(c => c.gr));

// smoothed roof height (lidar noise -> clean tiers)
function smoothRoof(c) {
  let s = c.rf, n = 1;
  for (const [dx, dz] of DIRS) {
    const o = cmap.get(key(c.x + dx, c.z + dz));
    if (o) { s += o.rf; n++; }
  }
  return Math.round(s / n);
}

function outwardOf(c) {
  for (const [dx, dz] of DIRS) if (!inside(c.x + dx, c.z + dz)) return [dx, dz];
  return [0, 0];
}

const ring = [...cmap.values()].filter(c => (dist.get(key(c.x, c.z)) || 1) === 1);

// entrance: middle of the south-facing (+z) facade, else fallbacks
function pickDoor() {
  const sets = [
    ring.filter(c => { const [a, b] = outwardOf(c); return a === 0 && b === 1; }),
    ring.filter(c => { const [a, b] = outwardOf(c); return a === 0 && b === -1; }),
    ring,
  ];
  for (const s of sets) {
    if (s.length) {
      const sorted = [...s].sort((p, r) => p.x - r.x || p.z - r.z);
      const m = sorted[Math.floor(sorted.length / 2)];
      return { x: m.x, z: m.z, k: key(m.x, m.z) };
    }
  }
  return null;
}
const door = pickDoor();
const doorKey = door ? door.k : null;

// flanking piers: front ring cells next to the door (same facade line)
const doorNeighbour = new Set();
if (door) {
  const [odx, odz] = outwardOf(cmap.get(door.k));
  for (const [dx, dz] of DIRS) {
    // slide along the facade, perpendicular to outward direction
    if (dx * odx + dz * odz !== 0) continue;
    doorNeighbour.add(key(door.x + dx, door.z + dz));
  }
}

// roof: mansard inset grows with height, capped so the top stays a wide plateau
const insetAt = (k) => Math.min(4, Math.floor((k - 1) * 0.5) + 1);

for (const c of cmap.values()) {
  const { x, z } = c;
  const d = dist.get(key(x, z)) || 1;
  const gr = c.gr;
  const wt = Math.max(minG + 10, gr + 6);      // top of walls (cornice level)
  const F = wt - 5;                             // first/second floor line
  const rt = Math.min(32, Math.max(wt + 4, smoothRoof(c)));

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  // ceiling / cornice course across the footprint
  put(x, wt, z, "stone_bricks");

  if (d >= 2) {
    // floor slab at the storey line; air gap behind the glass stays open
    if (F > gr && F < wt) put(x, F, z, "oak_planks");
  } else {
    // facade shell
    const [odx, odz] = outwardOf(c);
    const facing = FACING[`${odx},${odz}`];
    const isDoor = key(x, z) === doorKey;
    const isFront = odx === 0 && odz === 1;
    const win = ((x + z) % 3) === 1;
    const pier = ((x + z) % 3) === 0;
    const flank = doorNeighbour.has(key(x, z));
    const ix = x - odx, iz = z - odz;
    const inwardOk = inside(ix, iz) && (dist.get(key(ix, iz)) || 1) >= 2;

    for (let y = gr; y < wt; y++) {
      let b = "calcite", p = null;
      let glassHere = false;

      if (y === gr) {
        b = "polished_granite";
      } else if (y < F) {
        // ground floor: shopfront with entrance
        if (y === F - 1) {
          b = isFront ? "red_terracotta" : "dark_oak_planks";
        } else if (isDoor && y === gr + 1) {
          b = "oak_door";
          p = { facing, half: "lower", hinge: "left", open: "false", powered: "false" };
        } else if (isDoor && y === gr + 2) {
          b = "oak_door";
          p = { facing, half: "upper", hinge: "left", open: "false", powered: "false" };
        } else if (isDoor) {
          b = "dark_oak_planks";
        } else if (flank || (x + z) % 4 === 0) {
          b = "stone_bricks";
        } else {
          b = "glass"; glassHere = true;
        }
      } else if (y === F) {
        b = "stone_bricks";                      // string course
      } else if (y === wt - 1) {
        b = win ? "dark_oak_planks" : (pier ? "stone_bricks" : "calcite");
      } else {
        if (win) { b = "glass"; glassHere = true; }
        else if (pier) b = "stone_bricks";       // pilaster between bays
      }
      put(x, y, z, b, p);

      // warm light behind some glass, sitting on the floor inside
      if (inwardOk && glassHere) {
        if (y === F + 1 && y < wt - 1 && ((x * 5 + z * 3) % 7 === 0)) {
          put(ix, F + 1, iz, "shroomlight");
        }
        if (y === gr + 1 && y < F - 1 && ((x + z) % 4 === 2)) {
          put(ix, gr, iz, "glowstone");
        }
      }
    }
  }

  // mansard roof tiers standing on the cornice / lower tier
  for (let y = wt + 1; y <= rt; y++) {
    const k = y - wt;
    if (d >= insetAt(k)) put(x, y, z, "deepslate_tiles");
  }
}

g.save(`${DIR}/${ID}.nbt`);
