// 44 East 50th Street, a Transportation & Utility building of about 1935: a brick-and-limestone block of six clean tiers
// (lidar 0-24 blocks, about 27 m) with a copper-capped corner tower at the south-east. Footprint 21 x 27; low z is north,
// the 50th Street frontage, with the entrance at x 6. The lidar roof is read as flat tiers, not followed cell by cell:
// 6 (the south utility wing, iron grilles in place of glass), 11, 13 (north band), 15, 17 (main block, two vent boxes on
// its roof) and 24 (the copper-capped tower). Lidar holes inside the building take the lowest tier around them, and
// open ground is paved. The core is solid brick and each window is a glass pane with an air pocket behind it, one block
// deep, bounded by the storey floors; some pockets hold a glowstone. Piers every third block, limestone spandrels at
// every storey line, polished granite plinth, calcite cornice. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035459.cells.json`, "utf8"));
const X = 21, Y = 26, Z = 27;

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);

// Lidar roof -> flat tier (block height above y 0). 0 = open ground.
const TIERS = [[7, 6], [11, 11], [13, 13], [16, 15], [18, 17], [99, 24]];
const tierOfLidar = (r) => (r <= 0 ? 0 : TIERS.find(([max]) => r <= max)[1]);
const tier = new Map();
for (const [key, { roof }] of lidar) tier.set(key, tierOfLidar(roof));
// Lidar holes inside the footprint (no return on a roof that is there) take the lowest tier of their neighbours.
const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const [key] of lidar) {
  if (tier.get(key)) continue;
  const [x, z] = key.split(",").map(Number);
  const around = NEIGH.map(([dx, dz]) => tier.get(`${x + dx},${z + dz}`) ?? 0).filter((t) => t > 0);
  if (around.length >= 3) tier.set(key, Math.min(...around));
}
const T = (x, z) => tier.get(`${x},${z}`) ?? 0;
const G = (x, z) => lidar.get(`${x},${z}`)?.ground ?? 0;
// A face is exposed where the neighbour is outside the footprint, open ground, or lower than this block.
const open = (x, y, z) => T(x, z) <= y;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z

const g = new Voxels([X, Y, Z]);
const cols = [...lidar.keys()].map((k) => k.split(",").map(Number));

// 1. Solid core: foundation from y 0 to each cell's ground, brick to the tier top with a roof covering on top.
// Open footprint cells are paved at their ground level.
for (const [x, z] of cols) {
  const t = T(x, z), gr = G(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!t) { g.set(x, gr, z, "stone_bricks"); continue; }
  for (let y = gr; y < t; y++) g.set(x, y, z, y === t - 1 ? (t === 24 ? "waxed_oxidized_copper" : "smooth_stone") : "bricks");
}

// 2. Faces. Plinth at y 0, a limestone spandrel at each storey line (y 3, 6, ...), brick piers every third block,
// glass panes between them, a calcite cornice on each tier's top (copper on the tower). The south wing (tier 6) is
// utility work: iron grilles instead of glass.
const glassFaces = [];
for (const [x, z] of cols) {
  const t = T(x, z);
  if (!t) continue;
  for (let y = G(x, z); y < t; y++) {
    for (const [d, [dx, dz]] of Object.entries(DIRS)) {
      if (!open(x + dx, y, z + dz)) continue;
      const u = dx === 0 ? x : z;                       // position along the face
      const at = (block, state) => g.set(x, y, z, block, state);
      if (y === t - 1) { at(t === 24 ? "waxed_oxidized_copper" : "calcite"); continue; }
      if (y === 0) { at("polished_granite"); continue; }
      if (y % 3 === 0) { at("smooth_stone"); continue; }
      if (u % 3 === 0) { at("bricks"); continue; }
      if (t === 6) { at("iron_bars", dx === 0 ? NS : EW); continue; }
      at("glass_pane", dx === 0 ? NS : EW);
      glassFaces.push({ x, y, z, dx, dz, u });
    }
  }
}

// 3. Entrance on 50th Street: a door in the pier at x 6 with a smooth stone lintel, a recessed vestibule behind it
// (air at y 0-2, one block in) and a hanging lantern under the storey floor.
g.set(6, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 0, "smooth_stone");
for (let y = 0; y < 2; y++) g.set(6, y, 1, "air");
g.set(6, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Window pockets: each glass pane gets one air block behind it (the core stays solid around it), so the glass is
// set into a recess. Some pockets hold a glowstone. Only where the core behind is at least two blocks deep.
for (const { x, y, z, dx, dz, u } of glassFaces) {
  const ix = x - dx, iz = z - dz, ix2 = x - 2 * dx, iz2 = z - 2 * dz;
  if (!T(ix, iz) || T(ix, iz) <= y || !T(ix2, iz2) || T(ix2, iz2) <= y) continue;
  if (((u + 2 * y + x + z) % 13) === 0) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}

// 5. Roof equipment on the 17 tier: two vent boxes standing on the roof covering, with an iron grille on top.
for (const [x, z] of [[3, 8], [4, 8], [3, 9], [4, 9], [9, 19], [10, 19]]) {
  if (T(x, z) !== 17) continue;
  g.set(x, 17, z, "light_gray_concrete");
  g.set(x, 18, z, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
}

g.save(`${DIR}/NYC1035459.nbt`);
