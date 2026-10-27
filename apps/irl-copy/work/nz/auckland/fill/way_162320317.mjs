// City Lights: a 1980s office block on the Maungawhau ridge. Seven storeys of 4 blocks on a stone plinth, a white
// concrete frame with light-blue glazing in ribbon bands, a light-grey spandrel, a parapet on the outer ring, and a
// setback penthouse on the lidar's 30-block core. Floors, roof decks and the shell are solid; the interior between
// floors is air, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_162320317.cells.json`, "utf8"));
const X = 36, Y = 43, Z = 46;

const STONE = "stone_bricks", BASE = "polished_andesite", WHITE = "white_concrete", LG = "light_gray_concrete";
const PANE = "light_blue_stained_glass_pane", GLOW = "glowstone", SEA = "sea_lantern", PLANT = "iron_block";
const DOOR = "dark_oak_door";
const FRAME = new Set([STONE, BASE, WHITE, LG]);     // what a pane's arm joins to in its wall plane
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the footprint: lidar ground (g) and roof (r) per cell, both above y 0
const fp = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x] !== null;
const outer = (x, z) => N4.some(([dx, dz]) => !inFp(x + dx, z + dz));

// tiers: the lidar roof to whole storeys (4 blocks), then a 3x3 median so the stepped edges go flat
const quant = (r) => Math.min(28, Math.max(4, 4 * Math.floor((r + 1) / 4)));
const H = Array.from({ length: Z }, () => Array(X).fill(0));     // a tier's top (the roof deck is the layer under it)
const PEN = Array.from({ length: Z }, () => Array(X).fill(false)); // the lidar's core above 30: penthouse to 31
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(quant(fp[z + dz][x + dx].r));
  vals.sort((a, b) => a - b);
  const med = vals[vals.length >> 1];
  const pen = fp[z][x].r >= 30;
  PEN[z][x] = pen;
  H[z][x] = pen ? 28 : Math.min(28, Math.max(med, fp[z][x].g + 4));
}
const top = (x, z) => (PEN[z][x] ? 31 : H[z][x]);

// a wall face is exposed where the cell beside it is outside the footprint or its air starts below this row
const exposed = (x, y, z) => N4.some(([dx, dz]) => !inFp(x + dx, z + dz) || y >= top(x + dx, z + dz));

const m = new Map();     // "x,y,z" -> { b, s, pane }
const put = (x, y, z, b, s = null, pane = false) => m.set(`${x},${y},${z}`, { b, s, pane });
const at = (x, y, z) => m.get(`${x},${y},${z}`);

// the wall of a storey: piers every third column on x+z, glazing in the bands between, a spandrel under each band
function facade(x, y, z) {
  const pier = (x + z) % 3 === 0;
  if (y < 4) return y === 3 ? { b: LG } : pier ? { b: STONE } : { b: PANE, pane: true };   // shopfront, fascia over it
  if (y % 4 === 3) return { b: LG };
  return pier ? { b: WHITE } : { b: PANE, pane: true };
}

function describe(x, y, z) {
  const { g } = fp[z][x], h = H[z][x], pen = PEN[z][x];
  if (y < g) return { b: STONE };                          // foundation under the lidar ground
  if (y >= h) {
    if (!pen) return y === h && outer(x, z) ? { b: STONE } : null;   // parapet on the outer ring
    if (y === h) return { b: WHITE };                      // penthouse floor
    if (y === top(x, z) - 1) return { b: LG };             // penthouse roof
    return exposed(x, y, z) ? facade(x, y, z) : null;
  }
  if (y === g && g < 4) return { b: BASE };                // base course
  if (y === h - 1) return { b: LG };                       // roof deck of the tier
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

// the entrance: centred on the longest run of street-side edge cells (low ground, so the door sits on the plinth)
let cand = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++)
  if (fp[z][x] && outer(x, z) && inFp(x, z - 1) && fp[z][x].g === 0) cand.push([x, z]);
const rowRun = new Map();
for (const [, z] of cand) rowRun.set(z, (rowRun.get(z) || 0) + 1);
const zE = [...rowRun].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
const xs = cand.filter(([, z]) => z === zE).map(([x]) => x).sort((a, b) => a - b);
const xE = xs[xs.length >> 1];
for (const y of [1, 2]) m.delete(`${xE},${y},${zE}`);                               // recessed opening
for (const dx of [-1, 1]) for (const y of [1, 2]) if (inFp(xE + dx, zE)) put(xE + dx, y, zE, PANE, null, true);
for (const dx of [-1, 0, 1]) if (inFp(xE + dx, zE)) put(xE + dx, 3, zE, STONE);     // canopy over the opening
put(xE, 1, zE - 1, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(xE, 2, zE - 1, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

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

// roof plant on the flat interior of a tier, and the lit crown on the penthouse
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x] || PEN[z][x] || outer(x, z) || (x * 5 + z * 3) % 13 !== 0) continue;
  if (N4.some(([dx, dz]) => PEN[z + dz][x + dx] || H[z + dz][x + dx] !== H[z][x])) continue;
  put(x, H[z][x], z, PLANT); put(x, H[z][x] + 1, z, PLANT);
}
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++)
  if (fp[z][x] && PEN[z][x] && (x + z) % 2 === 0) put(x, 31, z, SEA);

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
const out = `${FILL}/way_162320317.nbt`;
const info = g3.save(out);
console.log(JSON.stringify({ written: out, ...info, panes, lights, entrance: [xE, zE] }));
