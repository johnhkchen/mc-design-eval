// 400 Madison Avenue, 1929 NYC individual landmark, a commercial and office building: a setback Art Deco office block
// in cream terracotta piers and light-grey spandrels on a polished granite base. Footprint 12 x 51 (x across the block,
// high x = east = the Madison Avenue frontage, low z = north). Lidar roof heights are quantised into five flat setback
// tiers (46, 52, 61, 67, 76 blocks), so the tall west half rises from the low 52-block street wall and the 46-block
// north and south ends. Each tier is a solid column from y 0 to its top, so nothing floats. A 4 x 5 block penthouse
// stands on the 76 tier. Window bays sit recessed one block behind terracotta piers (relief by construction), with a
// glass pane one block in, an air gap behind it, and warm glowstone in some bays. Floor slabs and spandrel bands mark
// every third block. The Madison entrance is a recessed vestibule under a dark canopy. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035420.cells.json`, "utf8"));
const X = 12, Z = 51, Y = 82;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof -> flat setback tier (block heights above y 0). 0 = nothing built (outside the footprint).
const tierOf = (r) => (r <= 47 ? 46 : r <= 56 ? 52 : r <= 65 ? 61 : r <= 70 ? 67 : 76);
const roofAt = (x, z) => (inFoot(x, z) ? tierOf(cell.get(`${x},${z}`).roof) : 0);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// The penthouse: a 4 x 5 block mechanical room on the 76 tier, set back from the tier's edges.
const PH = { x0: 1, x1: 4, z0: 19, z1: 23 };
const penthouse = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1 && roofAt(x, z) === 76;

// Outward directions. N = low z, S = high z, W = low x, E = high x (Madison).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const open = (x, y, z) => roofAt(x, z) <= y;                       // outside the footprint or below this tier's top
const facesOf = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });
const along = (d, x, z) => (d === "E" || d === "W" ? z : x);       // position along the face
const onRim = (x, z, d) => { const [dx, dz] = DIRS[d]; return !inFoot(x + dx, z + dz); };   // the outer wall, not a setback
const corner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);

// Pane connections: a pane on an east/west face joins its neighbours along z; on a north/south face, along x.
const PANE = {
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  N: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  S: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
};
const PANEBLOCK = "light_blue_stained_glass_pane";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;       // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);

// Materials: cream terracotta piers, light-grey spandrels, polished granite base, quartz cornices, grey roofs.
const CORE = "stone_bricks", PIER = "white_terracotta", BAND = "smooth_quartz", SLAB = "light_gray_concrete";
const BASE = "polished_granite", ROOF = "gray_concrete", CANOPY = "black_concrete";

// 1. Solid massing: every tier is a column from y 0 to its top (the foundation under the ground line, the core, floor
// slabs every third block, and a roof on each top). Nothing is set above a tier, so no course floats.
for (const [x, z] of cols) {
  const top = roofAt(x, z), { ground } = cell.get(`${x},${z}`);
  for (let y = 0; y < top; y++) {
    let b = CORE;
    if (y < ground) b = BASE;                                       // foundation under the ground line
    else if (y === top - 1) b = facesOf(x, y, z).length ? BAND : ROOF;
    else if (y % 3 === 0) b = SLAB;
    g.set(x, y, z, b);
  }
}

// 2. Faces. Bands at y 0 (base) and every third block above (spandrels); piers at every third column; windows between.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top - 1; y++) {
    const fs = facesOf(x, y, z);
    if (!fs.length) continue;
    if (y % 3 === 0) { g.set(x, y, z, y === 0 ? BASE : BAND); continue; }
    if (fs.some((d) => along(d, x, z) % 3 === 0) || corner(x, z)) { g.set(x, y, z, PIER); continue; }
    const rim = fs.filter((d) => onRim(x, z, d));
    if (!rim.length) { g.set(x, y, z, PANEBLOCK, PANE[fs[0]]); continue; }   // setback: flush pane
    // Rim window: recessed one block (air), glass one block in, an air gap behind it, a warm light in some bays.
    g.set(x, y, z, "air");
    for (const d of rim) {
      const [dx, dz] = DIRS[d];
      g.set(x - dx, y, z - dz, PANEBLOCK, PANE[d]);
      g.set(x - 2 * dx, y, z - 2 * dz, lit(along(d, x, z), y, top) ? "glowstone" : "air");
    }
  }
}

// 3. Madison entrance: a recessed vestibule in the middle of the east face (z 22-26), a door at z 24 on a granite
// back wall, glass either side, and a dark canopy over the recess held by the piers at its ends.
for (let z = 22; z <= 26; z++) {
  g.set(11, 1, z, "air"); g.set(11, 2, z, "air");
  g.set(9, 1, z, "air"); g.set(9, 2, z, "air");
  g.set(10, 1, z, BASE); g.set(10, 2, z, BASE);
  if (z !== 24) { g.set(10, 1, z, PANEBLOCK, PANE.E); g.set(10, 2, z, PANEBLOCK, PANE.E); }
  for (let zz = 21; zz <= 27; zz++) { g.set(11, 3, zz, CANOPY); g.set(10, 3, zz, CANOPY); }
}
const door = (y, half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });
g.set(11, 1, 24, "iron_door", door(1, "lower"));
g.set(11, 2, 24, "iron_door", door(2, "upper"));
for (const [x, z] of cols) if (x === 11 && z >= 21 && z <= 27) g.set(x, 4, z, CORE);

// 4. The roof: a penthouse on the 76 tier, glass in its middle band, and a quartz roof cap.
for (const [x, z] of cols) {
  if (!penthouse(x, z)) continue;
  for (let y = 76; y < 80; y++) {
    const b = y === 79 ? BAND : y === 77 ? "light_blue_stained_glass" : PIER;
    g.set(x, y, z, b);
  }
}

const out = `${DIR}/NYC1035420.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}`);
