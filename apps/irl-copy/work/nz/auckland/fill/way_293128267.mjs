// Cracker Bay Waterfront Offices: a 1980s-2000s Auckland waterfront office block. Concrete frame with pale precast
// piers and string courses, blue-green reflective glazing, a volcanic-stone plinth, and a stepped massing: a five-storey
// podium over most of the footprint, a six-storey tower block to the east, and a one-storey pavilion to the north-west.
// Storeys are 4 blocks; each tier's top is a storey count snapped from the lidar roof (median-smoothed), so every
// column is solid from y 0 to its roof and floor slabs sit on the storey lines. Interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128267.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128267.nbt";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => x + "," + z;

// footprint and lidar roof per cell
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(key(x, z), r);
const inF = (x, z) => roof.has(key(x, z));

// storeys per cell from the lidar roof (4-block storeys, at least one), then two median passes over the footprint
// neighbourhood to flatten lidar noise into clean tiers
let S = new Map();
for (const [x, z, , r] of cells) S.set(key(x, z), Math.max(1, Math.min(6, Math.round(r / 4))));
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, v] of S) {
    const [x, z] = k.split(",").map(Number), vals = [v];
    for (const [dx, dz] of NB8) { const q = S.get(key(x + dx, z + dz)); if (q !== undefined) vals.push(q); }
    vals.sort((a, b) => a - b);
    next.set(k, vals[Math.floor(vals.length / 2)]);
  }
  S = next;
}
const T = (x, z) => 4 * S.get(key(x, z));          // tier top: the roof plate's underside is the roof deck at T-1

// a body cell's side is exposed when the neighbour is off the footprint or stands lower than this row
const edge = (x, z, y) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);

const Y = 38, X = 63, Zn = 53;
const g = new Voxels([X, Y, Zn]);

// the entrance: the north-facing (z-min) edge of the main podium nearest the footprint's mean x
const northEdges = cells.filter(([x, z]) => !inF(x, z - 1) && T(x, z) >= 12);
const meanX = cells.reduce((a, c) => a + c[0], 0) / cells.length;
northEdges.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
const [DX, DZ] = northEdges[0];

// 1. body: every footprint cell solid from y 0 to its tier top, with the storey grid
for (const [x, z] of cells) {
  const top = T(x, z);
  for (let y = 0; y < top; y++) {
    const e = edge(x, z, y), r = y % 4, roofRow = y === top - 1;
    let b = null;
    if (roofRow) b = e ? "stone_bricks" : "smooth_stone";             // cornice on the edge, roof membrane inside
    else if (y === 0) b = e ? "polished_andesite" : "stone_bricks";      // volcanic-stone plinth, slab inside
    else if (r === 0) b = e ? "white_concrete" : "light_gray_concrete";  // floor line string course, floor slab
    else if (e && (r === 1 || r === 2)) {
      if ((x + z) % 4 === 0) b = "smooth_quartz";                        // pale pier between windows
      else b = "light_blue_stained_glass";                               // glazing, air behind
    }
    else if (e && r === 3) b = "light_gray_concrete";                    // spandrel
    if (y === 0 && !e) b = "stone_bricks";
    if (b) g.set(x, y, z, b);
  }
  // parapet on the tier's exposed edge
  if (edge(x, z, top - 1)) g.set(x, top, z, "smooth_quartz");
}

// 2. warm light behind some glazing: a glowstone or shroomlight in the air just inside a window
for (const [x, z] of cells) {
  const top = T(x, z);
  for (let y = 1; y < top - 1; y++) {
    if (y % 4 !== 1) continue;                                           // lamps on the storey's floor slab, not in mid-air
    if (!edge(x, z, y) || (x + z) % 4 === 0) continue;
    if ((x * 31 + z * 17 + y * 7) % 13 !== 0) continue;
    const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => inF(nx, nz) && !edge(nx, nz, y) && y < T(nx, nz));
    if (inward) g.set(inward[0], y, inward[1], (x * 5 + z * 3 + y) % 4 === 0 ? "shroomlight" : "glowstone");
  }
}

// 3. the entrance: iron door pair on the north face, a dark awning fascia over it, glazing either side
{
  g.set(DX, 1, DZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(DX, 2, DZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (inF(DX + dx, DZ) && edge(DX + dx, DZ, 2) && edge(DX + dx, DZ, 3)) g.set(DX + dx, 3, DZ, "dark_oak_planks");
}

// 4. roof plant: a plant box and a mast on the tower tier, a plant box on the twenty-block tier
{
  const interior = (x, z, top) => [-2, -1, 0, 1, 2].every((d) => inF(x + d, z) && inF(x, z + d) && T(x + d, z) >= top && T(x, z + d) >= top);
  const tops = cells.filter(([x, z]) => T(x, z) === 24 && interior(x, z, 24));
  if (tops.length) {
    const cx = Math.round(tops.reduce((a, c) => a + c[0], 0) / tops.length), cz = Math.round(tops.reduce((a, c) => a + c[1], 0) / tops.length);
    let placed = 0;
    for (const [x, z] of tops) {
      if (Math.abs(x - (cx - 3)) <= 1 && Math.abs(z - cz) <= 1) { g.set(x, 24, z, "light_gray_concrete"); g.set(x, 25, z, "light_gray_concrete"); placed++; }
    }
    if (placed === 0) for (const [x, z] of tops) if (x === cx && z === cz) g.set(x, 24, z, "light_gray_concrete");
    for (let y = 24; y <= 26; y++) g.set(cx + 3, y, cz, "iron_bars");       // mast, on the roof deck
  }
  const mid = cells.filter(([x, z]) => T(x, z) === 20 && interior(x, z, 20));
  for (const [x, z] of mid) if (x % 3 === 0 && z % 3 === 0) { g.set(x, 20, z, "light_gray_concrete"); g.set(x, 21, z, "light_gray_concrete"); }
}

// 5. a check: nothing floats. Every block above y 0 has a block under it, except the floor and roof plates, which
// are carried by the walls around them (a plate spans the footprint between edge walls, so it rests on the tier below).
let floating = 0; const hist = {};
g.forEachCell((i) => {
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0 || g.get(x, y - 1, z)) return;
  const plate = (y % 4 === 0 || y === T(x, z) - 1) && inF(x, z) && y < T(x, z);
  if (plate) return;
  floating++; const k = `${g.get(x, y, z).block} y${y}`; hist[k] = (hist[k] || 0) + 1;
});
console.log("floating blocks (outside the plates):", floating, hist);

const res = g.save(OUT);
console.log("saved", OUT, res);
