// Te Wai Ngutu Kākā Gallery: a 1990s civic gallery on the Auckland fringe (Eden Terrace / the CBD's western edge), a
// nine-storey block of pale precast and blue-tinted glazing on a dressed-stone podium. The lidar roof sits on three
// clean tiers: a 9-storey main body (roof 36), a 10-storey setback (40) and an 11-storey core (44), with a 3-storey
// wing (12) at the low north-east corner. The roof is median-smoothed (5x5) and quantised to 4-block storeys, and each
// column is solid from y 0 up to its ground and then up to its roof, so every storey stands on the one below.
// Interiors: a floor slab on every multiple of 4 and air between, walled by the solid shell. Facade: a 1-block skin of
// stone spandrels, pale mullions every third block and blue glass between, with glowstone behind some bays. Ground
// storey: stone podium, shopfront glazing, and two double doors under a stone lintel. Roof: a coping, a parapet, and
// plant boxes with a rooftop mast on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_104475937.cells.json", "utf8"));

const W = 59, D = 50, H = 60;
const SIDES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// the palette: stone podium and spandrels, pale mullions, blue-tinted glass, dark roof membrane
const FOUND = "stone_bricks", PODIUM = "stone_bricks", SPANDREL = "smooth_stone", MULLION = "white_concrete";
const GLASS = "light_blue_stained_glass", WARM = "yellow_stained_glass", ROOF = "gray_concrete", LIGHT = "glowstone";

const key = (x, z) => `${x},${z}`;
const cell = new Map();                                 // "x,z" -> { g: ground, r: lidar roof above y 0 }
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, r });
const inF = (x, z) => cell.has(key(x, z));

// 1. The roof tiers: lidar noise is medianed over 5x5 and quantised to 4-block storeys (wings under 16 stay 3 storeys).
const top = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) v.push(cell.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const med = v[v.length >> 1];
  const q = med < 16 ? 12 : 4 * Math.round(med / 4);
  top.set(k, Math.max(q, c.g + 8));                     // never less than two storeys above its ground
}
const topAt = (x, z) => top.get(key(x, z)) ?? -1;
const maxTop = Math.max(...top.values());

// A column is solid where it is in the footprint and below its roof: the massing every rule below reads.
const solid = (x, y, z) => y >= 0 && topAt(x, z) > y;
// The sides a block at (x, y, z) shows to the outside: no massing beside it, or a lower roof beside it.
const faces = (x, y, z) => SIDES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz));
const perimeter = (x, y, z) => faces(x, y, z).length > 0;
// mullions every third block along the face the block shows (z on a west or east face, x on a north or south one), so a
// stepped edge still gets its bays rather than a run of columns
const pilaster = (x, z, f) => (f[0][1] !== 0 ? z : x) % 3 === 0;
const hash = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };
const lit = (x, y, z) => hash(x, y, z) % 8 === 0;     // one bay in eight is lit from behind: warm glass, a glowstone inside

// 2. Entrances: on the west and north faces, at the lowest ground near the middle of each face, a bay of two blocks
// wide with room for two door blocks (a lower and an upper half) under a lintel.
const pickDoor = (side, dx, dz) => {
  const cand = [];
  for (const [k, c] of cell) {
    const [x, z] = k.split(",").map(Number);
    if (c.g > 1 || perimeter(x, c.g + 1, z) === false) continue;
    if (!faces(x, c.g + 1, z).some(([s]) => s === side)) continue;
    const along = dz !== 0 ? x : z;
    if (along < 3 || along > (dz !== 0 ? 56 : 47)) continue;
    cand.push({ x, z, g: c.g, along, t: topAt(x, z) });
  }
  if (!cand.length) return null;
  const mid = cand.reduce((s, c) => s + c.along, 0) / cand.length;
  cand.sort((a, b) => Math.abs(a.along - mid) - Math.abs(b.along - mid));
  for (const c of cand) {
    const second = dz !== 0 ? [c.x + 1, c.z] : [c.x, c.z + 1];   // the second leaf of the double door, along the face
    if (!inF(...second) || !faces(second[0], c.g + 1, second[1]).some(([s]) => s === side)) continue;
    if (c.t <= c.g + 8 || c.along % 3 === 0 || (dz !== 0 ? c.x : c.z) % 3 === 0) continue;   // not a mullion
    return { ...c, side, dx, dz, leaves: [[c.x, c.z], second] };
  }
  return null;
};
const doorList = [];
for (const [side, dx, dz] of [SIDES[2], SIDES[0]]) {
  const d = pickDoor(side, dx, dz);
  if (d) doorList.push(d);
}
const doorKeys = new Map();
for (const d of doorList) for (const [x, z] of d.leaves) doorKeys.set(key(x, z), d);

// 3. The rooftop: plant boxes on the tallest core, and a mast at its middle.
const plant = [];
let mast = null;
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (topAt(x, z) !== maxTop || perimeter(x, maxTop - 1, z)) continue;
  if (x % 9 >= 3 && x % 9 <= 5 && z % 9 >= 3 && z % 9 <= 4) plant.push([x, z]);
  if (!mast || Math.hypot(x - 29, z - 25) < Math.hypot(mast[0] - 29, mast[1] - 25)) mast = [x, z];
}

const vox = new Voxels([W, H, D]);
const counts = {};
const put = (x, y, z, block, state) => { vox.set(x, y, z, block, state); counts[block] = (counts[block] || 0) + 1; };

// 4. The solid shell and the interior air: foundation to the ground, then walls, floor slabs and air between them.
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), t = topAt(x, z), g = c.g;
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);
  for (let y = g; y < t; y++) {
    const ex = perimeter(x, y, z), f = faces(x, y, z);
    const door = doorKeys.get(k);
    // the ground storey: a door in each doorway, a stone lintel over it
    if (door && ex && (y === g || y === g + 1)) {
      put(x, y, z, "dark_oak_door", { facing: door.side, half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && ex && y === g + 2) { put(x, y, z, "chiseled_stone_bricks"); continue; }
    if (y === t - 1) { put(x, y, z, ex ? SPANDREL : ROOF); continue; }      // the cornice course, or the roof membrane
    if (y % 4 === 0) {                                                       // a storey line: a spandrel or a floor slab
      put(x, y, z, ex ? SPANDREL : "smooth_stone");
      continue;
    }
    if (!ex) continue;                                                       // interior air between the floor slabs
    if (y < 4) { put(x, y, z, pilaster(x, z, f) ? PODIUM : GLASS); continue; }   // stone podium and shopfront
    if (pilaster(x, z, f)) { put(x, y, z, MULLION); continue; } // corner columns and mullions
    put(x, y, z, lit(x, y, z) ? WARM : GLASS);
  }
}

// 5. Parapets on the roof edges, a warm light behind some bays, the rooftop plant and mast.
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), t = topAt(x, z);
  const edge = SIDES.some(([, dx, dz]) => !inF(x + dx, z + dz) || topAt(x + dx, z + dz) < t);
  if (edge) put(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number), t = topAt(x, z), g = c.g;
  for (let y = 4; y < t - 1; y++) {
    if (y % 4 === 0 || !perimeter(x, y, z)) continue;
    const [side, dx, dz] = faces(x, y, z)[0];
    if (!lit(x, y, z)) continue;
    const ix = x - dx, iz = z - dz;                                       // the air cell just inside the glass
    if (vox.get(ix, y, iz) === null && vox.inBounds(ix, y, iz) && !perimeter(ix, y, iz) && y >= g) {
      put(ix, y, iz, LIGHT);
    }
  }
}
for (const [x, z] of plant) put(x, maxTop, z, "stone_bricks");
if (mast) {
  for (let y = maxTop; y < maxTop + 6; y++) put(mast[0], y, mast[1], "iron_bars");
  put(mast[0], maxTop + 6, mast[1], "lightning_rod");
}

const outPath = DIR + "way_104475937.nbt";
const res = vox.save(outPath);
console.log(JSON.stringify({ roofTiers: [...new Set(top.values())].sort((a, b) => a - b), maxTop, doors: doorList.map(d => ({ side: d.side, x: d.x, z: d.z, g: d.g })), counts, ...res }));
