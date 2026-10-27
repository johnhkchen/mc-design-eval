// Corner Courtville (OSM way 809889263), Auckland CBD: a 1930s stripped-classical commercial block, brick over a
// concrete frame, shopfronts at the street. The lidar roof tiers give a five-storey wing with a seven-storey core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_809889263.cells.json", "utf8"));

const W = 29, H = 42, D = 21;
const FIRST_FLOOR = 7;                                  // first floor line; storeys every 4 blocks above it
const TIERS = [15, 19, 23, 27, 31];                     // flat roof levels (the first air row above the building)
const SIDES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const S = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(t - v) < Math.abs(best - v) || (Math.abs(t - v) === Math.abs(best - v) && t > best) ? t : best));

// Per cell: g = its ground (solid foundation below), R = its roof tier. The lidar roof is median-filtered over the 3x3
// neighbourhood (skipping the zero-height speckle where the roof sits on the ground) and snapped to a tier.
const col = new Map();
for (const [k, { g, r }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`);
    if (n && n.r > n.g + 4) near.push(n.r);
  }
  near.sort((a, b) => a - b);
  const m = near.length ? near[Math.floor(near.length / 2)] : r;
  col.set(k, { g, R: snap(m) });
}
// a second pass over the tiers: each cell takes the most common tier in its 3x3 (ties go up), so the stepped roof
// reads as a few clean tiers and not as single-cell stubs
const tiered = new Map();
for (const [k, { g, R }] of col) {
  const [x, z] = k.split(",").map(Number);
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = col.get(`${x + dx},${z + dz}`);
    if (n) count.set(n.R, (count.get(n.R) ?? 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
  }
  const best = [...count].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  tiered.set(k, { g, R: best });
}
col.clear(); for (const [k, c] of tiered) col.set(k, c);

// The volume: every footprint cell is building from y 0 up to its roof. Exposed voxels (a side with no building beside
// them at that height) are the skin; the rest is air, with a floor slab per storey and a roof membrane under the roof.
const inV = (x, y, z) => { const c = col.get(`${x},${z}`); return !!c && y >= 0 && y < c.R; };
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => !inV(x + dx, y, z + dz));
const isSkin = (x, y, z) => inV(x, y, z) && exposed(x, y, z).length > 0;
const floorsOf = ({ g, R }) => { const f = [g]; for (let F = FIRST_FLOOR; F <= R - 4; F += 4) f.push(F); return f; };

// a pane joins the skin beside it along its face
const glass = (x, y, z, side) => {
  const on = (ax, az) => isSkin(x + ax, y, z + az);
  return ["glass_pane", S(side[0] !== 0
    ? { north: on(0, -1), south: on(0, 1), east: false, west: false, waterlogged: false }
    : { north: false, south: false, east: on(1, 0), west: on(-1, 0), waterlogged: false })];
};

// the facade: plinth and foundation, a shopfront band, then storeys of string course, window bays and spandrel, coping
const skin = (x, y, z, ex) => {
  const { g, R } = col.get(`${x},${z}`);
  const side = ex[0];
  const u = side[0] !== 0 ? z : x;                       // position along the face; bays repeat every 3
  if (y < g) return ["stone_bricks"];                    // foundation
  if (y === g) return ["polished_andesite"];             // base course
  if (y === R - 1) return ["stone_bricks"];              // coping on the roof edge
  if (y < FIRST_FLOOR) {                                 // shopfront band
    if (y === FIRST_FLOOR - 1) return ["stone_bricks"];  // fascia
    return u % 3 === 0 ? ["dark_oak_planks"] : glass(x, y, z, side);
  }
  const F = FIRST_FLOOR + 4 * Math.floor((y - FIRST_FLOOR) / 4);
  if (y === F) return ["white_concrete"];                // string course at each floor line
  if (y === F + 3) return ["bricks"];                    // spandrel
  return u % 3 === 0 ? ["white_concrete"] : glass(x, y, z, side);   // window bay: frame, then pane
};

const interior = (x, y, z) => {
  const c = col.get(`${x},${z}`);
  if (y < c.g) return "stone";
  if (y === c.R - 1) return "gray_concrete";             // roof membrane over the air
  return floorsOf(c).includes(y) ? "smooth_stone" : null; // floor slab per storey
};

const v = new Voxels([W, H, D]);
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.R; y++) {
    const ex = exposed(x, y, z);
    if (ex.length) { const [b, st] = skin(x, y, z, ex); v.set(x, y, z, b, st); }
    else { const b = interior(x, y, z); if (b) v.set(x, y, z, b); }
  }
}

// two entrances on the faces with the most shopfront, at the middle of each face, with a lantern just inside
const faces = new Map();
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, c.g + 1, z);
  if (ex.length === 1) { const n = ex[0][2]; faces.set(n, [...(faces.get(n) ?? []), { x, z, side: ex[0] }]); }
}
const doorways = [...faces.values()].sort((a, b) => b.length - a.length).slice(0, 2).map((list) => {
  list.sort((a, b) => (a.side[0] ? a.z - b.z : a.x - b.x));
  return list[Math.floor(list.length / 2)];
});
for (const { x, z, side: [dx, dz, name] } of doorways) {
  const { g } = col.get(`${x},${z}`);
  const door = (half) => S({ facing: name, half, hinge: "left", open: false, powered: false });
  v.set(x, g + 1, z, "dark_oak_door", door("lower"));
  v.set(x, g + 2, z, "dark_oak_door", door("upper"));
  const ix = x - dx, iz = z - dz;
  if (inV(ix, g + 1, iz) && !isSkin(ix, g + 1, iz)) v.set(ix, g + 1, iz, "lantern", S({ hanging: false, waterlogged: false }));
}

// warm light behind some glass: a lantern on the shop floor, a glowstone on the upper floors' sill-level floor
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g + 1; y < c.R - 1; y++) {
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x;
    if (u % 3 === 0) continue;                            // a frame, not glass
    const ix = x - dx, iz = z - dz;
    if (!inV(ix, y, iz) || isSkin(ix, y, iz)) continue;  // only glass with air behind it
    if (y < FIRST_FLOOR && y === c.g + 1 && (x * 3 + z * 5 + y) % 5 === 0) {
      v.set(ix, y, iz, "lantern", S({ hanging: false, waterlogged: false }));
    } else if (y >= FIRST_FLOOR && y % 4 === 0 && (x * 5 + z * 3) % 4 === 0) {
      v.set(ix, y, iz, "glowstone");                       // y%4 === 0 is the sill row above a floor slab: nothing floats
    }
  }
}

// roof plant: a box on the tower's flat top, and small condenser pads on the lower roofs
const top = Math.max(...[...col.values()].map((c) => c.R));
const topCells = [...col].filter(([, c]) => c.R === top).map(([k]) => k.split(",").map(Number));
const mx = topCells.reduce((s, [x]) => s + x, 0) / topCells.length, mz = topCells.reduce((s, [, z]) => s + z, 0) / topCells.length;
const flat = (x, z, r) => [-2, -1, 0, 1, 2].every((a) => [-2, -1, 0, 1, 2].every((b) => col.get(`${x + a},${z + b}`)?.R === r));
const plant = topCells.filter(([x, z]) => flat(x, z, top)).sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz))[0];
if (plant) {
  const [px, pz] = plant;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) v.set(px + a, top, pz + b, "light_gray_concrete");
  v.set(px, top + 1, pz, "smooth_stone");
  v.set(px, top + 2, pz, "smooth_stone");
}
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.R === top || x % 7 !== 3 || z % 6 !== 2) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
  if (quad.every(([a, b]) => col.get(`${a},${b}`)?.R === c.R && !isSkin(a, c.R - 1, b)))
    for (const [a, b] of quad) v.set(a, c.R, b, "light_gray_concrete");
}

const info = v.save(DIR + "way_809889263.nbt");
console.log(JSON.stringify({ ...info, cells: col.size, tiers: [...new Set([...col.values()].map((c) => c.R))], doors: doorways.length }));
