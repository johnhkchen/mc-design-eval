// Kiwi International Hotel, Eden Terrace (way 162651696): a 1970s concrete hotel, a five-storey tower over a
// three-storey setback massing and one-storey wings, with a stone plinth where the site falls away to the south-west.
// The massing is the lidar roof, median-smoothed over 3x3 and snapped to a storey line above one datum (D, the modal
// street ground), so every floor sits on the one below and the tiers step back cleanly. Every footprint column stands
// on its own foundation from y 0; floor slabs every 4 blocks; the facade is the exposed outer ring (glass bays between
// white piers, spandrels, a string course per storey, a parapet); the inside is air with a lit pane here and there.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162651696.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_162651696.nbt`;

const SIZE = [66, 39, 65];
const D = 8;            // the floor datum: the first storey line, at the modal street ground
const STOREY = 4;

const key = (x, y, z) => `${x},${y},${z}`;
const parse = (k) => k.split(",").map(Number);

// one column per footprint cell: g = lidar ground, R = the tier's top (the roof's parapet line is R), base = where the
// building starts (the plinth is solid stone below it)
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const median3 = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r); }
  return v.sort((a, b) => a - b)[v.length >> 1];
};
const col = new Map();
for (const [x, z, g] of cells) {
  const n = Math.max(1, Math.round((median3(x, z) - D) / STOREY));   // storeys above the datum, at least one
  col.set(`${x},${z}`, { g, R: D + STOREY * n, base: Math.max(g, D) });
}
const C = (x, z) => col.get(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
// the outward sides of a column at height y with no building behind them: the faces the facade shows
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = C(x + dx, z + dz); return !n || n.R <= y; });
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const B = new Map();    // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1]) B.set(key(x, y, z), [block, state]); };

// the massing and the facade
for (const [k, c] of col) {
  const [x, z] = parse(k);
  for (let y = 0; y < c.R; y++) {
    if (y < c.base) { put(x, y, z, "stone_bricks"); continue; }          // foundation and plinth
    const rel = (y - D) % STOREY, storey = Math.floor((y - D) / STOREY);
    const fs = faces(x, z, y), wall = fs.length > 0;
    if (y === c.R - 1) {                                                  // the roof deck, and the cornice on the edge
      put(x, y, z, wall ? "light_gray_concrete" : "gray_concrete");
      if (faces(x, z, y).length) put(x, y + 1, z, "white_concrete");     // parapet
      continue;
    }
    if (rel === 0) { put(x, y, z, storey === 0 ? "stone_bricks" : "light_gray_concrete"); continue; }   // floor slab, string course; base course at the datum
    if (!wall) continue;                                                  // inside: air
    const [dx] = fs[0], along = dx !== 0 ? z : x;
    if (rel === 3) { put(x, y, z, "white_concrete"); continue; }         // spandrel
    const corner = fs.length > 1;
    const pier = corner || (storey === 0 ? along % 6 === 0 : along % 3 === 0);   // the ground floor is glazed longer
    if (pier) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, (along + storey) % 4 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass");
  }
}

// the entrance: on a plain face at the highest street ground near the middle, a three-bay glazed front with the door
// in the middle bay and a stone lintel over it
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let entrance = null;
for (const [x, z, g] of cells) {
  const fs = faces(x, z, D + 1);
  if (fs.length !== 1) continue;
  const [dx, dz, name] = fs[0];
  const bay = [-1, 0, 1].map((o) => (dx !== 0 ? [x, z + o] : [x + o, z]));
  if (!bay.every(([bx, bz]) => C(bx, bz) && faces(bx, bz, D + 1).some((f) => f[2] === name))) continue;
  const score = g * 1000 - Math.hypot(x - cx, z - cz);
  if (!entrance || score > entrance.score) entrance = { x, z, dx, dz, name, bay, score };
}
if (entrance) {
  const { x, z, name, bay } = entrance;
  for (const [bx, bz] of bay) {
    for (const y of [D + 1, D + 2]) put(bx, y, bz, "cyan_stained_glass");
    put(bx, D + 3, bz, "stone_brick_slab", { type: "top" });
  }
  put(x, D + 1, z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, D + 2, z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light: a lit pane here and there, a glowstone in the air behind the glass
for (const [k, [block]] of [...B]) {
  if (block !== "cyan_stained_glass" && block !== "light_blue_stained_glass") continue;
  const [x, y, z] = parse(k);
  const rel = (y - D) % STOREY;
  if (rel !== 1 && rel !== 2) continue;
  if (hash(x, y, z) % 9 !== 0) continue;
  const fs = faces(x, z, y);
  if (fs.length !== 1) continue;
  const [dx, dz] = fs[0];
  const ix = x - dx, iz = z - dz;
  if (!C(ix, iz) || C(ix, iz).R <= y || B.has(key(ix, y, iz))) continue;
  put(ix, y, iz, "glowstone");
}

// roof plant on the upper tiers: a few 2x2 boxes on the deck, away from the edge
for (const [k, c] of col) {
  const [x, z] = parse(k);
  if (c.R < D + 4 * 4) continue;
  if (faces(x, z, c.R - 1).length || (x % 8) < 2 || (x % 8) > 3 || (z % 8) < 2 || (z % 8) > 3) continue;
  put(x, c.R, z, "light_gray_concrete");
  put(x, c.R + 1, z, "gray_concrete");
}

// every block must be held up: a flood fill from the ground layer through the solid blocks reaches all of them. A
// tier that steps up over a lower roof (a two-cell tongue of the upper tier) hangs its floor in the air; lay a deck
// course under any such block, on the lower roof, and fill again until nothing hangs.
const reached = () => {
  const seen = new Set(), q = [];
  for (const k of B.keys()) if (parse(k)[1] === 0) { seen.add(k); q.push(k); }
  while (q.length) {
    const [x, y, z] = parse(q.pop());
    for (const [ax, ay, az] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const nk = key(x + ax, y + ay, z + az);
      if (B.has(nk) && !seen.has(nk)) { seen.add(nk); q.push(nk); }
    }
  }
  return [...B.keys()].filter((k) => !seen.has(k));
};
for (let pass = 0, hanging = reached(); hanging.length && pass < 8; pass++) {
  for (const k of hanging) {
    const [x, y, z] = parse(k);
    if (y > 0 && !B.has(key(x, y - 1, z))) put(x, y - 1, z, "gray_concrete");
  }
  hanging = reached();
}
const floating = reached();
if (floating.length) console.error(`floating blocks: ${floating.length}`, floating.slice(0, 10));

const g = new Voxels(SIZE);
for (const [k, [block, state]] of B) { const [x, y, z] = parse(k); g.set(x, y, z, block, state); }
const { blocks, palette } = g.save(OUT);
console.log(`way_162651696: ${blocks} blocks, palette ${palette}, floating ${floating.length}, entrance ${entrance ? entrance.name : "none"}`);
