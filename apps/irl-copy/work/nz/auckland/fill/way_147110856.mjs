// Delta Insurance, Auckland CBD fringe: a late-20th-century office tower, the era of the city's glass-and-concrete
// blocks on the ridge (a design call from the record: 16 storeys at about 4 blocks each, a 30 x 31 footprint). It rises
// to 66 blocks, with a two-storey granite podium, tinted-glass bays on white-concrete piers, light-grey spandrels and a
// stone-capped parapet on every tier, a louvred plant room on the tallest tier, and two recessed entrances on the street
// face. Read from the lidar: the roof runs 16 to 65 blocks above y 0; a 5x5 median smooths the noise (the 16s, 19s and
// 44s) and rounds each cell to a 4-block storey grid (floors at y = 2 + 4k), so the tiers come out flat. Every cell is
// solid from y 0 to its lowest floor, and every floor is a full plate over the footprint, so each storey stands on the
// one below. Only the exposed skin is built: a side faces air where it meets the outside or a neighbour whose roof
// stops below that storey, and a pier or a glass pane goes there with air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_147110856.cells.json", "utf8"));
const W = 30, D = 31, H = 78, STOREY = 4, GRID = 2, BAY = 4, PODIUM = 2;

const k = (x, z) => x * 1000 + z;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k(x, z), g); roof.set(k(x, z), r); }
const inside = (x, z) => ground.has(k(x, z));

// each cell's lowest floor (the first grid floor at or above its ground) and its roof (the median of the lidar around it,
// rounded to the storey grid)
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const FLOOR0 = new Map(), TOP = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof.get(k(x + dx, z + dz)));
  const f0 = GRID + STOREY * Math.ceil((g - GRID) / STOREY);
  const top = GRID + STOREY * Math.round((med(v) - GRID) / STOREY);
  FLOOR0.set(k(x, z), f0); TOP.set(k(x, z), Math.max(top, f0 + STOREY));
}
const f0 = (x, z) => FLOOR0.get(k(x, z)), top = (x, z) => TOP.get(k(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const SIDES = Object.values(DIRS);
const NAME = (dx, dz) => Object.keys(DIRS).find((n) => DIRS[n][0] === dx && DIRS[n][1] === dz);

// a side of cell (x, z) at the storey whose floor is F faces air: the outside, or a neighbour whose roof stops below this
// storey. A neighbour still underground here (its ground floor is above F) buries the side.
const open = (x, z, [dx, dz], F) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  if (f0(nx, nz) > F) return false;
  return top(nx, nz) < F + STOREY;
};
const sidesAt = (x, z, F) => SIDES.filter(([dx, dz]) => open(x, z, [dx, dz], F));
// the roof edges: a side where the neighbour is outside or lower
const parapetSides = (x, z) => SIDES.filter(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));

// the street: the outward face with the most exposed cells on its lowest storey
const faceCount = {};
for (const [x, z] of cells) for (const s of sidesAt(x, z, f0(x, z))) faceCount[NAME(...s)] = (faceCount[NAME(...s)] || 0) + 1;
const street = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const [SX, SZ] = DIRS[street];
const onStreet = (s) => s[0] === SX && s[1] === SZ;
const ax = SX === 0 ? [1, 0] : [0, 1];           // the step along the street face

// two entrances on the street face's lowest floor, at a third and two thirds along it
const lowest = Math.min(...cells.filter(([x, z]) => sidesAt(x, z, f0(x, z)).some(onStreet)).map(([x, z]) => f0(x, z)));
const face = cells
  .filter(([x, z]) => f0(x, z) === lowest && sidesAt(x, z, lowest).some(onStreet))
  .sort((a, b) => (SX === 0 ? a[0] - b[0] : a[1] - b[1]));
const entrances = [face[Math.floor(face.length / 3)], face[Math.floor((2 * face.length) / 3)]];

// the tallest tier's middle: a 5 x 5 patch of roof for the plant room
const topMax = Math.max(...cells.map(([x, z]) => top(x, z)));
const cx0 = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz0 = cells.reduce((s, c) => s + c[1], 0) / cells.length;
// the plant room is 5 x 5 where the tallest tier allows it, else 3 x 3
const plantOk = (x, z, h) => {
  for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) if (!inside(x + dx, z + dz) || top(x + dx, z + dz) !== topMax) return false;
  return true;
};
let H_PLANT = 2, plant = cells.filter(([x, z]) => plantOk(x, z, 2)).sort((a, b) => Math.hypot(a[0] - cx0, a[1] - cz0) - Math.hypot(b[0] - cx0, b[1] - cz0))[0];
if (!plant) { H_PLANT = 1; plant = cells.filter(([x, z]) => plantOk(x, z, 1)).sort((a, b) => Math.hypot(a[0] - cx0, a[1] - cz0) - Math.hypot(b[0] - cx0, b[1] - cz0))[0]; }

const PLINTH = "polished_andesite", GRANITE = "polished_granite", PIER = "white_concrete", SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane", ROOF = "stone_bricks", FLOOR = "smooth_stone", CAP = "stone_brick_slab";

const g = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 1. foundation and floor plates: solid from y 0 up to the lowest floor, then a plate at every floor up to the roof
for (const [x, z] of cells) {
  const F0 = f0(x, z), T = top(x, z);
  for (let y = 0; y < F0; y++) set(x, y, z, PLINTH);
  for (let F = F0; F <= T; F += STOREY) set(x, F, z, FLOOR);
}

// 2. the storeys: under each floor a string course, then three rows of wall (glass between piers, a spandrel on top);
// the two lowest storeys are a granite podium
for (const [x, z] of cells) {
  for (let F = f0(x, z); F + STOREY <= top(x, z); F += STOREY) {
    const sides = sidesAt(x, z, F);
    if (!sides.length) continue;                 // interior: air behind the floor plates
    const podium = F < f0(x, z) + PODIUM * STOREY;
    const corner = sides.length > 1;
    const pier = corner || sides.some(([dx, dz]) => (dx === 0 ? x : z) % BAY === 0);
    set(x, F, z, podium ? GRANITE : SPANDREL);
    for (let y = F + 1; y <= F + 2; y++) {
      if (pier) set(x, y, z, PIER);
      else {
        const ew = sides[0][0] === 0;            // a north or south face runs east-west
        set(x, y, z, GLASS, { north: String(!ew), east: String(ew), south: String(!ew), west: String(ew), waterlogged: "false" });
      }
    }
    set(x, F + 3, z, podium ? GRANITE : SPANDREL);
    // a warm light in some windows: a glowstone one cell back, on the floor, where the room behind is open
    if (!pier && (x * 7 + z * 5 + F) % 7 === 0) {
      const [dx, dz] = sides[0], ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !sidesAt(ix, iz, F).length && f0(ix, iz) <= F && top(ix, iz) >= F + STOREY) set(ix, F + 1, iz, "glowstone");
    }
  }
}

// 3. roofs and parapets: the roof slab on each cell's top, and a parapet with a stone cap on every edge that drops
for (const [x, z] of cells) {
  const T = top(x, z);
  set(x, T, z, ROOF);
  if (parapetSides(x, z).length) {
    set(x, T + 1, z, SPANDREL);
    set(x, T + 2, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// 4. the plant room on the tallest tier: a box of walls with louvres on each side and a stone cap
if (plant) {
  const [px, pz] = plant, T = topMax, h = H_PLANT;
  for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) {
    const x = px + dx, z = pz + dz, ring = Math.max(Math.abs(dx), Math.abs(dz)) === h;
    if (ring) {
      for (let y = T + 1; y <= T + 3; y++) set(x, y, z, SPANDREL);
      const mid = dx === 0 || dz === 0;
      if (mid) set(x, T + 2, z, "iron_bars");
    }
    set(x, T + 4, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// 5. two recessed entrances on the street: a glass door, glass either side, a stone canopy over the three
for (const [x, z] of entrances) {
  const F = lowest, facing = NAME(-SX, -SZ);
  set(x, F + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, F + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 0, 1]) {
    const cx = x + s * ax[0], cz = z + s * ax[1];
    if (s !== 0) {
      if (!inside(cx, cz) || !sidesAt(cx, cz, F).some(onStreet)) continue;
      set(cx, F + 1, cz, "glass");
      set(cx, F + 2, cz, "glass");
    }
    set(cx, F + 3, cz, GRANITE + "_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(DIR + "way_147110856.nbt");
console.log(JSON.stringify({ street, entrances: entrances.map(([x, z]) => [x, z]), plant: plant ? [plant[0], plant[1]] : null, topMax, lowest, blocks: g.count() }));
