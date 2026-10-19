// DC73587: a 1980s-style commercial office block at 601 New Jersey Avenue NW, read from the lidar record. A five-storey
// core (roof 16 above its lowest ground) with a four-storey wing (14) around it, the lidar's 15s smoothed into the core.
// Pale smooth-quartz spandrels and quartz-pillar mullions carry the window grid; blue-tinted glass fills every bay between
// them, with an air gap behind each pane and a glowstone lamp in some of those gaps. A polished granite base course runs
// round the foot, a smooth-quartz cornice caps each tier, and the north face has a recessed glazed entrance with a lintel
// over it. The core carries a light-grey plant room with iron-grille louvres.
//
// Storeys are three blocks on an absolute rhythm (spandrel at y = 0, 3, 6 ...; two glass rows between), so the core and
// the wing line up. Each column fills from y 0 up to its tier as solid mass (the foundation is the building itself, as
// every lowest ground here is 0), and the glass bays are the only places the shell is open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73587.cells.json`, "utf8"));
const W = 20, D = 33, H = 20;

const key = (x, z) => `${x},${z}`;
const roofOf = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => roofOf.has(key(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// Tiers: the wing's 14 and the core's 16 (the lidar's 15s are core noise, and 11s on the south edge are wing noise).
const TIERS = [11, 14, 16];
const nearestTier = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) <= Math.abs(best - r) ? t : best));

// Lidar noise: a cell whose footprint neighbours (three or four) all sit in another tier takes that tier.
const base = new Map(cells.map(([x, z, , r]) => [key(x, z), nearestTier(r)]));
const TIER = new Map();
for (const [k, t] of base) {
  const [x, z] = k.split(",").map(Number);
  const counts = new Map();
  for (const [dx, dz] of DIRS) {
    const v = base.get(key(x + dx, z + dz));
    if (v !== undefined) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let adopt = t;
  for (const [v, n] of counts) if (v !== t && n >= 3) adopt = v;
  TIER.set(k, adopt);
}

// Outward faces of a footprint cell: [name, outward dx, dz, position along the face].
const exposedFaces = (x, z) => {
  const out = [];
  if (!inF(x, z - 1)) out.push(["N", 0, -1, x]);
  if (!inF(x, z + 1)) out.push(["S", 0, 1, x]);
  if (!inF(x - 1, z)) out.push(["W", -1, 0, z]);
  if (!inF(x + 1, z)) out.push(["E", 1, 0, z]);
  return out;
};

const v = new Voxels([W, H, D]);
const SPANDREL = "smooth_quartz", PIER = { block: "quartz_pillar", state: { axis: "y" } };
const GLASS = "light_blue_stained_glass", BASE = "polished_granite", ROOF = "stone", CORE_PLANT = "light_gray_concrete";
const airCells = [];

// Solid mass per column up to its tier, roof membrane on the top course, then the exposed faces.
for (const [k, T] of TIER) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);
  for (let y = 0; y < T; y++) {
    const top = y === T - 1;
    if (faces.length === 0) {                              // interior: solid, roof membrane on top
      v.set(x, y, z, top ? ROOF : SPANDREL);
      continue;
    }
    if (y === 0) { v.set(x, y, z, BASE); continue; }       // granite base course round the foot
    v.set(x, y, z, SPANDREL);                              // cornice, storey spandrels, and the wall plane the bays cut into
  }
}

// Window bays on each exposed face: piers every third block, glass between, one air block behind each pane.
for (const [k, T] of TIER) {
  const [x, z] = k.split(",").map(Number);
  for (const [, dx, dz, p] of exposedFaces(x, z)) {
    for (let y = 1; y < T - 1; y++) {
      if (y % 3 === 0) continue;                           // spandrel row stays
      const pier = p % 3 === 0;
      // North entrance: a glazed recess two blocks in from the face, at the centre of the north front.
      const entrance = dz === -1 && y <= 2 && x >= 8 && x <= 11;
      if (entrance) continue;                              // handled below, after the bays
      if (pier) { v.set(x, y, z, PIER.block, PIER.state); continue; }
      v.set(x, y, z, GLASS);
      const ix = x - dx, iz = z - dz;                      // the cell behind the pane
      if (inF(ix, iz)) airCells.push([ix, y, iz, x, z, y]);
    }
  }
}

// North entrance: the recess (z 0, x 8..11, y 0..2) is open; the doors are glass at z 1, mullions at x 8 and 11, and
// the room behind the doors (z 2) is air with glowstone lamps, so the lobby glows from the street.
for (let x = 8; x <= 11; x++) for (let y = 0; y <= 2; y++) {
  if (!inF(x, 0)) continue;
  v.set(x, y, 0, "air");
  if (!inF(x, 1)) continue;
  if (x === 8 || x === 11) v.set(x, y, 1, PIER.block, PIER.state);
  else v.set(x, y, 1, GLASS);
  if (inF(x, 2)) v.set(x, y, 2, "air");
}
for (const x of [9, 10]) if (inF(x, 2)) v.set(x, 1, 2, "glowstone");
// Lintel over the entrance: a smooth-quartz band at storey line y = 3 across the recess, one block out (z 0..1).
for (let x = 7; x <= 12; x++) for (const z of [0, 1]) if (inF(x, z)) v.set(x, 3, z, SPANDREL);

// Air behind glass, then warm lamps in some of those gaps (upper glass row of each storey, staggered).
for (const [ix, y, iz] of airCells) v.set(ix, y, iz, "air");
for (const [ix, y, iz, x, z] of airCells) {
  if (y % 3 === 2 && (x * 3 + z * 5 + y) % 13 === 0) v.set(ix, y, iz, "glowstone");
}

// Roof plant on the core: a light-grey plant room with iron-grille louvres on its faces.
for (const [k, T] of TIER) {
  if (T !== 16) continue;
  const [x, z] = k.split(",").map(Number);
  if (x < 7 || x > 12 || z < 12 || z > 19) continue;
  const edge = x === 7 || x === 12 || z === 12 || z === 19;
  for (let y = 16; y <= 17; y++) {
    if (y === 17) v.set(x, y, z, CORE_PLANT);
    else v.set(x, y, z, edge && (x + z + y) % 2 === 0 ? "iron_bars" : CORE_PLANT);
  }
}

// Plant on the wing's roof: two light-grey units, each a block high.
for (const [k, T] of TIER) {
  if (T !== 14) continue;
  const [x, z] = k.split(",").map(Number);
  if (((x >= 14 && x <= 15 && z >= 2 && z <= 3) || (x >= 4 && x <= 5 && z >= 24 && z <= 25))) v.set(x, 14, z, CORE_PLANT);
}

const res = v.save(`${DIR}/DC73587.nbt`);
console.log("saved", res);
