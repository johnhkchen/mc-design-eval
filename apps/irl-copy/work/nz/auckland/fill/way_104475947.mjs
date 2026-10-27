// AUT Library, Auckland (City Campus): a late-20th-century institutional block, a concrete-framed library with tinted
// glazing in bays on a stone base, the campus type that went up in the 1980s and 90s on the city's flat-ish ridges.
// Read from the lidar: the roof runs 0 to 33 blocks above y 0 (about 34 blocks above its lowest ground), so at 4-block
// storeys it is a seven-storey slab with a plant room, the tallest tier standing over the middle of the footprint and
// the wings stepping down toward the edges. The lidar's roof is smoothed (a 5x5 median, so noise becomes flat tiers) and
// rounded to floors on one grid (floors at y = 2 + 4k, so the downhill cells gain storeys below the uphill entry).
// Every cell is filled solid from y 0 up to its lowest floor, so nothing floats; every floor is a full plate over the
// footprint and each storey stands on the one below. Only the exposed skin is built: a cell gets a pier or a glass pane
// where a side faces the sky or a lower neighbour, with air behind it. Bays are 4 blocks (3 panes and a pier), each
// storey has a light concrete spandrel, a stone base course on the ground storey, and a glowstone lights about one
// pane in seven. The street face is the one with the most exposed ground-storey cells: two entrances on its thirds,
// each with an iron door, a glass fanlight and a lantern hung from the floor above. Every tier has a parapet on its
// open edge, capped with a stone slab, and the tallest tier carries a plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_104475947.cells.json", "utf8"));
const W = 78, D = 73, H = 46, STOREY = 4, GRID = 2, BAY = 4;

const k = (x, z) => x * 1000 + z;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k(x, z), g); roof.set(k(x, z), r); }
const inside = (x, z) => ground.has(k(x, z));

// each cell's lowest floor (the first grid floor at or above its ground) and its smoothed top (a grid floor, the roof slab)
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const FMIN = new Map(), TOP = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof.get(k(x + dx, z + dz)));
  const fmin = GRID + STOREY * Math.ceil((g - GRID) / STOREY);
  const top = Math.max(GRID + STOREY * Math.floor((med(v) - GRID) / STOREY + 0.5), fmin + STOREY);
  FMIN.set(k(x, z), fmin); TOP.set(k(x, z), top);
}
const fmin = (x, z) => FMIN.get(k(x, z)), top = (x, z) => TOP.get(k(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAME = (dx, dz) => Object.keys(DIRS).find((n) => DIRS[n][0] === dx && DIRS[n][1] === dz);

// is the side of cell (x, z) facing (dx, dz) open to air at the storey whose floor is F? Open to the sky or the
// outside, or to a neighbour that stops below this storey; a side against the neighbour's own ground is buried.
const open = (x, z, dx, dz, F) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  if (fmin(nx, nz) > F) return false;
  return top(nx, nz) < F + STOREY;
};
const sidesAt = (x, z, F) => Object.values(DIRS).filter(([dx, dz]) => open(x, z, dx, dz, F));
// the parapet: an edge where the neighbour is outside or a lower tier
const edgeAtTop = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));

// the street: the outward face with the most exposed cells on its ground storey
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) for (const [dx, dz] of sidesAt(x, z, fmin(x, z))) faceCount[NAME(dx, dz)]++;
const street = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const [SX, SZ] = DIRS[street];
const onStreet = (dx, dz) => dx === SX && dz === SZ;

// the two entrances: on the street's ground storey, single-side cells, at the first and second third of the face
const along = (x, z) => (SZ !== 0 ? x : z);
const streetCells = cells.filter(([x, z]) => {
  const s = sidesAt(x, z, fmin(x, z));
  return s.length === 1 && onStreet(...s[0]);
}).map(([x, z]) => [x, z]).sort((a, b) => along(a[0], a[1]) - along(b[0], b[1]));
const entrances = new Set(streetCells.length >= 6 ? [streetCells[Math.floor(streetCells.length / 3)], streetCells[Math.floor((2 * streetCells.length) / 3)]].map(([x, z]) => k(x, z)) : []);

// a reproducible one-in-seven pick for the lit panes
const lit = (x, z, F) => (((x * 73856093) ^ (z * 19349663) ^ (F * 83492791)) >>> 0) % 7 === 0;

const v = new Voxels([W, H, D]);
const PANE = (dx, dz) => (dz !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

for (const [x, z, g] of cells) {
  const f0 = fmin(x, z), t = top(x, z);
  // foundation: solid from the ground up to the lowest floor
  for (let y = 0; y < f0; y++) v.set(x, y, z, "stone");
  // floors and storeys: the plate at each floor, the skin in each storey, air behind
  for (let F = f0; F <= t; F += STOREY) {
    v.set(x, F, z, F === t ? "smooth_stone" : "light_gray_concrete");
    if (F === t) break;
    const sides = sidesAt(x, z, F);
    if (!sides.length) continue;
    const ground_ = F === f0;
    if (sides.length >= 2) {
      for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, "white_concrete");
      continue;
    }
    const [dx, dz] = sides[0];
    const outward = NAME(dx, dz);
    const inward = [x - dx, z - dz];
    const pierAt = (dz !== 0 ? x : z) % BAY === 0;
    if (ground_ && onStreet(dx, dz) && entrances.has(k(x, z))) {
      // an entrance: a double-height iron door on a stone threshold, and a lantern hung from the floor above inside
      v.set(x, F + 1, z, "stone_bricks");
      v.set(x, F + 2, z, "iron_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
      v.set(x, F + 3, z, "iron_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
      if (inside(...inward)) v.set(inward[0], F + 3, inward[1], "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (pierAt) {
      for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, "white_concrete");
      continue;
    }
    // the base course on the ground storey, then the glass (a window grid: panes between the piers)
    if (ground_) v.set(x, F + 1, z, "stone_bricks");
    const glassRows = ground_ ? [F + 2] : [F + 1, F + 2];
    for (const y of glassRows) v.set(x, y, z, "light_blue_stained_glass_pane", PANE(dx, dz));
    // the spandrel under the floor above: light concrete on the street, a darker band on the ground storey
    if (!ground_ || !onStreet(dx, dz)) v.set(x, F + 3, z, "light_gray_concrete");
    else v.set(x, F + 3, z, "stone_bricks");
    if (lit(x, z, F) && inside(...inward) && !sidesAt(inward[0], inward[1], F).length) {
      v.set(inward[0], F + 2, inward[1], "glowstone");
    }
  }
  // parapet on an open edge of the roof, with a stone slab for the coping
  if (edgeAtTop(x, z)) {
    v.set(x, t + 1, z, "white_concrete");
    v.set(x, t + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof plant: a room on the tallest tier, nearest its centroid, with a ring of walls, iron plant inside and a cap; a 5x5
// room if the tier holds one, else a 3x3
const tMax = Math.max(...cells.map(([a, b]) => top(a, b)));
const tallest = cells.filter(([x, z]) => top(x, z) === tMax);
const cx = tallest.reduce((s, [x]) => s + x, 0) / tallest.length, cz = tallest.reduce((s, [, z]) => s + z, 0) / tallest.length;
const roomOk = (x, z, r) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (!inside(x + dx, z + dz) || top(x + dx, z + dz) !== tMax) return false; return true; };
const byCentre = (a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz);
let room = null;
for (const r of [2, 1]) {
  const c = tallest.filter(([x, z]) => roomOk(x, z, r)).sort(byCentre)[0];
  if (c) { room = { x: c[0], z: c[1], r }; break; }
}
if (room) {
  const { x: px, z: pz, r } = room;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const ring = Math.max(Math.abs(dx), Math.abs(dz)) === r;
    if (ring) { v.set(px + dx, tMax + 1, pz + dz, "light_gray_concrete"); v.set(px + dx, tMax + 2, pz + dz, "light_gray_concrete"); }
    else v.set(px + dx, tMax + 1, pz + dz, "iron_block");
    v.set(px + dx, tMax + 3, pz + dz, "gray_concrete");
  }
}

const { blocks, palette } = v.save(DIR + "way_104475947.nbt");
console.log(`street ${street}, entrances ${entrances.size}, roof ${tMax}, plant ${room ? `${2 * room.r + 1}x${2 * room.r + 1}` : "none"}, ${blocks} blocks, ${palette} palette`);
