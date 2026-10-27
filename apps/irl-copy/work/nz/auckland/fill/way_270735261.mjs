// Way 270735261: a three-storey interwar brick commercial block (red brick walls, cream plaster string courses and
// cornice, basalt plinth and shopfront pilasters, timber shopfront door), set on the footprint's slope. Massing follows
// the lidar roof (11-13 above y 0) smoothed to three flat storeys (roof surface at 12) with the 13 core as a plant
// room. The wall is solid with a one-cell air pocket behind every glazed bay (glowstone behind some); floors are the
// solid storey lines, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735261.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, g, r] of cells) F.set(key(x, z), { g, r });
const inF = (x, z) => F.has(key(x, z));
// outward unit normals of a footprint cell (the sides where the neighbour is off the footprint)
const outward = (x, z) => {
  const n = [];
  if (!inF(x, z - 1)) n.push([0, -1]);
  if (!inF(x, z + 1)) n.push([0, 1]);
  if (!inF(x - 1, z)) n.push([-1, 0]);
  if (!inF(x + 1, z)) n.push([1, 0]);
  return n;
};

const ROOF = 12;            // roof surface: solid body tops out at y 11, parapet at y 12 (lidar 12-13)
const STRING = [4, 8];      // storey lines (cream), 4 blocks per storey
const DOOR = { x: 7, z: 0, facing: "south" };   // the street-side entrance: the north face, 1 block above y 1 plinth

// the glazed rows: the ground storey (above the plinth, below the first line) and the two upper storeys' bays
const glazedRow = (y, g) => (y > g && y < STRING[0]) || y === 5 || y === 6 || y === 9 || y === 10;

// the one-cell air pocket behind a glazed bay: its inward cell (interior) at the same height
const pockets = new Set();
const bays = [];    // { x, y, z, lit, face } for each glazed bay
for (const [kk, { g }] of F) {
  const [x, z] = kk.split(",").map(Number);
  // the face to glaze: the first outward side with room behind it (a stepped corner glazes its open side)
  const face = outward(x, z).find(([nx, nz]) => {
    const along = nx !== 0 ? z : x;
    return along % 3 !== 0 && inF(x - nx, z - nz) && !outward(x - nx, z - nz).length;
  });
  if (!face) continue;                                 // piers, corners with no room, and the stepped edge stay solid
  const [nx, nz] = face;
  const ix = x - nx, iz = z - nz;
  const along = nx !== 0 ? z : x;
  for (let y = 0; y < ROOF; y++) {
    if (y < g || !glazedRow(y, g)) continue;
    if (x === DOOR.x && z === DOOR.z && (y === g + 1 || y === g + 2)) continue;   // the door's cells
    // shopfronts lit all along the street; above, a sparse few so the warm windows read as a pattern, not noise
    const lit = (y < STRING[0]) ? true : (along + y) % 8 === 1;
    bays.push({ x, y, z, lit, ix, iz });
    pockets.add(`${ix},${y},${iz}`);
  }
}
// the entrance's foyer: the interior cell behind the door is air too
for (const y of [2, 3]) pockets.add(`${DOOR.x},${y},${DOOR.z + 1}`);

const g = new Voxels([23, 26, 22]);
const FILL = "stone", BODY = "bricks", PIER = "polished_andesite", PLINTH = "polished_andesite";
const CORNICE = "smooth_quartz", ROOFS = "smooth_stone", PLANT = "light_gray_concrete", GLASS = "glass";

for (const [kk, { g: gr, r }] of F) {
  const [x, z] = kk.split(",").map(Number);
  const out = outward(x, z);
  const edge = out.length > 0;
  for (let y = 0; y < ROOF; y++) {
    if (pockets.has(`${x},${y},${z}`)) continue;          // air behind glass
    if (!edge) {                                            // interior: solid fill, roof cap on top
      g.set(x, y, z, y === ROOF - 1 ? ROOFS : FILL);
      continue;
    }
    if (y < gr) { g.set(x, y, z, FILL); continue; }         // foundation under the sloping ground
    const bay = bays.find((b) => b.x === x && b.y === y && b.z === z);
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }    // basalt plinth course
    if (y === 11) { g.set(x, y, z, CORNICE); continue; }   // cornice course
    if (STRING.includes(y)) { g.set(x, y, z, CORNICE); continue; }
    if (x === DOOR.x && z === DOOR.z && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: DOOR.facing, half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (bay) {
      g.set(x, y, z, GLASS);
      continue;
    }
    g.set(x, y, z, y < STRING[0] && y > gr ? PIER : BODY);
  }
}

// parapet on the perimeter, plant room on the 13 core (interior)
for (const [kk, { r }] of F) {
  const [x, z] = kk.split(",").map(Number);
  if (outward(x, z).length) g.set(x, ROOF, z, BODY);
  else if (r >= 13) g.set(x, ROOF, z, PLANT);
}

// warm light: the lit bays get glowstone in the pocket behind the glass
for (const b of bays) if (b.lit) g.set(b.ix, b.y, b.iz, "glowstone");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735261.nbt");
console.log(JSON.stringify({ footprint: cells.length, bays: bays.length, lit: bays.filter((b) => b.lit).length, ...info }));
