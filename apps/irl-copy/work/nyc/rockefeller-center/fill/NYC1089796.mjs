// 135 West 45th Street, 2009 commercial and office building: a 160-block (about 178 m, roughly 53 storeys) glass office
// tower on a 12-block base (four storeys of granite and limestone) with shopfronts on the 45th Street frontage (high z).
// Footprint 26 x 15 (x along the street, low z = north, high z = the 45th Street front).
// Massing: the lidar roof is smoothed (3x3 median over the cells that have a roof, holes filled from neighbours) and
// snapped to four tiers: 160 tower, 158 crown (the centre), 155 shoulders and the 149 lower wing along the street (z 12-14).
// The tower is a curtain wall of blue-green glass in light-grey spandrels with iron mullions every third column; the glass
// sits one block out from a solid core, with air behind it (recess) and a slab in each storey (no interiors). The base
// has clear glass between limestone storey lines and polished pilasters. The lobby is a double door under a black canopy
// with two hanging lanterns. A plant room stands on the crown, two plant boxes on the tower roof and two on the wing roof.
// Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1089796.cells.json`, "utf8"));
const X = 26, Y = 172, Z = 15;
const BASE = 12;   // four storeys of 3 blocks

const raw = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const groundAt = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
const inFoot = (x, z) => raw.has(`${x},${z}`);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Roof tiers: lidar smoothed by the 3x3 median of its nonzero neighbours, then snapped to the nearest tier.
const TIERS = [149, 155, 158, 160];
const snap = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const tops = new Map();
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = raw.get(`${x + dx},${z + dz}`); if (v > 0) vals.push(v);
  }
  tops.set(key, vals.length ? snap(med(vals)) : 149);
}
const roofAt = (x, z) => (inFoot(x, z) ? tops.get(`${x},${z}`) : 0);
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const cols = cells.map(([x, z]) => [x, z]);
const g = new Voxels([X, Y, Z]);

// Outward faces: N = low z, S = high z (the 45th Street front), W/E = the ends. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const GLASS = "light_blue_stained_glass_pane";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// A cell is open at height y when it is outside the footprint, unbuilt, or its roof is at or below y.
const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

// 1. Solid mass: foundation from y 0 up to each cell's ground, the core to the roof, a roof-deck course on each top.
for (const [x, z] of cols) {
  const top = roofAt(x, z), ground = groundAt.get(`${x},${z}`);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "light_gray_concrete" : y < BASE ? "smooth_stone" : "gray_concrete");
}

// 2. Faces. Base (y < 12): granite course at y 0, limestone storey lines every third block, polished pilasters every third
// column, clear glass between. Tower and wing: light-grey spandrels at every third block, iron mullions every third column,
// blue-green glass in the bays. A smooth-stone cornice on the top course of each face. Lit panes are set after the faces.
const recesses = [];
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const base = y < BASE;
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, base ? "calcite" : "light_gray_concrete"); continue; }
    if (u % 3 === 0) { g.set(x, y, z, base ? "polished_andesite" : "iron_block"); continue; }
    g.set(x, y, z, base ? "glass_pane" : GLASS, dx === 0 ? NS : EW);   // clear shopfront glass; blue-green tower glass
    const ix = x - dx, iz = z - dz;                   // one block in, behind the pane
    const deep = inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : d === "W" ? 3 : 4)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Lobby on the 45th Street front (high z): a double iron door at x 12-13 under a black canopy at y 4 (x 10-15),
// standing on the solid wall behind it. A one-block vestibule behind the doors, two hanging lanterns in its ceiling.
g.set(12, 1, 14, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(12, 2, 14, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(13, 1, 14, "iron_door", { facing: "south", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(13, 2, 14, "iron_door", { facing: "south", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let x = 11; x <= 14; x++) for (let y = 1; y <= 3; y++) g.set(x, y, 13, "air");
for (let x = 10; x <= 15; x++) { g.set(x, 4, 14, "black_concrete"); g.set(x, 4, 13, "smooth_stone"); }
for (const x of [12, 13]) g.set(x, 3, 13, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a bottom slab on the edge of each roof, standing on the roof course below it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (top && edgeAt(x, z, top)) g.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Plant room on the crown: a box of four blocks over the centre, a glass band in its walls, a cap of smooth stone.
for (let x = 10; x <= 15; x++) for (let z = 2; z <= 8; z++) {
  const t = roofAt(x, z);
  if (!t) continue;
  const ring = x === 10 || x === 15 || z === 2 || z === 8;
  for (let y = t; y < t + 4; y++) {
    const band = ring && (y === t + 1 || y === t + 2);
    if (band) g.set(x, y, z, GLASS, x === 10 || x === 15 ? EW : NS);
    else g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, t + 4, z, "smooth_stone");
  if (ring && (x + z) % 4 === 0) g.set(x, t + 1, z, "glowstone");
}

// 6. Roof plant: two plant boxes on the tower roof (2 high) and two on the wing roof, each standing on its roof course.
for (const [x, z] of [[19, 5], [20, 5]]) if (roofAt(x, z) === 160) { g.set(x, 160, z, "light_gray_concrete"); g.set(x, 161, z, "light_gray_concrete"); }
for (const [x, z] of [[4, 13], [5, 13]]) if (roofAt(x, z) === 149) { g.set(x, 149, z, "light_gray_concrete"); g.set(x, 150, z, "light_gray_concrete"); }

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }

const stats = g.save(`${DIR}/NYC1089796.nbt`);
const tierCounts = {};
for (const [x, z] of cols) tierCounts[roofAt(x, z)] = (tierCounts[roofAt(x, z)] || 0) + 1;
console.log(JSON.stringify({ cells: cols.length, tiers: tierCounts, meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
