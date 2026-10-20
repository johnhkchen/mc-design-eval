import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0182-22F";
const W = 44, D_LEN = 203, H = 119;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D_LEN]);

const K = (x, z) => `${x},${z}`;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint -> ground
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D_LEN) ground.set(K(x, z), gr);
}

// distance inward from the footprint edge (edge cells = 1, outside = 0)
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const edge = N4.some(([dx, dz]) => !ground.has(K(x + dx, z + dz)));
  if (edge) { dist.set(k, 1); queue.push([x, z]); }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(K(x, z));
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz, nk = K(nx, nz);
    if (ground.has(nk) && !dist.has(nk)) { dist.set(nk, d + 1); queue.push([nx, nz]); }
  }
}
const Dist = (x, z) => dist.get(K(x, z)) ?? 0;
const inFp = (x, z) => ground.has(K(x, z));

function setb(x, y, z, b, p) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D_LEN) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Breeze Song Gao: granite-based podium, blue-tinted curtain-wall tower with
// three deeper setbacks and a rooftop plant core. Tiers are relative to each cell's ground.
const TIERS = [
  { y0: 0,  y1: 15,  d: 1,  glass: "white_stained_glass_pane",      frame: "smooth_quartz",  spand: "polished_granite",    floor: "smooth_stone" },
  { y0: 15, y1: 55,  d: 4,  glass: "light_blue_stained_glass_pane", frame: "white_concrete", spand: "light_gray_concrete", floor: "light_gray_concrete" },
  { y0: 55, y1: 85,  d: 7,  glass: "light_blue_stained_glass_pane", frame: "white_concrete", spand: "light_gray_concrete", floor: "light_gray_concrete" },
  { y0: 85, y1: 107, d: 10, glass: "light_blue_stained_glass_pane", frame: "white_concrete", spand: "light_gray_concrete", floor: "light_gray_concrete" },
];

function tierIdx(rel) {
  for (let i = 0; i < TIERS.length; i++) {
    if (rel >= TIERS[i].y0 && rel < TIERS[i].y1) return i;
  }
  return -1;
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = Dist(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setb(x, y, z, "stone");

  for (let rel = 0; rel < 107; rel++) {
    const idx = tierIdx(rel);
    if (idx < 0) continue;
    const T = TIERS[idx];
    const prev = idx > 0 ? TIERS[idx - 1] : null;
    const y = gr + rel;

    // outside this tier's footprint: terrace slab at the tier base, parapet on its edge
    if (d < T.d) {
      if (rel === T.y0) setb(x, y, z, T.floor);
      else if (rel === T.y0 + 1 && prev && d === prev.d) setb(x, y, z, T.spand);
      continue;
    }

    const facade = d === T.d;
    const last = idx === TIERS.length - 1;

    // roof cap of the top tier
    if (last && rel === T.y1 - 1) {
      setb(x, y, z, facade ? T.spand : T.floor);
      continue;
    }

    const r = (rel - T.y0) % 5;

    // storey slab line
    if (r === 0) {
      setb(x, y, z, facade ? T.spand : T.floor);
      continue;
    }
    if (!facade) continue;

    // spandrel above each window band
    if (r === 4) { setb(x, y, z, T.spand); continue; }

    // window band r = 1..3
    const outX = Dist(x - 1, z) < d || Dist(x + 1, z) < d;
    const outZ = Dist(x, z - 1) < d || Dist(x, z + 1) < d;
    let frame;
    if (outX && outZ) frame = true;
    else if (outX) frame = z % 4 === 0;
    else frame = x % 4 === 0;

    if (frame) { setb(x, y, z, T.frame); continue; }

    const conn = (dx, dz) => (inFp(x + dx, z + dz) && Dist(x + dx, z + dz) === d) ? "true" : "false";
    const p = {
      north: conn(0, -1),
      south: conn(0, 1),
      east: conn(1, 0),
      west: conn(-1, 0),
      waterlogged: "false",
    };
    setb(x, y, z, T.glass, p);

    // warm light behind some glass (interior cell, one step inward)
    if (r === 2 && (x * 73 + z * 151 + rel * 37) % 13 === 0) {
      for (const [dx, dz] of N4) {
        if (inFp(x + dx, z + dz) && Dist(x + dx, z + dz) === d + 1) {
          setb(x + dx, y, z + dz, "glowstone");
          break;
        }
      }
    }
  }
}

// Ground-floor entrance on the west podium face: a recessed double-height portal
// with stone pillars either side, a lit header and two lanterns.
{
  let cands = [];
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (Dist(x, z) === 1 && Dist(x - 1, z) === 0) cands.push([x, z]);
  }
  if (cands.length === 0) {
    for (const [k] of ground) {
      const [x, z] = k.split(",").map(Number);
      if (Dist(x, z) === 1) cands.push([x, z]);
    }
  }
  cands.sort((a, b) => a[1] - b[1]);
  const [ex, ez] = cands[Math.floor(cands.length / 2)];
  const gr = ground.get(K(ex, ez));

  // two-cell-wide opening: door cell plus one cell to the south
  const doorCells = [[ex, ez], [ex, ez + 1]].filter(([x, z]) => inFp(x, z));
  for (const [x, z] of doorCells) {
    const bgr = ground.get(K(x, z));
    setb(x, bgr + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    setb(x, bgr + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    setb(x, bgr + 3, z, "glowstone");
    setb(x, bgr + 4, z, "polished_granite");
  }

  // stone pillars either side of the opening, rising to the header
  for (const dz of [-1, 2]) {
    const nz = ez + dz;
    if (!inFp(ex, nz)) continue;
    const ngr = ground.get(K(ex, nz));
    for (let rel = 1; rel <= 4; rel++) setb(ex, ngr + rel, nz, "stone_bricks");
    setb(ex, ngr + 3, nz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant core: solid mass in the middle of the crown with a stone cap
{
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (Dist(x, z) < 13) continue;
    if (Math.abs(x - cx) > 6.5 || Math.abs(z - cz) > 18) continue;
    for (let rel = 107; rel <= 110; rel++) {
      setb(x, gr + rel, z, rel <= 109 ? "light_gray_concrete" : "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
