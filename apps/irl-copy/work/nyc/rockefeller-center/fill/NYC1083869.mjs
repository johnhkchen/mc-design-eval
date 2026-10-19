// 57 East 52nd Street, Park Avenue Plaza, 1980 commercial and office tower: a dark bronze-glass curtain-wall office
// tower of about 53 storeys (lidar roof 161 blocks, about 179 m) on a low granite-and-stone podium. Footprint 63 x 56
// (x across the front, low z = north = the 52nd Street frontage). The lidar roof is read as four clean tiers, not cell by
// cell: a 2-storey podium (lidar under 12), a 10-storey wing (12-39), the tower at 157, a 153 setback ring and a 161
// crown over the core at the centre-west of the lot. A 3-cell majority pass removes single noisy cells.
// Storeys are 3 blocks, floors on y = 3, 6, 9 ... for every cell, so tiers meet on one grid. Each cell's column is
// solid from y 0 to its ground (stone foundation), then a polished-granite plinth to y 3. Above the plinth the building
// is a one-block shell: a light-grey spandrel band on each floor, dark bronze glass between black mullions every third
// column, clear glass shopfronts on the first storey, and a parapet on each roof. Behind some windows a glowstone sits
// in the air gap. Interiors are air except the floor slabs. The entrance is a notch in the plinth on the 52nd Street
// frontage, under the first-floor slab, with an iron door, glass either side and a hanging lantern. Roof plant: 2x2x2
// mechanical boxes on the flat tower roof. Lidar roof 0 (open ground) is paved at its ground level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1083869.cells.json`, "utf8"));
const X = 63, Y = 173, Z = 56;

const ground = new Map();
const lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(`${x},${z}`, gr); lidar.set(`${x},${z}`, roof); }
const inFoot = (x, z) => ground.has(`${x},${z}`);

// Lidar roof to a clean tier (block height above y 0). 0 = open ground.
const tierOf = (r) => (r === 0 ? 0 : r < 12 ? 6 : r < 40 ? 30 : r < 150 ? 90 : r < 156 ? 153 : r < 159 ? 157 : 161);
const tier = new Map();
for (const [k, r] of lidar) tier.set(k, tierOf(r));

// One majority pass over the 8 neighbours inside the footprint: a built cell takes a tier that most of its neighbours share.
const raw = (x, z) => tier.get(`${x},${z}`) ?? 0;
const smooth = new Map();
for (const [k, own] of tier) {
  const [x, z] = k.split(",").map(Number);
  let best = own, bestN = 0;
  const counts = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz || !inFoot(x + dx, z + dz)) continue;
    const v = raw(x + dx, z + dz);
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  const ownN = counts.get(own) || 0;
  bestN = ownN;
  if (own !== 0) for (const [v, n] of counts) if (v !== 0 && n >= 5 && n > bestN) { best = v; bestN = n; }
  smooth.set(k, best);
}
const topOf = (x, z) => smooth.get(`${x},${z}`) ?? 0;   // outside the footprint, or open ground: 0

// Faces that look onto open air at height y (outside the footprint, or a neighbour roofed lower than y).
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const openFaces = (x, z, y) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);
const isFacade = (x, z, y) => topOf(x, z) > y && openFaces(x, z, y).length > 0;

// The 52nd Street frontage (low z): the longest run of tower-height cells on that edge, and its middle bay is the entrance.
let runStart = 0, runLen = 0, bestStart = 0, bestLen = 0;
for (let x = 0; x < X; x++) {
  if (topOf(x, 0) >= 150) { if (!runLen) runStart = x; runLen++; if (runLen > bestLen) { bestLen = runLen; bestStart = runStart; } }
  else runLen = 0;
}
const doorX = bestStart + Math.floor(bestLen / 2);

const lit = (u, y) => (u * 5 + y * 7) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);

// 1. Foundations, plinth, shell and floors.
for (const [x, z, gr] of cells) {
  const T = topOf(x, z);
  if (!T) {                                             // open ground: stone fill to grade, paved at its ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, gr, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < 3; y++) g.set(x, y, z, y < gr ? "stone_bricks" : "polished_granite");   // foundation, then plinth
  for (let y = 3; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // roof and parapet cap
    const faces = openFaces(x, z, y);
    if (!faces.length) { if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete"); continue; }   // interior: floor slabs only
    const [dx, dz] = faces[0];
    const u = dx === 0 ? x : z;                             // position along the face
    if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete");       // spandrel band / floor line
    else if (y < 6) g.set(x, y, z, "glass");                       // clear shopfront glass, first storey
    else if (u % 3 === 0) g.set(x, y, z, "black_concrete");        // mullion
    else g.set(x, y, z, "gray_stained_glass");                     // dark bronze glass
  }
}

// 2. Warm glowstone one block inside some windows, in the air gap, on the floor slab below.
for (const [x, z] of cells) {
  const T = topOf(x, z);
  for (let y = 4; y < T - 1; y++) {
    if (y % 3 === 0 || !isFacade(x, z, y)) continue;
    const [dx, dz] = openFaces(x, z, y)[0];
    const u = dx === 0 ? x : z;
    if (y < 6 || u % 3 === 0 || !lit(u, y)) continue;
    const ix = x - dx, iz = z - dz;                          // the cell behind this pane
    if (inFoot(ix, iz) && topOf(ix, iz) > y && !isFacade(ix, iz, y)) g.set(ix, y, iz, "glowstone");
  }
}

// 3. Entrance on the 52nd Street frontage: plinth notched out in front of the lobby, iron door, glass either side.
for (let dx = -1; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) for (let y = 1; y <= 2; y++) g.set(doorX + dx, y, dz, "air");
for (const dx of [-1, 1]) for (let y = 1; y <= 2; y++) g.set(doorX + dx, y, 0, "glass");
const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(doorX, 1, 0, "iron_door", { ...doorState, half: "lower" });
g.set(doorX, 2, 0, "iron_door", { ...doorState, half: "upper" });
g.set(doorX, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });   // under the first-floor slab

// 4. Roof plant: 2x2x2 mechanical boxes on the flat tower roof where four cells share the 157 tier.
let plant = 0;
for (let x = 3; x + 1 < X; x += 8) for (let z = 3; z + 1 < Z; z += 8) {
  const four = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!four.every(([cx, cz]) => topOf(cx, cz) === 157)) continue;
  for (const [cx, cz] of four) for (let y = 157; y <= 158; y++) g.set(cx, y, cz, "smooth_quartz");
  plant++;
}

const res = g.save(`${DIR}/NYC1083869.nbt`);
console.log(JSON.stringify({ doorX, plant, ...res }));
