// Mt Eden / Eden Terrace, Auckland: a 1970s three-storey concrete-and-render office-flats block, white render on a stone plinth,
// dark spandrel bands and blue glass in recessed bays. The lidar roof is smoothed into 1, 2 and 3 storey tiers (tops 5, 9, 13,
// slabs every 4 blocks); the shopfront and entrance sit on the low face (ground at 0). Solid core, one-block air gap behind each
// window, nothing unsupported.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494330.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494330.nbt";
const cells = JSON.parse(readFileSync(IN, "utf8"));

const DIMS = [35, 26, 52];
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const k = (x, y, z) => `${x},${y},${z}`;
const unkey = (s) => s.split(",").map(Number);

// lidar roof heights are noisy: a 3x3 median over the footprint, then snapped to a storey tier
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const tierTop = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b);
  const r = v[v.length >> 1];
  return r <= 6 ? 5 : r <= 10 ? 9 : 13;
};
const F = [...raw].map(([key, { g }]) => { const [x, z] = unkey(key); return { x, z, g, top: tierTop(x, z) }; });
const cellAt = new Map(F.map((c) => [`${c.x},${c.z}`, c]));
const inFp = (x, z) => cellAt.has(`${x},${z}`);
const topOf = (x, z) => cellAt.get(`${x},${z}`)?.top ?? -1;
// a face is exposed at row y when the neighbour across it has no block at that row
const exposed = (c, y) => Object.keys(DIR).filter((f) => !(y < topOf(c.x + DIR[f][0], c.z + DIR[f][1])));
const perimeter = (c) => Object.keys(DIR).some((f) => !inFp(c.x + DIR[f][0], c.z + DIR[f][1]));
const U = (face, c) => (face === "N" || face === "S" ? c.x : c.z);            // position along a face
const inward = (c, face, n) => ({ x: c.x - DIR[face][0] * n, z: c.z - DIR[face][1] * n });
const feasible = (p, y) => inFp(p.x, p.z) && topOf(p.x, p.z) > y && exposed(cellAt.get(`${p.x},${p.z}`), y).length === 0;
const deep = (c) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inFp(c.x + dx, c.z + dz)));

// the shopfront face: the single-face outward side with the most ground-level (g=0) cells
const low = { N: [], S: [], W: [], E: [] };
for (const c of F) if (c.g === 0 && perimeter(c)) { const e = exposed(c, 1); if (e.length === 1) low[e[0]].push(c); }
const [EF, lowCells] = Object.entries(low).sort((a, b) => b[1].length - a[1].length)[0];
const us = lowCells.map((c) => U(EF, c)).sort((a, b) => a - b);
const eu = us[us.length >> 1];                                                 // the door's position along that face

const spec = new Map(), air = new Set(), over = new Map();
const put = (x, y, z, block, state = null) => spec.set(k(x, y, z), { block, state });

// the outer skin of one row: spandrels and cornice in grey, piers in white, recessed glass bays, a shopfront and a door
const facade = (c, y, face) => {
  const { x, z, g } = c;
  const u = U(face, c), sb = Math.floor(y / 4) * 4;
  if (y % 4 === 0) return put(x, y, z, "gray_concrete");                      // storey line and cornice
  if (face === EF && g === 0 && sb === 0) {                                    // ground storey of the shopfront face
    if (y === 3) return put(x, y, z, Math.abs(u - eu) <= 1 ? "smooth_stone" : "white_concrete");   // entrance canopy
    const d1 = inward(c, face, 1);
    if (!feasible(d1, y)) return put(x, y, z, "white_concrete");
    if (u === eu) {
      air.add(k(d1.x, y, d1.z));
      over.set(k(x, y, z), { block: "dark_oak_door", state: { facing: FACING[face], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
      if (y === 2) over.set(k(d1.x, y, d1.z), { block: "lantern", state: { hanging: "true", waterlogged: "false" } });
      return;
    }
    if ((u - eu) % 4 === 0) return put(x, y, z, "white_concrete");           // shopfront piers
    air.add(k(d1.x, y, d1.z));
    over.set(k(x, y, z), { block: "light_blue_stained_glass_pane", state: null, face });
    return;
  }
  // upper storeys (and the ground storey elsewhere): glass rows sb+1..sb+3 above the sill, piers every third block
  const wlo = Math.max(sb + 1, g + 1), whi = sb + 3;
  if (whi - wlo < 1 || u % 3 === 0) return put(x, y, z, "white_concrete");
  // glass in the wall plane with an air gap behind it (a recess would leave its lintel hanging over air)
  const d1 = inward(c, face, 1);
  if (!feasible(d1, y)) return put(x, y, z, "white_concrete");
  air.add(k(d1.x, y, d1.z));
  over.set(k(x, y, z), { block: "light_blue_stained_glass_pane", state: null, face });
  if (y === wlo && (u * 7 + sb * 3 + z * 5) % 4 === 0) over.set(k(d1.x, y, d1.z), { block: "lantern", state: { hanging: "false", waterlogged: "false" } });
};

// the solid massing: plinth below ground, base course, the storey's skin on exposed faces, white core, a roof deck and parapet
for (const c of F) {
  const { x, z, g, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < g) put(x, y, z, "stone_bricks");
    else if (y === g) put(x, y, z, "polished_andesite");
    else {
      const ex = exposed(c, y);
      // a stepped (diagonal) outline is all corners, so a corner takes the skin of its first exposed face rather than a solid pier
      if (ex.length >= 1) facade(c, y, ex[0]);
      else put(x, y, z, y === top - 1 ? "smooth_stone" : "white_concrete");
    }
  }
  if (perimeter(c)) put(x, top, z, "smooth_stone_slab", { type: "bottom" });   // parapet
}

// roof plant: a 3 x 3 box on the tall tower, two blocks high, and AC cubes on the lower roofs
const tall = F.filter((c) => c.top === 13 && deep(c));
if (tall.length) {
  const cen = tall.reduce((b, c) => (Math.abs(c.x - 14) + Math.abs(c.z - 30) < Math.abs(b.x - 14) + Math.abs(b.z - 30) ? c : b));
  for (const c of tall) if (Math.abs(c.x - cen.x) <= 1 && Math.abs(c.z - cen.z) <= 1) { put(c.x, 13, c.z, "light_gray_concrete"); put(c.x, 14, c.z, "light_gray_concrete"); }
}
for (const c of F) if (c.top === 5 && deep(c) && (c.x * 3 + c.z) % 7 === 0) put(c.x, 5, c.z, "iron_block");

// openings: recesses, shopfront and door, applied after the massing
for (const key of air) spec.delete(key);
for (const [key, o] of over) spec.set(key, o);

// glass panes connect to the neighbours in their plane, as the wall they sit in does
const solid = (x, y, z) => spec.has(k(x, y, z));
for (const [key, o] of spec) {
  if (!o.block.endsWith("glass_pane")) continue;
  const [x, y, z] = unkey(key);
  const along = o.face === "N" || o.face === "S";
  o.state = along
    ? { east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), north: "false", south: "false", waterlogged: "false" }
    : { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" };
}

// checks: a block over air must be carried by a neighbour in its own row (a floor slab over an air gap spans between walls);
// lanterns hang or stand, so they are not checked
let floating = [];
for (const [key, o] of spec) {
  const [x, y, z] = unkey(key);
  const carried = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => spec.has(k(x + dx, y, z + dz)));
  if (y > 0 && !spec.has(k(x, y - 1, z)) && !carried && o.block !== "lantern") floating.push(key);
}

const g3 = new Voxels(DIMS);
for (const [key, o] of spec) { const [x, y, z] = unkey(key); g3.set(x, y, z, o.block, o.state ?? undefined); }
const res = g3.save(OUT);
console.log(`footprint ${F.length} cells, entrance face ${EF} at u=${eu} (${lowCells.length} cells); floating ${floating.length} ${floating.slice(0, 5).join(" ")}`);
console.log(`saved ${res.blocks} blocks, palette ${res.palette}`);
