import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 明園大廈 (Ming Yuan Building), Xinyi, Taipei.
// Read as a c.1975-85 reinforced-concrete mid-rise: a two-storey commercial podium
// with dark shopfronts and red fascia, then a nine-storey residential slab tower
// set back once at the 7th storey, cream tile-clad walls with quartz pillars on the
// piers and corners, light-blue glazing with warm lit flats, a lantern-lit entrance,
// and a parapet with a roof water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw350932850";
const W = 51, H = 71, D = 49;

const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const BAND = "light_gray_concrete";
const INNER = "stone";
const GLASS = "light_blue_stained_glass";
const LIT = "yellow_stained_glass";
const FOUND = "stone_bricks";
const SURROUND = "stone_bricks";
const FASCIA = "red_terracotta";
const RAIL = "iron_bars";
const TANK = "white_concrete";
const CAP = "stone_brick_slab";
const DOOR = "dark_oak_door";

const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N, S, W, E

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- footprint and ground -------------------------------------------------
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.min(H - 1, Math.max(0, Math.round(gr))));
}
const F = new Set(G.keys());

// distance (4-neighbour) from the edge of a mask; edge cells = 1
function distMap(mask) {
  const d = new Map();
  const q = [];
  for (const k of mask) {
    const [x, z] = parse(k);
    if (NB.some(([dx, dz]) => !mask.has(key(x + dx, z + dz)))) {
      d.set(k, 1);
      q.push(k);
    }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i];
    const [x, z] = parse(k);
    for (const [dx, dz] of NB) {
      const nk = key(x + dx, z + dz);
      if (mask.has(nk) && !d.has(nk)) {
        d.set(nk, d.get(k) + 1);
        q.push(nk);
      }
    }
  }
  return d;
}

const dF = distMap(F);
const A = new Set([...F].filter((k) => dF.get(k) >= 4));   // tower base
const B = new Set([...F].filter((k) => dF.get(k) >= 9));   // setback crown
const dA = distMap(A);
const dB = distMap(B);

// outward normal of a ring cell (first outside neighbour: N/S preferred)
function outward(x, z, mask) {
  for (const [dx, dz] of NB) if (!mask.has(key(x + dx, z + dz))) return [dx, dz];
  return null;
}
// number of outside neighbours: 2+ means a corner
function outCount(x, z, mask) {
  return NB.filter(([dx, dz]) => !mask.has(key(x + dx, z + dz))).length;
}

// bays: 2 glazed, 2 piers; N/S faces run along x, E/W along z
function winBay(x, z, o) {
  return o[1] !== 0 ? (x % 4 === 1 || x % 4 === 2) : (z % 4 === 1 || z % 4 === 2);
}

// ---- foundation -----------------------------------------------------------
for (const [k, gr] of G) {
  const [x, z] = parse(k);
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
}

// entrance: a south-facing ring cell of the podium near the middle
const southRing = [...F]
  .map(parse)
  .filter(([x, z]) => dF.get(key(x, z)) === 1 && !F.has(key(x, z + 1)));
const meanX = southRing.reduce((s, [x]) => s + x, 0) / Math.max(1, southRing.length);
southRing.sort((a, b) =>
  Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX) ||
  G.get(key(a[0], a[1])) - G.get(key(b[0], b[1])));
const doorKey = southRing.length ? key(southRing[0][0], southRing[0][1]) : null;
const doorXZ = southRing.length ? southRing[0] : null;

// ---- tiers ----------------------------------------------------------------
const tiers = [
  { name: "podium", mask: F, d: dF, b: 0, t: 10, podium: true },
  { name: "tower", mask: A, d: dA, b: 10, t: 35, podium: false },
  { name: "crown", mask: B, d: dB, b: 35, t: 55, podium: false },
];

for (const T of tiers) {
  const { mask, d, b, t, podium } = T;
  for (let y = b; y < t; y++) {
    const r = (y - b) % 5; // 0 floor slab, 1 sill/wall, 2-3 glazing, 4 lintel
    for (const k of mask) {
      const [x, z] = parse(k);
      if (G.get(k) > y) continue;
      const dk = d.get(k);
      if (r === 0) {
        put(x, y, z, dk === 1 ? BAND : INNER);
        continue;
      }
      if (dk !== 1) continue; // interior air behind the glass
      const o = outward(x, z, mask);
      if (!o) continue;
      const corner = outCount(x, z, mask) >= 2;

      if (podium) {
        if (r === 4) { put(x, y, z, FASCIA); continue; }
        const bay = winBay(x, z, o);
        // entrance: door at r=1,2, lantern over it at r=3, stone surround beside it
        if (k === doorKey) {
          if (r <= 2) {
            put(x, y, z, DOOR, {
              facing: "south",
              half: r === 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
            });
          } else {
            put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          }
          continue;
        }
        if (doorXZ && Math.abs(x - doorXZ[0]) <= 2 && z === doorXZ[1] && o[1] !== 0) {
          put(x, y, z, SURROUND);
          continue;
        }
        if (corner || !bay) put(x, y, z, corner ? PIER : WALL);
        else put(x, y, z, GLASS);
        continue;
      }

      if (r === 2 || r === 3) {
        if (winBay(x, z, o) && !corner) {
          const lit = (x * 31 + z * 17 + y * 7) % 9 === 0;
          if (lit) {
            put(x, y, z, LIT);
            const ix = x - o[0], iz = z - o[1];
            if (mask.has(key(ix, iz)) && d.get(key(ix, iz)) >= 2) put(ix, y, iz, "glowstone");
          } else {
            put(x, y, z, GLASS);
          }
        } else {
          put(x, y, z, corner || !winBay(x, z, o) ? PIER : WALL);
        }
      } else {
        put(x, y, z, corner ? PIER : WALL); // r = 1 or 4
      }
    }
  }
  // closing slab on top of each tier (roof of the tier, floor of the next)
  for (const k of mask) {
    const [x, z] = parse(k);
    if (G.get(k) <= t) put(x, t, z, d.get(k) === 1 ? BAND : INNER);
  }
}

// ---- terrace railings -----------------------------------------------------
// podium terrace at y=10 (ring of the podium that is not under the tower)
for (const k of F) {
  if (dF.get(k) !== 1 || A.has(k)) continue;
  const [x, z] = parse(k);
  if (G.get(k) > 10) continue;
  put(x, 11, z, RAIL);
  put(x, 12, z, RAIL);
}
// tower terrace at y=35
for (const k of A) {
  if (dA.get(k) !== 1 || B.has(k)) continue;
  const [x, z] = parse(k);
  if (G.get(k) > 35) continue;
  put(x, 36, z, RAIL);
  put(x, 37, z, RAIL);
}

// ---- crown parapet and roof water tank ------------------------------------
for (const k of B) {
  if (dB.get(k) !== 1) continue;
  const [x, z] = parse(k);
  put(x, 56, z, WALL);
  put(x, 57, z, WALL);
  put(x, 58, z, BAND);
}

// roof water tank: a 3x3 block on the crown roof, nearest the centroid
{
  const pts = [...B].map(parse);
  const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const cz = pts.reduce((s, [, z]) => s + z, 0) / pts.length;
  let best = null, bestD = Infinity;
  for (const [x, z] of pts) {
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dz = -1; dz <= 1 && ok; dz++)
        if (!B.has(key(x + dx, z + dz)) || dB.get(key(x + dx, z + dz)) < 2) ok = false;
    if (!ok) continue;
    const dd = (x - cx) ** 2 + (z - cz) ** 2;
    if (dd < bestD) { bestD = dd; best = [x, z]; }
  }
  if (best) {
    const [tx, tz] = best;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        put(tx + dx, 56, tz + dz, TANK);
        put(tx + dx, 57, tz + dz, TANK);
        put(tx + dx, 58, tz + dz, CAP);
      }
  }
}

g.save(`${DIR}/${ID}.nbt`);
