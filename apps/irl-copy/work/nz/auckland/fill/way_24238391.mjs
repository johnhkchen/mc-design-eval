import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Auckland Baptist Tabernacle: a 1950s brick auditorium with concrete bands and piers, a stone plinth and parapet,
// a grey flat roof, a raised central hall with a belfry, and warm lanterns behind the glass.
const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_24238391.cells.json`, "utf8"));

const PLINTH = "stone_bricks", BODY = "bricks", TRIM = "white_concrete", PARAPET = "stone_bricks";
const FLOOR = "smooth_stone", ROOF = "gray_concrete", GLASS = "glass_pane";
const FLOORS = [5, 9, 13, 17, 21];        // storey lines, absolute: 4-block storeys
const PLINTH_TOP = 5;                     // rows 0..4 are solid under the whole footprint (the downhill side needs it)
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const key = (x, z) => `${x},${z}`;

// [x, z, ground, roof] per cell; the roof is smoothed over a 5x5 window, then snapped to one of three tiers (19, 21, 23)
const grid = new Map();
for (const [x, z, g, r] of cells) grid.set(key(x, z), { g, raw: r });
const tierOf = (s) => (s < 20.2 ? 19 : s < 21.8 ? 21 : 23);
for (const [k, c] of grid) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = grid.get(key(x + dx, z + dz)); if (o) { s += o.raw; n++; }
  }
  c.r = tierOf(s / n);
}

// the faces of a cell that show: off the footprint, or against a lower tier (a setback)
const faces = (x, z) => {
  const c = grid.get(key(x, z)), out = [];
  for (const [dx, dz] of DIRS) {
    const o = grid.get(key(x + dx, z + dz));
    if (!o || o.r < c.r) out.push([dx, dz]);
  }
  return out;
};
// the face a wall cell is dressed for: a true outside face first, else the step
const primary = (x, z) => {
  const f = faces(x, z);
  return f.find(([dx, dz]) => !grid.has(key(x + dx, z + dz))) ?? f[0];
};

const v = new Voxels([63, 35, 42]);
const storeyOf = (y) => FLOORS.filter((f) => f <= y).pop();
const pane = (x, y, z, axis) => v.set(x, y, z, GLASS, axis === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lantern = (x, y, z) => v.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// the entrance: a street-facing wall cell on the plinth, nearest the middle of the plan
let door = null;
for (const [k, c] of grid) {
  const [x, z] = k.split(",").map(Number);
  if (c.g > PLINTH_TOP) continue;
  for (const [dx, dz] of DIRS) {
    if (dz === 0 || grid.has(key(x + dx, z + dz))) continue;
    const score = Math.abs(x - 31);
    if (!door || score < door.score) door = { x, z, dz, score };
  }
}

for (const [k, c] of grid) {
  const [x, z] = k.split(",").map(Number);
  const y0 = Math.max(c.g, PLINTH_TOP);
  for (let y = 0; y < y0; y++) v.set(x, y, z, PLINTH);
  if (faces(x, z).length === 0) {                 // interior: floor slabs and roof, air between
    for (let y = y0; y < c.r; y++) {
      if (y === c.r - 1) v.set(x, y, z, ROOF);
      else if (y === c.r - 2 || (FLOORS.includes(y) && y <= c.r - 2)) v.set(x, y, z, FLOOR);
    }
    continue;
  }
  const [dx, dz] = primary(x, z);
  const t = dz !== 0 ? x : z;                     // position along the face
  for (let y = y0; y < c.r; y++) {
    if (y === c.r - 1) { v.set(x, y, z, PARAPET); continue; }
    if (y === c.r - 2) { v.set(x, y, z, TRIM); continue; }
    const f = storeyOf(y), rel = y - f;
    if (rel === 0) v.set(x, y, z, f === PLINTH_TOP ? PLINTH : TRIM);
    else if (rel === 3) v.set(x, y, z, BODY);
    else if (t % 3 === 0) v.set(x, y, z, TRIM);   // pier
    else pane(x, y, z, dz !== 0 ? "x" : "z");
  }
}

// warm lanterns standing on the floor behind every other window bay, on single-face walls
for (const [k, c] of grid) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).length === 0) continue;
  const [dx, dz] = primary(x, z);
  const ix = x - dx, iz = z - dz;
  if (!grid.has(key(ix, iz)) || faces(ix, iz).length > 0) continue;
  const t = dz !== 0 ? x : z;
  FLOORS.forEach((f, i) => {
    const y = f + 1;
    if (y >= c.r - 2 || t % 3 === 0 || (Math.floor(t / 3) + i) % 2 !== 0) return;
    if (v.get(ix, y, iz) || !v.get(ix, y - 1, iz)) return;
    lantern(ix, y, iz);
  });
}

// the entrance: dark oak doors in a pier surround, under the first-floor line
if (door) {
  const { x, z, dz } = door, facing = dz > 0 ? "south" : "north";
  v.set(x, 5, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, 6, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let y = 5; y <= 7; y++) {
    if (y === 7) v.set(x, y, z, TRIM);
    for (const sx of [-1, 1]) if (grid.has(key(x + sx, z))) v.set(x + sx, y, z, TRIM);
  }
}

// the central hall's belfry: a 4x4 tower on the 23 tier, with glass in the middle bays, a lantern, and a spire
const tall = [...grid].filter(([, c]) => c.r === 23).map(([k]) => k.split(",").map(Number));
const cx = tall.reduce((s, [x]) => s + x, 0) / tall.length, cz = tall.reduce((s, [, z]) => s + z, 0) / tall.length;
let best = null;
for (const [x0, z0] of tall) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) ok = grid.get(key(x0 + dx, z0 + dz))?.r === 23;
  if (!ok) continue;
  const d = (x0 + 1.5 - cx) ** 2 + (z0 + 1.5 - cz) ** 2;
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = x0 + dx, z = z0 + dz, ring = dx === 0 || dz === 0 || dx === 3 || dz === 3;
    const corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    v.set(x, 23, z, ring ? PLINTH : FLOOR);
    for (const y of [24, 25]) {
      if (!ring || corner) v.set(x, y, z, TRIM);
      else pane(x, y, z, dz === 0 || dz === 3 ? "x" : "z");
    }
    v.set(x, 26, z, ring ? BODY : FLOOR);
    v.set(x, 27, z, PARAPET);
  }
  for (let y = 28; y <= 30; y++) for (const [dx, dz] of [[1, 1], [2, 1], [1, 2], [2, 2]]) v.set(x0 + dx, y, z0 + dz, TRIM);
  lantern(x0 + 1, 24, z0 + 1);
  lantern(x0 + 1, 31, z0 + 1);
}

// roof plant: a few air-handling units on the flat roofs of the lower tiers, clear of the walls
for (const [k, c] of grid) {
  const [x, z] = k.split(",").map(Number);
  if (c.r === 23 || faces(x, z).length > 0) continue;
  if (x % 8 === 4 && z % 6 === 3) v.set(x, c.r, z, "iron_block");
}

const out = `${HERE}/way_24238391.nbt`;
const { blocks, palette } = v.save(out);
console.log(`way_24238391: ${blocks} blocks, ${palette} palette entries -> ${out}`);
