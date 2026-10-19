// 531 Fifth Avenue, 1927 commercial and office building: a Fifth Avenue office block in the setback manner of its date,
// a limestone-faced (smooth sandstone) mass on a polished granite plinth, with cut-stone band courses every three blocks,
// a chiseled cornice on each roof edge and a tar roof inside. Footprint 39 x 17 (x along the street, low z = north =
// uptown). The lidar roof is quantised into clean flat tiers: a 6-block strip on the east, 9-block wing along the north,
// 15/21/33/45/51-block steps up the west, a 63-block block on the east and the 110-block tower on the south side, with
// a 6-block mechanical penthouse and a copper crown. Windows are light-blue glass in two-block bays between piers,
// each with an air gap behind (no interiors) bounded by the storey's floor slab; warm glowstone sits behind some panes.
// The entrance is recessed in the middle of the north front under a granite canopy, with an iron door and sidelights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035366.cells.json`, "utf8"));
const X = 39, Y = 122, Z = 17;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => raw.has(key(x, z));
const NEIGH8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z = the uptown frontage
const DIR4 = Object.values(DIRS);
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a N/S face
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on an E/W face

// Roof tiers in blocks above y 0 (about 3 blocks a storey). Lidar of 3 or less is noise (a gap in a wing): it takes the
// commonest neighbouring tier.
const tierOf = (r) => (r <= 3 ? null : r <= 8 ? 6 : r <= 12 ? 9 : r <= 17 ? 15 : r <= 27 ? 21 : r <= 38 ? 33 : r <= 46 ? 45 : r <= 56 ? 51 : r < 105 ? 63 : 110);
const mode = (vals) => {
  const n = new Map();
  for (const v of vals) n.set(v, (n.get(v) || 0) + 1);
  let best = null;
  for (const [v, c] of n) if (!best || c > best[1] || (c === best[1] && v > best[0])) best = [v, c];
  return best ? best[0] : null;
};
const around = (x, z) => [[x, z], ...NEIGH8.map(([dx, dz]) => [x + dx, z + dz])].filter(([a, b]) => inFoot(a, b));

const tier0 = new Map();
for (const [k, c] of raw) tier0.set(k, tierOf(c.roof));
const tier1 = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = around(x, z).slice(1).map(([a, b]) => tier0.get(key(a, b))).filter((v) => v != null);
  tier1.set(k, tier0.get(k) ?? mode(near) ?? 9);
}
// One pass of a 3 x 3 majority over the tiers, so each tier is a clean flat top, not a lidar stair.
const top = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  top.set(k, mode(around(x, z).map(([a, b]) => tier1.get(key(a, b)))));
}
const ground = new Map([...raw].map(([k, c]) => [k, c.ground]));

// The penthouse: a 5 x 4 mechanical box on the tower's roof, its foundation the tower roof (y 110).
const PENT = { x0: 14, x1: 18, z0: 12, z1: 15, base: 110, top: 116 };
for (let x = PENT.x0; x <= PENT.x1; x++) for (let z = PENT.z0; z <= PENT.z1; z++) {
  top.set(key(x, z), PENT.top);
  ground.set(key(x, z), PENT.base);
}

const T = (x, z) => (inFoot(x, z) ? top.get(key(x, z)) : 0);
const G = (x, z) => ground.get(key(x, z));
const open = (x, y, z) => !inFoot(x, z) || y >= T(x, z);   // outside the building, or above that cell's roof
// A cell with solid building all round it at height y: the air gap behind a window must not open anywhere.
const deep = (x, y, z) => inFoot(x, z) && T(x, z) > y && DIR4.every(([dx, dz]) => inFoot(x + dx, z + dz) && T(x + dx, z + dz) > y);
const glow = (u, y, face) => (u * 5 + y * 7 + (face === "N" || face === "S" ? 0 : 3)) % 9 === 0;   // sparse warm panes

const g = new Voxels([X, Y, Z]);
const cols = [...raw.keys()].map((k) => k.split(",").map(Number));

const carve = (x, y, z, face, u) => {
  const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
  if (deep(ix, y, iz)) g.set(ix, y, iz, glow(u, y, face) ? "glowstone" : "air");
};
const pane = (face) => (face === "N" || face === "S" ? PANE_NS : PANE_EW);

// 1. Mass: granite foundation from y 0 up to each cell's ground, then the limestone-faced core to its roof.
for (const [x, z] of cols) {
  for (let y = 0; y < G(x, z); y++) g.set(x, y, z, "polished_granite");
  for (let y = G(x, z); y < T(x, z); y++) g.set(x, y, z, "smooth_sandstone");
}

// 2. Faces. The top layer is a cornice on the edge and tar roof inside. Below it: a granite plinth, a shopfront storey
// (granite piers, glass), then storeys of three blocks with a cut-stone band course at the foot of each, and two rows of
// glass in two-block bays between one-block piers. Glass has an air gap behind it (carved in the core, bounded by the
// band course above and below, so each storey has its floor slab).
for (const [x, z] of cols) {
  const t = T(x, z), gr = G(x, z);
  for (let y = gr; y < t; y++) {
    const face = Object.keys(DIRS).find((d) => open(x + DIRS[d][0], y, z + DIRS[d][1])) ?? null;
    if (y === t - 1) { g.set(x, y, z, face ? "chiseled_sandstone" : "gray_concrete"); continue; }
    if (!face) continue;
    const [dx, dz] = DIRS[face];
    const u = dx === 0 ? x : z;   // position along the face
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y < 3) {
      if (u % 3 === 0) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "light_blue_stained_glass_pane", pane(face)); carve(x, y, z, face, u); }
      continue;
    }
    if (y % 3 === 0) { g.set(x, y, z, "cut_sandstone"); continue; }
    if (u % 3 === 0) continue;   // pier: the wall as it is
    g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
    carve(x, y, z, face, u);
  }
}

// 3. Parapets: one block more on every edge that stands above open air or a lower roof.
for (const [x, z] of cols) {
  const t = T(x, z);
  if (DIR4.some(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) < t)) g.set(x, t, z, "smooth_sandstone");
}

// 4. Entrance: the middle of the north front (x 17-19), a vestibule behind the door, iron door, sidelights with a
// glowstone behind one, and a granite canopy over it, standing on the building.
for (let x = 17; x <= 19; x++) for (let y = 1; y <= 2; y++) g.set(x, y, 1, "air");
g.set(18, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(18, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(17, 2, 1, "glowstone");
for (let x = 16; x <= 20; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "polished_granite");

// 5. Crown: a copper cap on the penthouse, a lantern on its peak.
for (let x = 15; x <= 17; x++) for (let z = 13; z <= 14; z++) g.set(x, PENT.top, z, "oxidized_copper");
for (let z = 13; z <= 14; z++) g.set(16, PENT.top + 1, z, "oxidized_copper");
g.set(16, PENT.top + 2, 13, "lantern", { hanging: "false", waterlogged: "false" });

console.log(g.save(`${DIR}/NYC1035366.nbt`));
