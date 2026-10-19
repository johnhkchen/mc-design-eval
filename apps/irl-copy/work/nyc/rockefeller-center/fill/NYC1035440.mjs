// 33 East 48th Street, 1968 commercial and office building: a 153-block (about 170 m) International Style office slab
// on a stepped mass, in bronze-tinted glass and aluminium with light-grey spandrels, the way Midtown's 1960s towers
// were clad after the 1961 setback code. Footprint 53 x 42 (low z = north = the 48th Street frontage, along x).
// Lidar tiers, smoothed: a 57-block wing along the east half of the lot, a 146-block setback across the middle of the
// tower, and a 152-block main shaft on the street side. The lidar reads the west strip and the east edge at roof 1, so
// they are a paved deck at grade, not a storey. Lidar's 114 at the east edge is noise and joins the 57 wing.
// Facade: polished-granite base and a granite band at y 3, shopfront glass at y 1-2 with a double iron door and a black
// canopy at x 20-21, then 3-block storeys: a light-grey spandrel at every floor line, aluminium mullions every third
// column, glass between. Glass is one block out from air, and the interior is air except one floor plate per storey and
// a solid lift core, so no room is hollow behind a pane. Warm glowstone sits behind some panes on storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035440.cells.json`, "utf8"));
const X = 53, Y = 165, Z = 42;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const tier = (r) => (r <= 1 ? 1 : r < 144 ? 57 : r < 150 ? 146 : 152);     // lidar roof -> smoothed tier height
const roofAt = (x, z) => (inFoot(x, z) ? tier(cell.get(`${x},${z}`).roof) : 0);
const cols = cells.map(([x, z, ground]) => [x, z, ground]);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on a N/S face
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on an E/W face
const GLASS = "gray_stained_glass_pane", SHOP = "glass_pane", MULLION = "iron_block", SPANDREL = "light_gray_concrete";
const BASE = "polished_granite", FOUND = "stone_bricks", CORE = "light_gray_concrete", DECK = "gray_concrete";
const core = (x, z) => x >= 20 && x <= 27 && z >= 14 && z <= 21;      // solid lift and stair core, ground to roof

// A cell is open at height y when it is outside the footprint or its roof is at or below y.
const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// A roof edge: a neighbour whose roof is lower than this cell's top.
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const g = new Voxels([X, Y, Z]);
const lit = [];

// 1. Foundation, base course and structure. Every cell is solid from y 0 up to its top; the storeys are air except the
// floor plates (one per storey, on the line y = 3k), the core and the face. Low cells are a paved deck at grade.
for (const [x, z, ground] of cols) {
  const top = roofAt(x, z);
  if (top <= 1) { for (let y = 0; y < ground; y++) g.set(x, y, z, y === 0 ? BASE : FOUND); g.set(x, ground, z, "smooth_stone"); continue; }
  for (let y = 0; y < top; y++) {
    if (y < ground || y === 0) { g.set(x, y, z, y === 0 ? BASE : FOUND); continue; }
    if (y === top - 1) { g.set(x, y, z, DECK); continue; }
    if (faceOf(x, y, z)) continue;                                       // the face is set below
    if (core(x, z)) g.set(x, y, z, CORE);
    else if (y % 3 === 0 || y === 56 || y === 145) g.set(x, y, z, SPANDREL);   // a floor plate per storey, and under the 57 and 146 setbacks so the taller walls stand on them
  }
}

// 2. Faces. Base course at y 0, granite band at y 3, cornice three blocks under the top. Above the ground floor each
// storey is a spandrel at its floor line and glass between aluminium mullions every third column.
for (const [x, z, ground] of cols) {
  const top = roofAt(x, z);
  if (top <= 1) continue;
  for (let y = 1; y < top - 1; y++) {
    if (y < ground) continue;
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                          // position along the face
    if (y === top - 3 || y === 3) { g.set(x, y, z, BASE); continue; }
    if (y % 3 === 0) { g.set(x, y, z, SPANDREL); continue; }
    if (u % 3 === 0) { g.set(x, y, z, MULLION); continue; }
    const pane = y <= 2 ? SHOP : GLASS;
    g.set(x, y, z, pane, dz !== 0 ? PANE_NS : PANE_EW);
    // Warm light: one glass bay in some on a storey line, the air behind the pane lit by a glowstone on its floor plate.
    const ix = x - dx, iz = z - dz;
    if (y % 3 === 1 && y >= 4 && (x * 7 + y * 3 + z * 11) % 11 === 0 && inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz)) lit.push([ix, y, iz]);
  }
}
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

// 3. Street entrance on the 48th Street face (x 20-21, z 0): a double iron door, a vestibule, and a black canopy
// three blocks up on the floor plate, with two lanterns hanging from it.
g.set(20, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(20, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(21, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(21, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [20, 21]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 19; x <= 22; x++) for (let z = 0; z <= 2; z++) g.set(x, 4, z, "black_concrete");
for (const x of [19, 22]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a granite half slab on the edge of each roof, standing on the deck below it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (top > 1 && edgeAt(x, z, top)) g.set(x, top, z, "polished_granite_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: a solid plant room on the main shaft (x 14-22, z 3-8) with a granite cap, two plant boxes on the wing roof,
// and lanterns on the cap corners so the roof reads from the street at dusk.
for (let x = 14; x <= 22; x++) for (let z = 3; z <= 8; z++) for (let y = 152; y <= 154; y++) g.set(x, y, z, SPANDREL);
for (let x = 14; x <= 22; x++) for (let z = 3; z <= 8; z++) g.set(x, 155, z, BASE);
for (const [x, z] of [[14, 3], [22, 8]]) g.set(x, 156, z, "lantern", { hanging: "false", waterlogged: "false" });
for (let x = 40; x <= 42; x++) for (const z of [16, 17, 18]) for (const y of [57, 58]) g.set(x, y, z, "light_gray_concrete");

const stats = g.save(`${DIR}/NYC1035440.nbt`);

// Check: every block sits on something: a solid block below, or beside it on the same course (the floor plates and the
// core carry each other). Count any block with neither, so a stray or hanging block shows up.
let loose = 0;
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, z] of cols) for (let y = 1; y < Y; y++) {
  if (!solid(x, y, z)) continue;
  const below = solid(x, y - 1, z);
  const beside = solid(x + 1, y, z) || solid(x - 1, y, z) || solid(x, y, z + 1) || solid(x, y, z - 1);
  if (!below && !beside) loose++;
}
const maxRoof = Math.max(...cols.map(([x, z]) => roofAt(x, z)));
console.log(JSON.stringify({ cells: cols.length, maxRoofBlock: maxRoof, loose, ...stats }));
