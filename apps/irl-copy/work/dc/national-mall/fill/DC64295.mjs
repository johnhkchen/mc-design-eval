// DC64295: a 1930s Classical Revival office block in pale limestone (the Federal Triangle idiom): four storeys on a
// podium, with a five-storey core stepped back from every edge. Cells are [x, z, ground, roof]; the lidar roof is
// median-smoothed and split into two tiers (12 podium, 15 core). The interior is air behind 1-block walls, with a
// floor slab per storey, so the glass shows an air gap rather than a filled volume.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64295.cells.json", "utf8"));

const X = 10, Z = 22, Y = 27;
const WALL = "calcite", BASE = "stone_bricks", BAND = "polished_diorite", GLASS = "glass_pane", LIGHT = "glowstone";
const TIER_PODIUM = 12, TIER_CORE = 15, STOREY = 3;
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };   // N = z-1 is the front (z = 0)

// footprint: lidar roof per cell
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFp = (x, z) => roof.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

// 3x3 median of the lidar roof over the footprint (lidar noise out), then two tiers: the core at the high reading
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) v.push(roof.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const top = new Map(cells.map(([x, z]) => [key(x, z), median(x, z) >= 13.5 ? TIER_CORE : TIER_PODIUM]));
const T = (x, z) => top.get(key(x, z));

// setback: a core cell on the core's edge steps down to the podium tier, so the core stands back from every edge
for (const [x, z] of cells) {
  if (T(x, z) !== TIER_CORE) continue;
  const edge = Object.values(DIRS).some(([dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) !== TIER_CORE);
  if (edge) top.set(key(x, z), TIER_PODIUM);
}

// exposed sides: a neighbour off the footprint, or lower than this column (the wall shows above it)
const exposed = (x, z) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z)).map(([d]) => d);

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const isStoreyLine = (y) => y > 0 && y % STOREY === 0;

// the facade reads as a grid: along a face, odd bays are windows and even bays are piers; corners are piers
const windowBay = (x, z, face) => (face === "W" || face === "E" ? z : x) % 2 === 1;

// warm light: every few windows, a glowing block just inside the glass
const lit = (x, y, z) => (x * 3 + z * 5 + y) % 7 === 0;

for (const [x, z] of cells) {
  const t = T(x, z), ex = exposed(x, z), outer = ex.length > 0;
  const corner = ex.some((d) => d === "W" || d === "E") && ex.some((d) => d === "N" || d === "S");
  const face = ex[0];

  set(x, 0, z, BASE);                                                    // base course and ground floor
  for (let y = 1; y < t; y++) {
    if (y === t - 1) { set(x, y, z, BASE); continue; }                   // parapet on the outer walls, roof cap inside
    if (outer && y === t - 2) { set(x, y, z, BAND); continue; }          // cornice course under the parapet
    if (isStoreyLine(y)) { set(x, y, z, BAND); continue; }               // floor slab / string course
    if (!outer) continue;                                                // interior: air behind the glass
    if (corner) { set(x, y, z, BASE); continue; }                        // rusticated quoins at the corners
    if (!windowBay(x, z, face)) { set(x, y, z, WALL); continue; }
    // the front ground floor is a shopfront: glass in every bay bar the entrance
    if (face === "N" && y < STOREY) { if (x !== 5) set(x, y, z, GLASS); continue; }
    set(x, y, z, GLASS);
    const [dx, dz] = DIRS[face].map((v) => -v);                          // inward: opposite the exposed face
    if (lit(x, y, z) && inFp(x + dx, z + dz) && exposed(x + dx, z + dz).length === 0) set(x + dx, y, z + dz, LIGHT);
  }
}

// entrance: a dark oak door in the centre bay of the front, with stone jambs at the bays either side
set(5, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(5, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
set(4, 1, 0, BAND); set(4, 2, 0, BAND);
set(6, 1, 0, BAND); set(6, 2, 0, BAND);

// terrace planters on the podium roof, between the core and the parapet
for (const [x, z] of cells) {
  if (T(x, z) !== TIER_PODIUM || exposed(x, z).length) continue;
  const nextToCore = Object.values(DIRS).some(([dx, dz]) => inFp(x + dx, z + dz) && T(x + dx, z + dz) === TIER_CORE);
  if (nextToCore && (x + z) % 3 === 0) set(x, TIER_PODIUM, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

// roof plant on the core: a box every other cell, clear of the parapet
for (const [x, z] of cells) {
  if (T(x, z) !== TIER_CORE || exposed(x, z).length) continue;
  if (x % 2 === 0 && z % 2 === 0) set(x, TIER_CORE, z, "light_gray_concrete");
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64295.nbt");
console.log(JSON.stringify(res));
