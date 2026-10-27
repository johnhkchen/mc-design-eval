// A 1970s concrete office block on the Eden Terrace side of the ridge (the lidar: 43 x 36 footprint, roof about 16
// blocks over the lowest ground, mostly 14-15). Four storeys of 4 blocks on a volcanic-stone plinth, white precast
// piers between tinted glass ribbons with grey spandrels, a stone parapet and a basalt cornice. The lidar's 16-block
// core steps back to a 12-block terrace on its outer two blocks, so the tower reads as a setback on a podium. Floors,
// decks and a 6-block column grid are solid; the interior between floors is air, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_326735509";
const cells = JSON.parse(readFileSync(`${FILL}/${NAME}.cells.json`, "utf8"));
const X = 43, Y = 28, Z = 36;

const STONE = "stone_bricks", BASE = "polished_andesite", WHITE = "white_concrete", LG = "light_gray_concrete";
const PANE = "cyan_stained_glass_pane", GLOW = "glowstone", PLANT = "iron_block", DOOR = "dark_oak_door";
const FRAME = new Set([STONE, BASE, WHITE, LG]);     // what a pane's arm joins to in its wall plane
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the footprint: lidar ground (g) and roof (r) per cell, both above y 0
const fp = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x] !== null;
const outer = (x, z) => N4.some(([dx, dz]) => !inFp(x + dx, z + dz));

// tiers: the lidar roof to whole storeys (4 blocks), then a 3x3 median so the stepped edges go flat
const quant = (r) => Math.min(16, Math.max(4, 4 * Math.round(r / 4)));
const H = Array.from({ length: Z }, () => Array(X).fill(0));     // a tier's top (the roof deck is the layer under it)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(quant(fp[z + dz][x + dx].r));
  vals.sort((a, b) => a - b);
  H[z][x] = Math.min(16, Math.max(vals[vals.length >> 1], fp[z][x].g + 4));
}

// distance in cells from the footprint's edge (1 = on the edge): the setback steps in from it
const ed = Array.from({ length: Z }, () => Array(X).fill(Infinity));
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (fp[z][x] && outer(x, z)) { ed[z][x] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of N4) {
    if (inFp(x + dx, z + dz) && ed[z + dz][x + dx] === Infinity) { ed[z + dz][x + dx] = ed[z][x] + 1; queue.push([x + dx, z + dz]); }
  }
}
// the 16-block core keeps its top only where it is 3+ cells in from the edge; the two outer cells drop to a 12-block terrace
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (fp[z][x] && H[z][x] >= 16 && ed[z][x] <= 2) H[z][x] = 12;
const top = (x, z) => H[z][x];

// a wall face is exposed where the cell beside it is outside the footprint or its air starts below this row
const exposed = (x, y, z) => N4.some(([dx, dz]) => !inFp(x + dx, z + dz) || y >= top(x + dx, z + dz));

const m = new Map();     // "x,y,z" -> { b, s, pane }
const put = (x, y, z, b, s = null, pane = false) => m.set(`${x},${y},${z}`, { b, s, pane });
const at = (x, y, z) => m.get(`${x},${y},${z}`);

// the wall of a storey: a shopfront at grade, piers on x+z every third column, glazing between, a spandrel under each band
function facade(x, y, z) {
  const pier = (x + z) % 3 === 0;
  if (y < 4) return y === 3 ? { b: LG } : pier ? { b: STONE } : { b: PANE, pane: true };   // shopfront, fascia over it
  if (y % 4 === 3) return { b: LG };
  return pier ? { b: WHITE } : { b: PANE, pane: true };
}

// structural columns on a 6-block grid carry every floor slab, so no floor hangs over an air storey
const column = (x, z) => x % 6 === 0 && z % 6 === 0;

function describe(x, y, z) {
  const { g } = fp[z][x], h = top(x, z);
  if (y < g) return { b: STONE };                          // foundation under the lidar ground
  if (y >= h) return y === h && outer(x, z) ? { b: STONE } : null;   // parapet on the outer ring
  if (y === g) return { b: BASE };                         // plinth course at grade
  if (y === h - 1) return { b: outer(x, z) ? BASE : LG };  // roof deck; the outer ring is the basalt cornice
  if (column(x, z)) return { b: WHITE };                   // structural column
  if (y % 4 === 0) return { b: WHITE };                    // floor slab
  return exposed(x, y, z) ? facade(x, y, z) : null;        // shell or air behind the glass
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  for (let y = 0; y < top(x, z); y++) {
    const d = describe(x, y, z);
    if (d) put(x, y, z, d.b, null, !!d.pane);
  }
}

// the entrance: the longest run of north-facing edge cells on the lowest ground, the door centred on it
const minG = Math.min(...cells.map(([, , g]) => g));
const cand = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++)
  if (fp[z][x] && !inFp(x, z - 1) && fp[z][x].g === minG) cand.push([x, z]);
const rowRun = new Map();
for (const [, z] of cand) rowRun.set(z, (rowRun.get(z) || 0) + 1);
const zE = [...rowRun].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
const xs = cand.filter(([, z]) => z === zE).map(([x]) => x).sort((a, b) => a - b);
const xE = xs[xs.length >> 1];
for (const dx of [-1, 1]) for (const y of [1, 2]) if (inFp(xE + dx, zE)) put(xE + dx, y, zE, PANE, null, true);
for (const dx of [-1, 0, 1]) if (inFp(xE + dx, zE)) put(xE + dx, 3, zE, STONE);      // stone canopy band over the door
put(xE, 1, zE, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(xE, 2, zE, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light behind some lower-band windows, standing on the floor slab (rows 1 mod 4 only)
for (const [k, v] of [...m]) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 !== 1 || (x * 13 + z * 7 + y * 5) % 9 !== 0) continue;
  for (const [dx, dz] of N4) {
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && !at(ix, y, iz)) { put(ix, y, iz, GLOW); break; }
  }
}

// roof plant on the flat interior of a tier: 2 x 2 low units on the deck (never on the parapet line)
const flatInterior = (x, z) => fp[z][x] && !outer(x, z) && N4.every(([dx, dz]) => inFp(x + dx, z + dz) && top(x + dx, z + dz) === top(x, z));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if ((x * 5 + z * 3) % 17 !== 0) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
  if (!block.every(([bx, bz]) => flatInterior(bx, bz) && top(bx, bz) === top(x, z))) continue;
  for (const [bx, bz] of block) put(bx, top(bx, bz), bz, PLANT);
}

// pane arms join the frame and other panes in their wall plane (not glow or air)
const arm = (x, y, z, dx, dz) => { const n = at(x + dx, y, z + dz); return !!n && (n.pane || FRAME.has(n.b)); };
for (const [k, v] of m) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = { east: arm(x, y, z, 1, 0), west: arm(x, y, z, -1, 0), north: arm(x, y, z, 0, -1), south: arm(x, y, z, 0, 1), waterlogged: false };
  v.s = Object.fromEntries(Object.entries(s).map(([a, b]) => [a, String(b)]));
}

const g3 = new Voxels([X, Y, Z]);
let panes = 0, lights = 0;
for (const [k, v] of m) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.pane) panes++;
  if (v.b === GLOW) lights++;
  g3.set(x, y, z, v.b, v.s);
}
const out = `${FILL}/${NAME}.nbt`;
const info = g3.save(out);
console.log(JSON.stringify({ written: out, ...info, panes, lights, entrance: [xE, zE], topMax: Math.max(...H.flat()) }));
