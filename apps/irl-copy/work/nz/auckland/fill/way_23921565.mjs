// Beca House-style CBD office from the Maungawhau side: an 80s-90s concrete-frame tower on a stone base. Pale concrete
// piers and spandrels, blue-glazed bays, a flat roof with a parapet and a plant box. The lidar roof, median-smoothed
// over 5x5 and rounded to 4-block storeys, gives the stepped tiers; each cell stands on a stone foundation to its ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23921565.cells.json`, "utf8"));
const W = 75, H = 56, D = 142;

const GLASS = "light_blue_stained_glass_pane", PIER = "light_gray_concrete", SPAN = "white_concrete";
const CUBE = new Set([PIER, SPAN, "polished_andesite", "smooth_stone", "gray_concrete", "stone_bricks", "glowstone"]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const INWARD = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };
const key = (x, z) => `${x},${z}`;

// per-cell ground and smoothed roof tier (top of the roof surface, from y 0)
const gnd = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { gnd.set(key(x, z), g); roofRaw.set(key(x, z), r); }
const T = new Map();
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const v = roofRaw.get(key(x + dx, z + dz)); if (v !== undefined) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  T.set(key(x, z), Math.max(Math.round(vals[vals.length >> 1] / 4) * 4, g + 4));
}

// the outward faces of a cell at row y: open to outside the footprint, or above a lower neighbouring tier
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const k = key(x + dx, z + dz);
  return !gnd.has(k) || y > T.get(k);
});

const G = new Map();
const put = (x, y, z, b, s) => G.set(`${x},${y},${z}`, { b, s });
const has = (x, y, z) => G.has(`${x},${y},${z}`);
const windows = [];

// one facade block: base course, shopfront glass with a lintel, then storeys of glass between piers and spandrels
const facade = (ex, x, y, z, g, band) => {
  const [dx] = ex[0];
  const bay = dx !== 0 ? z : x;
  const pier = ex.length > 1 || bay % 3 === 0;
  if (y === g) return "polished_andesite";
  if (y < band) return y === band - 1 ? SPAN : pier ? PIER : GLASS;
  if (y % 4 === 0) return SPAN;                       // floor line; the glass runs three rows up to the next one
  return pier ? PIER : GLASS;
};

for (const [x, z, g] of cells) {
  const t = T.get(key(x, z));
  const band = (Math.floor((g + 1) / 4) + 1) * 4;    // ground storey: first course line above g+1
  const col = x % 6 === 0 && z % 6 === 0;             // structural columns behind the glass, so the floors have support
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (let y = g; y <= t; y++) {
    const ex = exposed(x, z, y);
    if (y === t) { if (ex.length) put(x, y, z, "stone_bricks"); continue; }           // parapet
    if (y === t - 1) { put(x, y, z, ex.length ? "smooth_stone" : "gray_concrete"); continue; }  // cornice / roof
    if (ex.length) {
      const b = facade(ex, x, y, z, g, band);
      put(x, y, z, b);
      if (b === GLASS && y % 4 === 1) windows.push([x, y, z, ex[0]]);
      continue;
    }
    if (y === g || (y >= band && y <= t - 2 && (y - band) % 4 === 0)) put(x, y, z, "smooth_stone");  // floor slabs
    else if (col) put(x, y, z, PIER);
  }
}

// entrance on the face with the most open walls at ground level: dark oak door, canopy two out, lantern under it
const faceCount = new Map(), faceCells = new Map();
for (const [x, z, g] of cells) {
  const ex = exposed(x, z, g + 1);
  if (ex.length !== 1) continue;
  const d = ex[0].join(",");
  faceCount.set(d, (faceCount.get(d) || 0) + 1);
  if (!faceCells.has(d)) faceCells.set(d, []);
  faceCells.get(d).push([x, z]);
}
const dkey = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const [dx, dz] = dkey.split(",").map(Number);
const list = faceCells.get(dkey);
const bays = list.map(([x, z]) => (dx ? z : x)).sort((a, b) => a - b);
const bay = bays[bays.length >> 1];
const [x0, z0] = list.find(([x, z]) => (dx ? z : x) === bay);
const g0 = gnd.get(key(x0, z0));
put(x0, g0, z0, "dark_oak_door", { facing: INWARD[dkey], half: "lower", hinge: "left", open: "false", powered: "false" });
put(x0, g0 + 1, z0, "dark_oak_door", { facing: INWARD[dkey], half: "upper", hinge: "left", open: "false", powered: "false" });
for (let k = 1; k <= 2; k++) for (let j = -2; j <= 2; j++) {
  const px = dx ? x0 + dx * k : x0 + j, pz = dz ? z0 + dz * k : z0 + j;
  if (gnd.has(key(px, pz)) || has(px, g0 + 2, pz)) continue;
  put(px, g0 + 2, pz, "smooth_stone");
}
put(x0 + dx * 2, g0 + 1, z0 + dz * 2, "lantern", { hanging: "true" });

// warm light: about one window in five gets a glowstone just inside the glass, standing on the floor slab
// (the window's floor is at y%4 == 0, so a glowstone on the first glass row, y%4 == 1, sits on it)
for (const [x, y, z, [wx, wz]] of windows) {
  if ((x * 73856093 ^ y * 19349663 ^ z * 83492791) % 5 !== 0) continue;
  const ix = x - wx, iz = z - wz;
  if (!gnd.has(key(ix, iz)) || has(ix, y, iz) || !has(ix, y - 1, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// roof plant: an 8 x 6 box on the tallest tier, away from its parapet, nearest the middle of the tall roof
const tMax = Math.max(...T.values());
const tall = cells.filter(([x, z]) => T.get(key(x, z)) === tMax);
const cx = tall.reduce((s, [x]) => s + x, 0) / tall.length, cz = tall.reduce((s, [, z]) => s + z, 0) / tall.length;
let best = null;
for (const [ox, oz] of cells.map(([x, z]) => [x, z])) {
  let ok = true;
  for (let dz = 0; dz < 6 && ok; dz++) for (let dx2 = 0; dx2 < 8 && ok; dx2++) {
    const k = key(ox + dx2, oz + dz);
    if (!gnd.has(k) || T.get(k) !== tMax || exposed(ox + dx2, oz + dz, tMax - 1).length) ok = false;
  }
  if (!ok) continue;
  const d = Math.hypot(ox + 3.5 - cx, oz + 2.5 - cz);
  if (!best || d < best.d) best = { ox, oz, d };
}
if (best) {
  for (let dz = 0; dz < 6; dz++) for (let dx2 = 0; dx2 < 8; dx2++) {
    const x = best.ox + dx2, z = best.oz + dz;
    put(x, tMax, z, PIER); put(x, tMax + 1, z, PIER); put(x, tMax + 2, z, "stone_bricks");
  }
}

// pane connections: a pane joins a neighbouring pane or solid wall in the same plane
for (const [k, v] of G) {
  if (v.b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (xx, zz) => { const n = G.get(`${xx},${y},${zz}`); return !!n && (n.b === GLASS || CUBE.has(n.b)); };
  v.s = { north: String(link(x, z - 1)), south: String(link(x, z + 1)), east: String(link(x + 1, z)), west: String(link(x - 1, z)), waterlogged: "false" };
}

const out = new Voxels([W, H, D]);
for (const [k, { b, s }] of G) {
  const [x, y, z] = k.split(",").map(Number);
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) throw new Error(`out of bounds ${k}`);
  out.set(x, y, z, b, s);
}
console.log(out.save(`${DIR}/way_23921565.nbt`), { tiers: [...new Set(T.values())].sort((a, b) => a - b), entrance: { face: dkey, x: x0, z: z0 } });
