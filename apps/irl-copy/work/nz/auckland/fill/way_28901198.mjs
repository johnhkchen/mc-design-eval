// Wilson Parking, Auckland: a 1970s-style office block on a car-park podium, read from the lidar. The roof runs 42 blocks
// above y 0 over most of the footprint (about 10 storeys of 4 blocks), with a setback tower near 54 on the north-east and
// a few lower wings to the south-west. The lidar roof is smoothed (a 5x5 median, so noise becomes flat tiers) and snapped
// to floors at y = 2 + 4k, so the downhill cells gain storeys below the uphill ones. Every cell is a full column from
// its foundation to its roof, so each storey stands on the one below. Below y 18 (the car-park levels) the street face
// and the rest of the skin are open: iron-bar grilles between concrete fins with a spandrel band per level. Above that
// is a curtain wall of blue-tinted glass on concrete mullions and spandrels. The street face has a stone base course, a
// shopfront with a black fascia canopy, and two iron doors on its thirds with a lantern behind each. The tallest tier
// carries a plant room, and every open roof edge has a concrete parapet. About one office pane in seven has a glowstone
// behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_28901198.cells.json", "utf8"));
const W = 69, H = 65, D = 67, STOREY = 4, GRID = 2, PODIUM_TOP = 18;

const k = (x, z) => x * 1000 + z;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k(x, z), g); roof.set(k(x, z), r); }
const inside = (x, z) => ground.has(k(x, z));

// each cell's lowest floor (the first grid floor at or above its ground) and its smoothed roof (a grid floor)
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const snap = (y) => GRID + STOREY * Math.round((y - GRID) / STOREY);
const FMIN = new Map(), TOP = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof.get(k(x + dx, z + dz)));
  const fmin = GRID + STOREY * Math.ceil((g - GRID) / STOREY);
  const top = Math.max(snap(med(v)), fmin + STOREY);
  FMIN.set(k(x, z), fmin); TOP.set(k(x, z), top);
}
const fmin = (x, z) => FMIN.get(k(x, z)), top = (x, z) => TOP.get(k(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAME = (dx, dz) => Object.keys(DIRS).find((n) => DIRS[n][0] === dx && DIRS[n][1] === dz);

// is the side of cell (x, z) facing (dx, dz) open to air at the storey whose floor is F? Open to the outside, or to a
// neighbour that stops below this storey; a side against a neighbour that continues up is closed.
const open = (x, z, dx, dz, F) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  if (fmin(nx, nz) > F) return false;
  return top(nx, nz) < F + STOREY;
};
const sidesAt = (x, z, F) => Object.values(DIRS).filter(([dx, dz]) => open(x, z, dx, dz, F));
// a parapet stands on an edge where the neighbour is outside or a lower tier
const edgeAtTop = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));

// the street: the outward face with the most exposed cells on its ground storey
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) for (const [dx, dz] of sidesAt(x, z, fmin(x, z))) faceCount[NAME(dx, dz)]++;
const street = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const [SX, SZ] = DIRS[street];
const onStreet = (dx, dz) => dx === SX && dz === SZ;

// the two entrances: on the street's ground storey, single-side cells, at the first and second third of the face
const along = (x, z) => (SZ !== 0 ? x : z);
const streetCells = cells
  .filter(([x, z]) => { const s = sidesAt(x, z, fmin(x, z)); return s.length === 1 && onStreet(...s[0]); })
  .map(([x, z]) => [x, z])
  .sort((a, b) => along(a[0], a[1]) - along(b[0], b[1]));
const entrances = new Set(streetCells.length >= 6
  ? [streetCells[Math.floor(streetCells.length / 3)], streetCells[Math.floor((2 * streetCells.length) / 3)]].map(([x, z]) => k(x, z))
  : []);

// a reproducible one-in-seven pick for the lit office panes
const lit = (x, z, F) => (((x * 73856093) ^ (z * 19349663) ^ (F * 83492791)) >>> 0) % 7 === 0;

const v = new Voxels([W, H, D]);
const PANE = (dx, dz) => (dz !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

for (const [x, z, g] of cells) {
  const f0 = fmin(x, z), t = top(x, z);
  // foundation: solid from y 0 up to the ground, then a stone base to the lowest floor
  for (let y = 0; y < f0; y++) v.set(x, y, z, y < g ? "stone" : "stone_bricks");
  // floors and storeys: a plate at each floor, the skin in each storey, air behind
  for (let F = f0; F <= t; F += STOREY) {
    v.set(x, F, z, F === t ? "smooth_stone" : "light_gray_concrete");
    if (F === t) break;
    const sides = sidesAt(x, z, F);
    if (!sides.length) continue;
    const podium = F <= PODIUM_TOP;
    if (sides.length >= 2) {
      // a corner: a solid concrete column through the storey
      for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, podium ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    const [dx, dz] = sides[0];
    const outward = NAME(dx, dz);
    const inward = [x - dx, z - dz];
    const pos = along(x, z);
    const street_ = onStreet(dx, dz);
    if (F === f0 && street_ && entrances.has(k(x, z))) {
      // an entrance: iron doors on the lower storey with a lantern behind, and a black fascia canopy over the door
      v.set(x, F + 1, z, "iron_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
      v.set(x, F + 2, z, "iron_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
      v.set(x, F + 3, z, "black_concrete");
      if (inside(...inward)) v.set(inward[0], F + 2, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (F === f0 && street_) {
      // the shopfront: a stone base course, glass above, and a black fascia
      v.set(x, F + 1, z, "stone_bricks");
      v.set(x, F + 2, z, "light_blue_stained_glass_pane", PANE(dx, dz));
      v.set(x, F + 3, z, "black_concrete");
      continue;
    }
    if (podium) {
      // car park: a concrete fin every other cell, a grille between, and a spandrel band at the top of the level
      if (pos % 2 === 0) {
        for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, "light_gray_concrete");
      } else {
        for (let y = F + 1; y <= F + 2; y++) v.set(x, y, z, "iron_bars", PANE(dx, dz));
        v.set(x, F + 3, z, "light_gray_concrete");
      }
      continue;
    }
    // office: concrete mullions every third cell, blue-tinted glass between, and a spandrel at the top of the storey
    if (pos % 3 === 0) {
      for (let y = F + 1; y <= F + 3; y++) v.set(x, y, z, "white_concrete");
      continue;
    }
    for (const y of [F + 1, F + 2]) v.set(x, y, z, "light_blue_stained_glass_pane", PANE(dx, dz));
    v.set(x, F + 3, z, "light_gray_concrete");
    if (lit(x, z, F) && inside(...inward) && !sidesAt(inward[0], inward[1], F).length) {
      v.set(inward[0], F + 2, inward[1], "glowstone");
    }
  }
  // a concrete parapet on an open roof edge
  if (edgeAtTop(x, z)) v.set(x, t + 1, z, "light_gray_concrete");
}

// roof plant: on the highest tier that holds a flat room, nearest its centroid, with a ring of walls, iron plant inside
// and a cap; a 5x5 room if the tier holds one, else a 3x3
const tiers = [...new Set(cells.map(([x, z]) => top(x, z)))].sort((a, b) => b - a);
let room = null, tMax = tiers[0];
for (const T of tiers) {
  const tier = cells.filter(([x, z]) => top(x, z) === T);
  const cx = tier.reduce((s, [x]) => s + x, 0) / tier.length, cz = tier.reduce((s, [, z]) => s + z, 0) / tier.length;
  const roomOk = (x, z, r) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (!inside(x + dx, z + dz) || top(x + dx, z + dz) !== T) return false; return true; };
  const byCentre = (a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz);
  for (const r of [2, 1]) {
    const c = tier.filter(([x, z]) => roomOk(x, z, r)).sort(byCentre)[0];
    if (c) { room = { x: c[0], z: c[1], r }; break; }
  }
  if (room) { tMax = T; break; }
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

const { blocks, palette } = v.save(DIR + "way_28901198.nbt");
console.log(`street ${street}, entrances ${entrances.size}, roof ${tMax}, plant ${room ? `${2 * room.r + 1}x${2 * room.r + 1}` : "none"}, ${blocks} blocks, ${palette} palette`);
