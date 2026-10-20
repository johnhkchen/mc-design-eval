// Six giant rocks (plan PARTS 2, revised on the owner's comment): R1..R6 as lumpy weathered boulders, not silos.
// Each course is a wobbly ellipse (angular noise that drifts with height): undercut base, bulging middle, an uneven dome.
// Colours come in 3-D noise patches (no bands). R2 leans west onto R1's shoulder over the dark x 48 slot; R5 leans
// north-west; R3 is the tall split rock. Each rock's base runs down to the ground and gets a mound of coarse dirt,
// rooted dirt and stone around it (higher on the uphill side), so it sits in the slope. Writes only into air.
import { ROCKS, onTrail } from "../vocab.mjs";

const AIR = /(^|:)(cave_)?air$/;

// Per rock: h = courses from the box floor, lean = [dx, dz] shift of the crown (grows with height), split = R3's cleft,
// clip = extra cells the rock may reach past its box (the lean onto a neighbour), seed for its noise.
const SPEC = {
  R1: { h: 16, lean: [0, 0], seed: 11 },
  R2: { h: 12, lean: [-4, 0], clip: { x0: -2 }, seed: 23 },
  R3: { h: 18, lean: [0, -1], split: true, seed: 37 },
  R4: { h: 11, lean: [1, 0], seed: 41 },
  R5: { h: 16, lean: [-2, -3], clip: { z0: -1 }, seed: 53 },
  R6: { h: 7, lean: [0, 0], seed: 67 },
};

// Vertical cracks on the north (x = pos) and west (z = pos) faces: [rock, face, pos, from course, to course]
const CRACKS = [
  ["R1", "north", 38, 3, 9], ["R1", "west", 51, 4, 9],
  ["R2", "north", 55, 3, 7],
  ["R3", "north", 65, 3, 9], ["R3", "west", 50, 4, 10],
  ["R4", "north", 44, 3, 7],
  ["R5", "north", 59, 4, 9], ["R5", "west", 65, 3, 8],
  ["R6", "north", 72, 2, 5],
];

function hash(...p) {
  let h = 2166136261;
  for (const c of p.join("|")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// Smooth 3-D value noise in [0, 1): patches about `s` cells across
function noise(seed, x, y, z, s) {
  const fx = x / s, fy = y / s, fz = z / s;
  const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
  const sm = (t) => t * t * (3 - 2 * t);
  const tx = sm(fx - ix), ty = sm(fy - iy), tz = sm(fz - iz);
  const v = (a, b, c) => hash(seed, ix + a, iy + b, iz + c);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(v(0, 0, 0), v(1, 0, 0), tx), l(v(0, 1, 0), v(1, 1, 0), tx), ty),
    l(l(v(0, 0, 1), v(1, 0, 1), tx), l(v(0, 1, 1), v(1, 1, 1), tx), ty), tz);
}

// Radius profile by height fraction t: undercut foot, widest about 0.4, then an uneven dome
const profile = (t) => (t < 0.4 ? 0.74 + 0.26 * Math.sin((t / 0.4) * Math.PI / 2) : Math.sqrt(Math.max(0, 1 - ((t - 0.4) / 0.63) ** 2)));

function shapeOf(name, r) {
  const s = SPEC[name];
  const cx = (r.x0 + r.x1 + 1) / 2, cz = (r.z0 + r.z1 + 1) / 2;
  const rx = (r.x1 - r.x0 + 1) / 2 + 0.6, rz = (r.z1 - r.z0 + 1) / 2 + 0.6;
  const ph = [0, 1, 2, 3].map((i) => hash(s.seed, "ph", i) * Math.PI * 2);
  const c = s.clip ?? {};
  const box = { x0: r.x0 + (c.x0 ?? 0), x1: r.x1, z0: r.z0 + (c.z0 ?? 0), z1: r.z1 };
  const splitAt = (z) => Math.round(68.5 + 0.3 * (z - 52));
  // true if (x, k, z) is rock; k = course above the box floor
  return (x, k, z) => {
    if (x < box.x0 || x > box.x1 || z < box.z0 || z > box.z1 || onTrail(x, z)) return false;
    let H = s.h;
    if (s.split) {
      const sx = splitAt(z);
      if (k >= 4 && x === sx) return false; // the split, 1 wide, from the fourth course up
      if (x > sx) H = s.h - 4; // the east half is the lower one
    }
    if (k < 0 || k >= H) return false;
    const t = k / (H - 1);
    const lx = s.lean[0] * t * t, lz = s.lean[1] * t * t;
    const dx = (x + 0.5 - cx - lx) / rx, dz = (z + 0.5 - cz - lz) / rz;
    const th = Math.atan2(dz, dx);
    const wob = 1 + 0.09 * Math.sin(2 * th + ph[0] + k * 0.25) + 0.07 * Math.sin(3 * th + ph[1] - k * 0.2)
      + 0.05 * Math.sin(5 * th + ph[2]) + 0.04 * Math.sin(7 * th + ph[3] + k * 0.4);
    return Math.hypot(dx, dz) <= (profile(t) * wob) / 1.12;
  };
}

// The block for a rock cell: base courses tuff/granite/terracotta, the body weathered patches, moss in the top hollows
function pick(seed, x, y, z, k, north) {
  const n = (tag, sc) => noise(seed + tag, x, y, z, sc);
  if (k < 2) {
    if (north && n(5, 2.5) > 0.66) return "moss_block";
    const b = n(1, 2.5);
    return b < 0.4 ? "tuff" : b < 0.62 ? "granite" : "terracotta";
  }
  const a = n(2, 3.2), b = n(3, 2.8), c = n(4, 2.2);
  if (c > 0.8) return "orange_terracotta";
  if (b > 0.74) return "terracotta";
  if (b < 0.3) return "light_gray_terracotta";
  if (a < 0.3) return "sandstone";
  if (a > 0.76) return "cut_sandstone";
  return "smooth_sandstone";
}

const put = (g, x, y, z, block, state) => {
  if (!g.inBounds(x, y, z) || !AIR.test(g.blockAt(x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
};
const groundY = (g, x, z, from) => {
  for (let y = from; y >= 0; y--) if (!AIR.test(g.blockAt(x, y, z))) return y;
  return -1;
};

function rock(g, name, r) {
  const s = SPEC[name];
  const solid = shapeOf(name, r);
  const cracks = CRACKS.filter(([n]) => n === name);
  const cz = (r.z0 + r.z1 + 1) / 2, cx = (r.x0 + r.x1 + 1) / 2;
  // a crack cell: on the named face, in the outer 2 cells, between its courses
  const inCrack = (x, k, z) => cracks.some(([, face, pos, k0, k1]) => k >= k0 && k <= k1 && (face === "north"
    ? x === pos && z < cz && !solid(x, k, z - 2)
    : z === pos && x < cx && !solid(x - 2, k, z)));
  const rockAt = (x, k, z) => solid(x, k, z) && !inCrack(x, k, z);
  const plants = [];
  for (let x = r.x0 - 3; x <= r.x1; x++) {
    for (let z = r.z0 - 2; z <= r.z1; z++) {
      let bottom = true;
      for (let k = 0; k < s.h; k++) {
        if (!rockAt(x, k, z)) {
          // a fern or grass at the foot of a crack, on the ledge below the notch
          if (inCrack(x, k, z) && rockAt(x, k - 1, z) && solid(x, k, z)) plants.push([x, r.y0 + k, z]);
          continue;
        }
        const y = r.y0 + k;
        const north = z < cz;
        // the bottom course runs down to the ground, so no column hangs
        if (bottom) {
          const gy = groundY(g, x, z, y - 1);
          for (let yy = gy + 1; yy < y; yy++) put(g, x, yy, z, pick(s.seed, x, yy, z, 0, north));
          bottom = false;
        }
        const top = !rockAt(x, k + 1, z);
        let block = pick(s.seed, x, y, z, k, north);
        // hollows and north-side patches on top: moss block with a carpet
        if (top && k >= s.h * 0.45 && noise(s.seed + 9, x, y, z, 2.5) < (north ? 0.55 : 0.35)) {
          block = "moss_block";
          if (hash(s.seed, x, z, "carpet") < 0.6) put(g, x, y + 1, z, "moss_carpet");
        }
        put(g, x, y, z, block);
      }
    }
  }
  for (const [x, y, z] of plants) put(g, x, y, z, hash(x, y, z) < 0.6 ? "fern" : "short_grass");
}

// The mound: a ring of coarse dirt, rooted dirt and stone on the ground around the rock's foot, 1 high on the downhill
// side and 2 on the uphill (south) side; kept off the trail and out from under the deck (z 45 and below).
function mound(g, name, r) {
  const isRock = (b) => /sandstone|terracotta|tuff|granite|moss_block/.test(b);
  for (let x = r.x0 - 2; x <= r.x1 + 2; x++) {
    for (let z = Math.max(46, r.z0 - 2); z <= r.z1 + 2; z++) {
      if (!g.inBounds(x, 0, z) || onTrail(x, z)) continue;
      const gy = groundY(g, x, z, 74);
      if (gy < 0 || isRock(g.blockAt(x, gy, z))) continue;
      // next to a rock cell within 2 above the ground
      let near = false;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        for (let dy = 1; dy <= 2 && !near; dy++) near = isRock(g.blockAt(x + dx, gy + dy, z + dz));
      }
      if (!near) continue;
      const up = z > (r.z0 + r.z1) / 2 ? 2 : 1;
      for (let dy = 1; dy <= up; dy++) {
        const v = hash(name, x, z, dy);
        const b = dy === up && hash(name, x, z, "top") < 0.25 ? "moss_block" : v < 0.45 ? "coarse_dirt" : v < 0.75 ? "rooted_dirt" : "stone";
        if (!put(g, x, gy + dy, z, b)) break;
      }
    }
  }
}

export function build(g) {
  for (const [name, r] of Object.entries(ROCKS)) rock(g, name, r);
  for (const [name, r] of Object.entries(ROCKS)) mound(g, name, r);
}
