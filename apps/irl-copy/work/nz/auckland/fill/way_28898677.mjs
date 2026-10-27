// Deloitte Tower (way 28898677): a 1980s-90s CBD office tower on a two-storey podium, the lidar's roof read as tiers.
// The footprint is a 67 x 65 block plan; the lidar roof (up to 116 blocks, about 29 storeys) is median-smoothed over 3x3
// and quantized to whole storeys that keep the ground's offset, so every tier's roof sits on the storey grid. The shell is
// the outer ring of each tier: a plinth on the ground course, a shopfront and entrance on the podium, pale concrete piers
// and spandrel bands with tinted glass above, a parapet on each tier's edge. Interiors are a floor slab per storey with an
// air gap behind the glass (a few lit behind it), a solid roof row per tier, and a plant room on the tallest tier.
// Every cell rests on what is below: foundation fill under the ground, then slabs, spandrels and roof rows stacked.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_28898677.cells.json", "utf8"));

const W = 67, D = 65, H = 129;
const idx = (x, z) => z * W + x;
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

// footprint, ground and tier tops
const inF = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Int32Array(W * D);
for (const [x, z, g, r] of cells) { inF[idx(x, z)] = 1; G[idx(x, z)] = g; R[idx(x, z)] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inF[idx(x, z)] === 1;

// roof: median of the 3x3 footprint neighbourhood, then whole storeys on the ground's offset (T = g + 4k)
const T = new Int32Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF[idx(x, z)]) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(R[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b);
  const med = v[(v.length - 1) >> 1], g = G[idx(x, z)];
  T[idx(x, z)] = Math.max(g + 8, g + 4 * Math.round((med - g) / 4));
}
const top = (x, z) => T[idx(x, z)];
const ground = (x, z) => G[idx(x, z)];

// a building cell: on the footprint, from its ground course up to its tier's roof row (exclusive of the parapet)
const B = (x, z, y) => inFp(x, z) && y >= ground(x, z) && y < top(x, z);
// which sides face outside the building at this height
const exposed = (x, z, y) => ({
  w: !B(x - 1, z, y), e: !B(x + 1, z, y), n: !B(x, z - 1, y), s: !B(x, z + 1, y),
});
const isExt = (x, z, y) => { const e = exposed(x, z, y); return e.w || e.e || e.n || e.s; };

// materials
const M = {
  found: "stone_bricks", plinth: "polished_andesite", slab: "light_gray_concrete", band: "light_gray_concrete",
  pier: "white_concrete", podiumPier: "polished_andesite", podiumBand: "stone_bricks", cornice: "white_concrete",
  roof: "smooth_stone", parapet: "white_concrete", shopGlass: "glass_pane", podGlass: "gray_stained_glass_pane",
  glassA: "light_blue_stained_glass_pane", glassB: "cyan_stained_glass_pane", plant: "light_gray_concrete",
};
const PANE = /_stained_glass_pane$|^glass_pane$/;
const dirName = (e) => (e.w ? "west" : e.e ? "east" : e.n ? "north" : "south");

// pass 1: every block into a map (so panes can see their neighbours); a fixed sky-to-ground order
const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => out.get(`${x},${y},${z}`);

const cellsList = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF[idx(x, z)]) cellsList.push([x, z]);

for (const [x, z] of cellsList) {
  const g = ground(x, z), t = top(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, M.found);                  // foundation fill under the ground
  for (let y = g; y < t; y++) {
    const ex = isExt(x, z, y), ee = exposed(x, z, y), rel = y % 4;
    const podium = y < g + 8;                                         // the two-storey podium
    const corner = (ee.w || ee.e) && (ee.n || ee.s);
    const bayAlong = ee.w || ee.e ? z : x;                              // the bay along the face
    const pier = corner || bayAlong % 3 === 0;
    if (y === t - 1) {                                                  // the tier's roof row
      put(x, y, z, ex ? M.cornice : M.roof);
      continue;
    }
    if (!ex) {                                                          // interior: slab per storey, air behind the glass
      if (y === g || rel === 0) put(x, y, z, M.slab);
      continue;
    }
    if (y === g) { put(x, y, z, M.plinth); continue; }                 // base course
    if (rel === 0) { put(x, y, z, podium ? M.podiumBand : M.band); continue; }  // spandrel / floor line
    if (rel === 3) { put(x, y, z, podium ? M.podiumBand : M.band); continue; }  // head band over the windows
    // rel 1 and 2: the window band
    if (pier) { put(x, y, z, podium ? M.podiumPier : M.pier); continue; }
    if (y < g + 4) { put(x, y, z, M.shopGlass, { pane: 1 }); continue; }      // shopfront on the ground floor
    if (podium) { put(x, y, z, M.podGlass, { pane: 1 }); continue; }
    const tint = hh(x, y, z) % 4 === 0 ? M.glassB : M.glassA;
    put(x, y, z, tint, { pane: 1 });
  }
  // a parapet on the tier's edge
  if (t > g && isExt(x, z, t - 1)) put(x, t, z, M.parapet);
}

// the entrance: the longest straight run of exposed cells on the ground floor, its middle bay gets the doors
const runs = [];
for (const dir of ["w", "e", "n", "s"]) {
  const along = dir === "w" || dir === "e" ? "z" : "x";
  const byLine = new Map();
  for (const [x, z] of cellsList) {
    if (!exposed(x, z, ground(x, z) + 1)[dir]) continue;
    if (exposed(x, z, ground(x, z) + 1).w && exposed(x, z, ground(x, z) + 1).e) continue;
    const key = dir === "w" || dir === "e" ? x : z, pos = along === "z" ? z : x;
    if (!byLine.has(key)) byLine.set(key, []);
    byLine.get(key).push(pos);
  }
  // runs along the face: the outer line of each face, cells contiguous along it
  for (const [key, arr] of byLine) {
    arr.sort((a, b) => a - b);
    let s = arr[0], p = arr[0];
    const flush = () => runs.push({ dir, key, from: s, to: p, along });
    for (let i = 1; i < arr.length; i++) { if (arr[i] === p + 1) p = arr[i]; else { flush(); s = arr[i]; p = arr[i]; } }
    flush();
  }
}
runs.sort((a, b) => (b.to - b.from) - (a.to - a.from));
const best = runs[0];
const mid = (best.from + best.to) >> 1;
const doorAt = (pos) => (best.along === "z" ? [best.key, pos] : [pos, best.key]);
const [dX, dZ] = doorAt(mid);
const gDoor = ground(dX, dZ);
for (const off of [-1, 0, 1]) {
  const [x, z] = doorAt(mid + off);
  for (const yy of [gDoor + 1, gDoor + 2]) put(x, yy, z, M.shopGlass, { pane: 1 });
}
put(dX, gDoor + 1, dZ, "iron_door", { facing: dirName({ [best.dir]: true }), half: "lower", hinge: "left", open: "false", powered: "false" });
put(dX, gDoor + 2, dZ, "iron_door", { facing: dirName({ [best.dir]: true }), half: "upper", hinge: "left", open: "false", powered: "false" });

// lit windows: a warm light behind some glass (in the air gap, on the floor slab)
for (const [key, v] of [...out.entries()]) {
  if (!v.state || !v.state.pane) continue;
  const [x, y, z] = key.split(",").map(Number);
  const e = exposed(x, z, y);
  const inward = e.w ? [x + 1, z] : e.e ? [x - 1, z] : e.n ? [x, z + 1] : e.s ? [x, z - 1] : null;
  if (!inward || (e.w && e.e) || (e.n && e.s)) continue;
  const h = hh(x, y, z);
  if (h % 11 !== 0 || at(inward[0], y, inward[1])) continue;
  put(inward[0], y, inward[1], h % 2 ? "glowstone" : "shroomlight");
}

// the plant room on the tallest tier: a solid box set back from the edge, its roof cap on the tier's roof row
const tMax = Math.max(...cellsList.map(([x, z]) => top(x, z)));
const tall = cellsList.filter(([x, z]) => top(x, z) === tMax);
const cx = Math.round(tall.reduce((s, [x]) => s + x, 0) / tall.length);
const cz = Math.round(tall.reduce((s, [, z]) => s + z, 0) / tall.length);
// a 5 x 3 box sitting on one flat roof: the highest tier that holds one, nearest the tall tier's centre
const fitsOn = (x0, z0, t0) => {
  for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 5; x++) if (!inFp(x, z) || top(x, z) !== t0 || isExt(x, z, t0 - 1)) return false;
  return true;
};
let plant = null, plantD = Infinity;
for (const [x0, z0] of cellsList) {
  const t0 = top(x0, z0);
  if (t0 < tMax - 16 || !fitsOn(x0, z0, t0)) continue;
  const d = Math.hypot(x0 + 2 - cx, z0 + 1 - cz) - (t0 - (tMax - 16)) * 0.5;
  if (d < plantD) { plantD = d; plant = [x0, z0, t0]; }
}
const boxOk = !!plant;
if (boxOk) {
  const [px, pz, t0] = plant;
  for (let z = pz; z < pz + 3; z++) for (let x = px; x < px + 5; x++) {
    const edge = x === px || x === px + 4 || z === pz || z === pz + 2;
    for (let y = t0; y < t0 + 4; y++) if (y === t0 + 3 || edge) put(x, y, z, M.plant);
  }
}

// pass 2: the blocks into the volume, with pane connections read from the neighbours
const g = new Voxels([W, H, D]);
let panes = 0;
for (const [key, v] of out) {
  const [x, y, z] = key.split(",").map(Number);
  let state = v.state ? { ...v.state } : undefined;
  if (state && state.pane) {
    panes++;
    const e = exposed(x, z, y);
    const alongZ = e.w || e.e;                                           // a wall running north-south
    const conn = (xx, zz) => { const n = at(xx, y, zz); return n && (PANE.test(n.block) || /stained|concrete|andesite|bricks|smooth/.test(n.block)); };
    state = alongZ
      ? { east: "false", west: "false", north: conn(x, z - 1) ? "true" : "false", south: conn(x, z + 1) ? "true" : "false" }
      : { north: "false", south: "false", east: conn(x + 1, z) ? "true" : "false", west: conn(x - 1, z) ? "true" : "false" };
    state.waterlogged = "false";
    g.set(x, y, z, v.block, state);
    continue;
  }
  g.set(x, y, z, v.block, state);
}

const res = g.save(DIR + "way_28898677.nbt");
console.log(`way_28898677: ${res.blocks} blocks, palette ${res.palette}, ${panes} panes, tiers ${Math.min(...cellsList.map(([x, z]) => top(x, z)))}-${tMax}, plant room ${boxOk ? "yes" : "no"}, door on the ${best.dir} face`);
