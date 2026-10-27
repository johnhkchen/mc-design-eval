// Wilson Parking, Auckland (Eden Terrace side of the CBD): a multi-storey public car park of the 1970s and 80s, the
// concrete deck building that the city's parking firms put up on the edge of the centre. Read from the lidar: the roof
// runs 18 to 31 blocks above y 0 (about 32 above its lowest ground), so at 4-block storeys it is a seven-storey deck,
// a tower of decks on a lower podium, the lift and stair core on the tallest tier. Its face is open: concrete piers and
// spandrels, and the decks behind them are voids (dark glass, the car park's open slots), with glowstone lamps in some.
// The street face has a shopfront on the ground storey (glass between piers, a fascia above), two pedestrian doors and a
// vehicle entry; the rest is the car park's open face. Smoothing: the roof is a 5x5 median, so noise becomes flat tiers
// and the tiers sit on one floor grid (floors at y = 2 + 4k). Every cell is filled solid from y 0 up to its lowest floor
// (a stone plinth with a smooth course), so nothing floats on the slope; the downhill cells gain storeys below the rest.
// Only the exposed skin is built: a cell gets a pier or an opening where a side faces the sky, the outside or a lower
// neighbour, and the interior is air between slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_131471489.cells.json", "utf8"));
const W = 91, D = 39, H = 44, GRID = 2, STOREY = 4, BAY = 4;

const k = (x, z) => x * 1000 + z;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k(x, z), g); roof.set(k(x, z), r); }
const inside = (x, z) => ground.has(k(x, z));

// each cell's lowest floor (the first grid floor at or above its ground) and its top (the roof slab, a grid floor at or
// below the smoothed lidar roof, and at least one storey above the lowest floor)
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const FMIN = new Map(), TOP = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof.get(k(x + dx, z + dz)));
  const fmin = GRID + STOREY * Math.ceil((g - GRID) / STOREY);
  const top = Math.max(GRID + STOREY * Math.floor((med(v) - GRID) / STOREY), fmin + STOREY);
  FMIN.set(k(x, z), fmin); TOP.set(k(x, z), top);
}
const fmin = (x, z) => FMIN.get(k(x, z)), top = (x, z) => TOP.get(k(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAMES = Object.keys(DIRS);

// is the side of cell (x, z) facing (dx, dz) open to air at the storey whose floor is F? Open to the outside, or to a
// neighbour whose roof stops below this storey; a side against a neighbour's solid fill or its own storey is closed.
const open = (x, z, dx, dz, F) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  if (fmin(nx, nz) > F) return false;
  return top(nx, nz) < F + STOREY;
};
const sidesAt = (x, z, F) => NAMES.filter((n) => open(x, z, ...DIRS[n], F));
// a parapet on a roof edge: the outside, or a neighbour whose roof is lower (a setback's edge)
const edgeAtTop = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));

// the street: the outward face with the most exposed cells on its ground storey
const faceCount = Object.fromEntries(NAMES.map((n) => [n, 0]));
for (const [x, z] of cells) for (const n of sidesAt(x, z, fmin(x, z))) faceCount[n]++;
const street = NAMES.reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const [SX, SZ] = DIRS[street];
const along = (x, z) => (SX !== 0 ? z : x);       // position along the street face (x on a north or south face)

// the ground storey of the street face: single-side cells in order along it; two pedestrian doors at a fifth and four
// fifths, a vehicle entry (three cells wide) at the middle
const streetCells = cells
  .filter(([x, z]) => { const s = sidesAt(x, z, fmin(x, z)); return s.length === 1 && s[0] === street; })
  .map(([x, z]) => [x, z]).sort((a, b) => along(...a) - along(...b));
const n = streetCells.length;
const doors = new Set(n >= 10 ? [streetCells[Math.floor(n / 5)], streetCells[Math.floor((4 * n) / 5)]].map(([x, z]) => k(x, z)) : []);
const mid = n >= 10 ? Math.floor(n / 2) : -1;
const vehicle = new Set(mid >= 0 ? [streetCells[mid - 1], streetCells[mid], streetCells[mid + 1]].map(([x, z]) => k(x, z)) : []);

// a reproducible one-in-nine pick for the lit openings
const lit = (x, z, F) => (((x * 73856093) ^ (z * 19349663) ^ (F * 83492791)) >>> 0) % 9 === 0;

const v = new Voxels([W, H, D]);

for (const [x, z] of cells) {
  const f0 = fmin(x, z), t = top(x, z);
  // foundation: solid from the ground up to the lowest floor, with a smooth course on top of the plinth
  for (let y = 0; y < f0; y++) v.set(x, y, z, "stone_bricks");
  v.set(x, f0 - 1, z, "smooth_stone");
  // floors: a slab at every storey line (the roof's is the top), then the skin in each storey with air behind
  for (let F = f0; F <= t; F += STOREY) {
    v.set(x, F, z, F === t ? "gray_concrete" : "light_gray_concrete");
    if (F === t) break;
    const sides = sidesAt(x, z, F);
    if (!sides.length) continue;
    const ground_ = F === f0;
    const outward = sides[0];
    const street_ = ground_ && sides.length === 1 && outward === street;
    // bays run along the face: x on a north or south face, z on an east or west one
    const pier = sides.length >= 2 || ((outward === "north" || outward === "south" ? x : z) % BAY === 0);
    if (street_ && doors.has(k(x, z))) {
      // a pedestrian door: iron, on a stone threshold, under a light fascia
      v.set(x, F + 1, z, "stone_bricks");
      v.set(x, F + 2, z, "iron_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
      v.set(x, F + 3, z, "iron_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (street_ && vehicle.has(k(x, z))) {
      // the vehicle entry: an open bay under a concrete lintel
      v.set(x, F + 3, z, "light_gray_concrete");
      continue;
    }
    if (pier) {
      for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (street_) {
      // the shopfront: clear glass between the piers (a lamp in some), a fascia over
      v.set(x, F + 1, z, lit(x, z, F) ? "glowstone" : "glass");
      v.set(x, F + 2, z, "glass");
      v.set(x, F + 3, z, "white_concrete");
      continue;
    }
    // the car park's open face: a spandrel at each storey line, the deck open behind (a dark slot, a lamp in some)
    v.set(x, F + 1, z, "white_concrete");
    v.set(x, F + 2, z, lit(x, z, F) ? "glowstone" : "gray_stained_glass");
    v.set(x, F + 3, z, "gray_stained_glass");
  }
  // parapet on an open roof edge: a light concrete wall with a stone coping
  if (edgeAtTop(x, z)) {
    v.set(x, t + 1, z, "light_gray_concrete");
    v.set(x, t + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof plant: a lift and stair core on the tallest tier, nearest its centroid: a 3x3 box of concrete with a louvred
// band and a coping, or a 1x1 if the tier holds no 3x3
const tMax = Math.max(...cells.map(([a, b]) => top(a, b)));
const tallest = cells.filter(([x, z]) => top(x, z) === tMax);
const cx = tallest.reduce((s, [x]) => s + x, 0) / tallest.length, cz = tallest.reduce((s, [, z]) => s + z, 0) / tallest.length;
const roomOk = (x, z, r) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (!inside(x + dx, z + dz) || top(x + dx, z + dz) !== tMax) return false; return true; };
const byCentre = (a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz);
let room = null;
for (const r of [1, 0]) {
  const c = tallest.filter(([x, z]) => roomOk(x, z, r)).sort(byCentre)[0];
  if (c) { room = { x: c[0], z: c[1], r }; break; }
}
if (room) {
  const { x: px, z: pz, r } = room;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const ring = Math.max(Math.abs(dx), Math.abs(dz)) === r;
    v.set(px + dx, tMax + 1, pz + dz, "light_gray_concrete");
    v.set(px + dx, tMax + 2, pz + dz, ring ? "gray_stained_glass" : "light_gray_concrete");
    v.set(px + dx, tMax + 3, pz + dz, "light_gray_concrete");
    v.set(px + dx, tMax + 4, pz + dz, "smooth_stone");
  }
}

const { blocks, palette } = v.save(DIR + "way_131471489.nbt");
console.log(`street ${street}, doors ${doors.size}, vehicle ${vehicle.size}, roof ${tMax}, core ${room ? `${2 * room.r + 1}x${2 * room.r + 1}` : "none"}, ${blocks} blocks, ${palette} palette`);
