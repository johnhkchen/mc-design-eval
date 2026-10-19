// The Supreme Court of the United States (Cass Gilbert, 1935): a white marble ring on a plinth, three storeys of
// windows in pilastered bays, a flat roof with a penthouse, and the east front (toward the Capitol) recessed behind
// a colonnade with the doors. The lidar roof gives three flat tiers (9, 11, 13 blocks) with setbacks; each cell
// stands on its foundation, each floor is a slab, and the inside is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87508.cells.json`, "utf8"));

const MARBLE = "quartz_block", TRIM = "smooth_quartz", PILASTER = "quartz_pillar";
const GLASS = "glass_pane", FOUNDATION = "stone_bricks";
const SLABS = [1, 5, 9];                // solid floor slabs: the ground floor on the plinth, then storeys two and three
const WINDOWS = [2, 3, 6, 7, 10, 11];   // two glass rows per storey; rows 4 and 8 are the header bands
const HEADERS = [4, 8];
const ENTRANCE_Z = [15, 21], DOOR_Z = 18;

const key = (x, z) => `${x},${z}`;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Lidar roof -> three flat tiers, then a 3x3 mode so one noisy cell does not notch the massing.
const tierOf = (roof) => (roof >= 12 ? 13 : roof >= 10 ? 11 : 9);
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, tier: tierOf(roof), top: 0 }]));
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = cell.get(key(x + dx, z + dz));
    if (n) votes.set(n.tier, (votes.get(n.tier) ?? 0) + 1);
  }
  c.top = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

// Faces that look out: no footprint cell beyond, or a lower tier beyond (the step of a setback). Any change of
// tier or a missing neighbour makes the cell a wall; interior cells are air between the slabs.
const outside = (x, z, top) => DIRS.filter(([dx, dz]) => { const n = cell.get(key(x + dx, z + dz)); return !n || n.top < top; });
const walled = (x, z, top) => DIRS.filter(([dx, dz]) => { const n = cell.get(key(x + dx, z + dz)); return !n || n.top !== top; });

const g = new Voxels([40, 25, 39]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const lights = [];

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const { ground, top } = c;
  const out = outside(x, z, top), walls = walled(x, z, top);
  const edge = walls.length > 0;
  const face = out[0];                                  // a window's face; along it runs the bay
  const along = face && face[0] !== 0 ? z : x;
  const entrance = x === 39 && z >= ENTRANCE_Z[0] && z <= ENTRANCE_Z[1];

  for (let y = 0; y < top; y++) {
    if (y < ground || y === 0) { put(x, y, z, FOUNDATION); continue; }
    if (y === top - 1) { put(x, y, z, TRIM); continue; }                 // cornice / roof slab
    if (SLABS.includes(y)) { put(x, y, z, edge ? TRIM : MARBLE); continue; }
    if (!edge) continue;                                                 // interior air behind the glass
    if (HEADERS.includes(y)) { put(x, y, z, TRIM); continue; }
    if (!WINDOWS.includes(y) || out.length === 0) { put(x, y, z, MARBLE); continue; }
    if (entrance) {
      if (y <= 3 && z === DOOR_Z) continue;                              // door set below
      if (y <= 3 && (z === ENTRANCE_Z[0] || z === ENTRANCE_Z[1] || z === DOOR_Z - 1 || z === DOOR_Z + 1)) { put(x, y, z, PILASTER); continue; }
    }
    if (out.length > 1 || along % 3 === 0) { put(x, y, z, PILASTER); continue; }
    put(x, y, z, GLASS);
    // Warm light in the air gap behind some panes: lanterns on the ground floor, glowstone on the second.
    const [dx, dz] = face, ix = x - dx, iz = z - dz;
    const inner = cell.get(key(ix, iz));
    if (inner && inner.top === top && walled(ix, iz, top).length === 0) {
      if (y === 2 && along % 6 === 1) lights.push([ix, 2, iz, "lantern", { hanging: "false" }]);
      if (y === 6 && along % 6 === 4) lights.push([ix, 6, iz, "glowstone"]);
    }
  }
}

// The door: iron, two halves, facing west out of the east front.
put(39, 2, DOOR_Z, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(39, 3, DOOR_Z, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const [x, y, z, block, state] of lights) put(x, y, z, block, state);

// Penthouse on the main tier's roof: a marble box with a glass band, stood on the cornice.
for (let x = 15; x <= 24; x++) for (let z = 15; z <= 19; z++) {
  const c = cell.get(key(x, z));
  if (!c || c.top !== 13) continue;
  put(x, 13, z, MARBLE);
  put(x, 14, z, TRIM);
}

const { blocks, palette } = g.save(`${DIR}/DC87508.nbt`);
console.log(`DC87508: ${cells.length} cells, ${blocks} blocks, ${palette} palette entries`);
