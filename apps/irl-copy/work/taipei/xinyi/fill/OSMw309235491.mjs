import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信基大樓: a late-1990s Taipei office tower. Ground-floor shopfront podium (y < 30),
// a recessed glass-and-spandrel tower with setbacks at y 30 and y 100, a roof at y 140,
// a rooftop penthouse, and a mast. Outer frame of mullions and spandrels, glass set one block back.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235491";
const W = 56, H = 152, D = 47;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gMap = new Map();
for (const c of cells) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  gMap.set(`${x},${z}`, Math.max(0, Math.min(H - 8, Math.round(gr))));
}
const cellList = [...gMap.keys()].map((k) => k.split(",").map(Number));
const inFoot = (x, z) => gMap.has(`${x},${z}`);
const gAt = (x, z) => gMap.get(`${x},${z}`);
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Inset distance from the footprint edge (edge cells = 1, next ring = 2, ...).
const dMap = new Map();
const queue = [];
for (const [x, z] of cellList) {
  if (DIRS4.some(([dx, dz]) => !inFoot(x + dx, z + dz))) {
    dMap.set(`${x},${z}`, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const dv = dMap.get(`${x},${z}`);
  for (const [dx, dz] of DIRS4) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (inFoot(nx, nz) && !dMap.has(k)) {
      dMap.set(k, dv + 1);
      queue.push([nx, nz]);
    }
  }
}
const dAt = (x, z) => dMap.get(`${x},${z}`) ?? 0;

// Tier minimum inset: podium 1, tower 3, upper tower 6, penthouse 10.
const MIN = { P: 1, B: 3, C: 6, H: 10 };

function kindAt(d, y, gr) {
  if (d < 1 || y < gr) return null;
  if (y < 30) return "P";
  if (y < 100) return d >= 3 ? "B" : null;
  if (y < 140) return d >= 6 ? "C" : null;
  if (y >= 141 && y < 146 && d >= 10) return "H";
  return null;
}

// Storey row within a tier: podium counts from its own ground, the rest from absolute y.
const rowOf = (K, y, gr) => ((K === "P" ? y - gr : y) % 5 + 5) % 5;

function axisOf(x, z, m) {
  const oW = dAt(x - 1, z) < m, oE = dAt(x + 1, z) < m;
  const oN = dAt(x, z - 1) < m, oS = dAt(x, z + 1) < m;
  let axis = null;
  if ((oW || oE) && !(oN || oS)) axis = "z";
  else if ((oN || oS) && !(oW || oE)) axis = "x";
  return { axis, oW, oE, oN, oS };
}

// Podium entrance on the south face (outward +z): centre column of that face.
let cx = null, zFace = null;
{
  const xs = [];
  for (const [x, z] of cellList) {
    if (dAt(x, z) !== 1) continue;
    const f = axisOf(x, z, 1);
    if (f.axis === "x" && f.oS) {
      xs.push(x);
      zFace = zFace === null ? z : Math.max(zFace, z);
    }
  }
  if (xs.length) cx = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
}

// Recessed glass: one block behind the outer frame (d = m+1), on a wall face,
// storey rows 1..3, not in the podium entrance opening.
function glassInfo(x, y, z, K, d, gr) {
  const m = MIN[K];
  if (d !== m + 1) return null;
  const r = rowOf(K, y, gr);
  if (r < 1 || r > 3) return null;
  const f = axisOf(x, z, m + 1);
  if (!f.axis) return null;
  if (K === "P" && cx !== null && f.oS && Math.abs(x - cx) <= 1 && (y - gr === 1 || y - gr === 2)) return null;
  return f;
}

// Warm lights: some recessed glass panes get a glowstone three blocks back, with an air gap.
const hashOn = (x, y, z) =>
  (Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(y, 83492791)) >>> 0;
const lights = new Set();
for (const [x, z] of cellList) {
  const gr = gAt(x, z), d = dAt(x, z);
  for (let y = gr; y < 146; y++) {
    const K = kindAt(d, y, gr);
    if (!K) continue;
    const gi = glassInfo(x, y, z, K, d, gr);
    if (!gi) continue;
    if (hashOn(x, y, z) % 9 !== 0) continue;
    const m = MIN[K];
    const ix = gi.axis === "z" ? (gi.oW ? 2 : -2) : 0;
    const iz = gi.axis === "x" ? (gi.oN ? 2 : -2) : 0;
    const px = x + ix, pz = z + iz;
    const dp = dAt(px, pz);
    if (dp >= m + 3 && kindAt(dp, y, gAt(px, pz) ?? 0) === K) lights.add(`${px},${y},${pz}`);
  }
}

function paneProps(axis) {
  return axis === "z"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

function bodyBlock(x, y, z, K, d, gr) {
  const m = MIN[K];
  const r = rowOf(K, y, gr);
  const rel = K === "P" ? y - gr : y;

  if (d === m) {
    // Outer frame layer
    const f = axisOf(x, z, m);
    if (!f.axis) return { id: "light_gray_concrete" };          // corner column
    if (K === "P" && rel === 0) return { id: "stone_bricks" };   // base course
    if (r === 0) return { id: "white_concrete" };                // storey band
    if (r === 4) return { id: "light_gray_concrete" };           // spandrel

    // Podium entrance: three-wide recessed opening on the south face
    if (K === "P" && cx !== null && f.axis === "x" && f.oS && Math.abs(x - cx) <= 1) {
      if (rel === 3) return { id: "white_concrete" };             // lintel
      if (x === cx) {
        return {
          id: "dark_oak_door",
          props: {
            facing: "south",
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          },
        };
      }
      return { id: "stone_bricks" };                              // jambs
    }

    const key = f.axis === "z" ? z : x;
    if (key % 3 === 0) return { id: "gray_concrete" };           // mullion frame
    return null;                                                  // recessed window opening
  }

  // Recessed glass layer and interior
  const gi = glassInfo(x, y, z, K, d, gr);
  if (gi) {
    return {
      id: K === "P" ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane",
      props: paneProps(gi.axis),
    };
  }
  if (r === 0 || y === gr) return { id: "smooth_stone" };        // floor slab
  if (lights.has(`${x},${y},${z}`)) return { id: "glowstone" };
  return null;
}

const g = new Voxels([W, H, D]);

for (const [x, z] of cellList) {
  const gr = gAt(x, z), d = dAt(x, z);

  // Foundation under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= 146; y++) {
    const K = kindAt(d, y, gr);
    if (K) {
      const b = bodyBlock(x, y, z, K, d, gr);
      if (b) g.set(x, y, z, b.id, b.props);
      continue;
    }
    // Terrace and roof caps where a tier ends
    if (kindAt(d, y - 1, gr)) {
      const capId =
        y === 30 || y === 100 ? "stone_bricks" :
        y === 140 ? "light_gray_concrete" : "smooth_stone";
      g.set(x, y, z, capId);
      continue;
    }
    // Roof parapet on the upper tower's edge
    if (d === 6 && (y === 141 || y === 142) && gr < 141) {
      g.set(x, y, z, "white_concrete");
    }
  }
}

// Entrance lantern just inside the recessed opening
if (cx !== null && zFace !== null) {
  const lz = zFace - 2;
  if (dAt(cx, lz) >= 3) {
    g.set(cx, gAt(cx, lz) + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Mast on the penthouse, nearest the footprint centre
{
  let sx = 0, sz = 0;
  for (const [x, z] of cellList) { sx += x; sz += z; }
  sx /= cellList.length; sz /= cellList.length;
  let best = null, bestD = Infinity;
  for (const [x, z] of cellList) {
    if (dAt(x, z) < MIN.H || gAt(x, z) > 140) continue;
    const dist = Math.abs(x - sx) + Math.abs(z - sz);
    if (dist < bestD) { bestD = dist; best = [x, z]; }
  }
  if (best) {
    const [mx, mz] = best;
    for (let y = 147; y <= 150; y++) g.set(mx, y, mz, "iron_bars");
    g.set(mx, 151, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
