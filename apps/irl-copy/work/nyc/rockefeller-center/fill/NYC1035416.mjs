// 15 East 47th Street, 1930 commercial and office building: a narrow 7 x 26 Midtown lot (about 8 m of street front) with a
// two-storey stone base on the street and a buff-stone office body of about 20 blocks (six or so storeys) rising behind
// it, a 22-block rear crown and a stepped Deco pinnacle with a lightning rod. Footprint x 0..6 across, z 0..25 back from
// the 47th Street front at low z (north). The lidar roof is read as clean tiers: a 6-block street base (rows z 0-2, the
// lidar has no return on rows 1-2 and the row-0 readings are 4-7, so the whole strip is one flat base), a 20-block body,
// and a 22-block crown over x 0-3 (z 13-16) and x 0-5 (z 17-20). Ground is 0 everywhere, so there is no foundation.
// Storey lines every three blocks in limestone (calcite), a granite base course, windows in two-block bays between calcite
// piers on the street and rear faces; the side walls are blind party walls with a pilaster every six blocks. The street front has a black
// marquee over a centred iron door, two hanging lanterns and shop glass either side. Glowstone sits behind some panes.
// Solid core with an air gap behind each pane (no interiors). Roof: a water tower on a stone platform, the crown
// pinnacle, parapet slabs on every roof edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035416.cells.json`, "utf8"));
const X = 7, Y = 26, Z = 26;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Roof tiers (block heights above y 0), smoothed from the lidar. Outside the footprint is 0 (nothing there).
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (z <= 2) return 6;                                                                // street base
  if (z >= 13 && z <= 20 && (x <= 3 || (z >= 17 && x <= 5))) return 22;                 // rear crown
  return 20;                                                                           // office body
};
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = the 47th Street front (low z)
const NUM = { N: 1, S: 2, W: 3, E: 4 };
const open = (x, y, z) => roofAt(x, z) <= y;
const facesOf = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z

const cols = cells.map(([x, z]) => [x, z]);
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: foundation from y 0 to each cell's ground (none here), core to the roof, a smooth stone roof cover.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "smooth_stone" : "smooth_sandstone");
}

// 2. Faces. Granite base course at y 0, calcite cornice on the top course, storey bands every third block, calcite piers
// every third column, two-block window bays between them. The side walls (E and W) are blind: sandstone with pilasters
// and storey bands. Each pane has an air gap behind it (or a glowstone for the warm ones).
const recesses = [];
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const faces = facesOf(x, y, z);
    if (!faces.length) continue;
    const d = faces[0], [dx, dz] = DIRS[d];                    // corners: the street or rear face wins over the side
    const u = dx === 0 ? x : z;                                 // position along the face
    if (y === top - 1) { g.set(x, y, z, "calcite"); continue; }   // cornice
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (dx !== 0) { g.set(x, y, z, y % 3 === 0 || u % 6 === 0 ? "calcite" : "smooth_sandstone"); continue; }   // blind side wall
    if (y % 3 === 0 || u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", dx === 0 ? NS : EW);
    const ix = x - dx, iz = z - dz;                             // one block in, behind the pane
    if (inFoot(ix, iz) && roofAt(ix, iz) > y && !facesOf(ix, y, iz).length) recesses.push([ix, y, iz, lit(u, y, NUM[d])]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Street entrance (x 3, low z): a centred iron door in a black marquee, shop glass either side (x 1, 2, 4, 5) with
// lanterns hanging under the marquee at x 2 and x 4. Its vestibule is air behind the door. Every block stands on a
// course below it: the door on the granite base, the marquee on the calcite band, the lanterns on the marquee.
g.set(3, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const y of [1, 2]) g.set(3, y, 1, "air");
for (const x of [2, 3, 4]) g.set(x, 3, 0, "black_concrete");
for (const x of [2, 4]) g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a bottom slab on every roof edge, standing on the cornice or roof cover beneath it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (edgeAt(x, z, top)) g.set(x, top, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: a calcite pinnacle on the crown (x 1-2, z 15-16, two blocks tall) with a lightning rod, and a water tower on a
// stone platform on the body roof (x 3-5, z 8-10): a cross-shaped wooden tank three high with a cap.
for (const x of [1, 2]) for (const z of [15, 16]) for (const y of [22, 23]) g.set(x, y, z, "calcite");
g.set(1, 24, 15, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (let x = 3; x <= 5; x++) for (let z = 8; z <= 10; z++) g.set(x, 20, z, "stone_bricks");
const tank = [[4, 8], [3, 9], [4, 9], [5, 9], [4, 10]];
for (const [x, z] of tank) for (let y = 21; y <= 23; y++) g.set(x, y, z, "spruce_planks");
g.set(4, 24, 9, "spruce_planks");

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }

const stats = g.save(`${DIR}/NYC1035416.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMaxBlock: Math.max(...cols.map(([x, z]) => roofAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
