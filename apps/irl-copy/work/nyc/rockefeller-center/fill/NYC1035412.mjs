// 7 East 47th Street, Midtown: a 1920 seven-storey loft-office on a 25-ft mid-block lot behind a two-storey shopfront.
// Lidar roof (above y 0): front wing 5-6, body 21-24 with the rear penthouse at 23-24. Smoothed into clean tiers:
// front 2 storeys + coping, body 7 storeys with a parapet, a one-storey penthouse, a mechanical bulkhead.
// Facade = brick piers and glazed bays on a limestone storey-line grid; a black tar roof; no interiors beyond an air
// gap behind each glazed bay and one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035412.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const FOOT = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => FOOT.has(key(x, z));
const inBox = (x, z, [x0, x1], [z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

// Faces: 0 north (z-1, the 47th Street front), 1 south (z+1, rear), 2 west (x-1), 3 east (x+1).
const STEP = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const MECH = (x, z) => inBox(x, z, [5, 6], [4, 6]);

// Clean tiers. Body parapet = edge cells, so the outline sits one block above the roof.
function topOf(x, z) {
  if (z <= 1) return 7;
  if (inBox(x, z, [2, 5], [16, 21])) return 24;
  if (MECH(x, z)) return 23;
  const edge = STEP.some(([dx, dz]) => !inF(x + dx, z + dz));
  return edge ? 22 : 21;
}

// Which sides of a column cell at height y face air: the footprint edge, or a neighbour that stops below y.
function exposed(x, y, z) {
  const out = [];
  STEP.forEach(([dx, dz], f) => {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || topOf(nx, nz) <= y) out.push(f);
  });
  return out;
}

const g = new Voxels([8, 36, 26]);
const glass = [];                                    // panes, joined to their neighbours once the facade is placed

// Warm light behind some glazed bays (about one in five), sitting on the storey's floor slab.
const lamp = (x, y, z) => {
  const h = (x * 7 + y * 5 + z * 3) % 5;
  if (h === 0) g.set(x, y, z, "glowstone");
  else if (h === 3) g.set(x, y, z, "shroomlight");
};

const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// A glazed bay: the pane sits in the facade, the air gap behind it (one cell in) is where the lamp goes.
function glaze(x, y, z, f) {
  const [dx, dz] = STEP[f];
  glass.push({ x, y, z, f });
  lamp(x - dx, y, z - dz);
}

function facade(x, y, z, faces, top) {
  const front = z === 0;
  if (front && x === 3 && y === 0) return g.set(x, y, z, "dark_oak_door", doorState("lower"));
  if (front && x === 3 && y === 1) return g.set(x, y, z, "dark_oak_door", doorState("upper"));
  if (front && y === 2) return g.set(x, y, z, "black_concrete");                 // shopfront fascia over the door
  if (front && y === 1) {                                                        // shop glass, piers at the corners
    if ([2, 4, 5, 6].includes(x)) return glaze(x, y, z, 0);
    return g.set(x, y, z, "polished_andesite");
  }
  if (y === 0) return g.set(x, y, z, "polished_andesite");                     // base course
  if (y === top - 1) return g.set(x, y, z, "calcite");                         // coping / cornice
  if (y % 3 === 0) return g.set(x, y, z, "calcite");                           // limestone storey line
  if (MECH(x, z)) return g.set(x, y, z, "bricks");                             // mechanical bulkhead: no windows
  // Fronts and rear run along x: bays at x 2-3 and 5-6 between brick piers at 1, 4 and 7. Sides run along z.
  const bay = faces[0] <= 1 ? [2, 3, 5, 6].includes(x) : [1, 2].includes(z % 4);
  const airBehind = faces.every((f) => {
    const [dx, dz] = STEP[f];
    const ix = x - dx, iz = z - dz;
    return inF(ix, iz) && !exposed(ix, y, iz).length && y < topOf(ix, iz);
  });
  if (bay && airBehind) return glaze(x, y, z, faces[0]);
  return g.set(x, y, z, "bricks");
}

for (const [x, z] of cells) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) {
      if (y === top - 1) g.set(x, y, z, "gray_concrete");                     // tar roof over the interior
      else if (y % 3 === 0) g.set(x, y, z, "smooth_stone");                    // one floor slab per storey
      continue;                                                                // else air: the interior
    }
    facade(x, y, z, faces, top);
  }
}

// Panes join the piers and each other along their own facade plane.
for (const { x, y, z, f } of glass) {
  const sides = f <= 1 ? [["east", 1, 0], ["west", -1, 0]] : [["south", 0, 1], ["north", 0, -1]];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [side, dx, dz] of sides) if (g.get(x + dx, y, z + dz)) state[side] = "true";
  g.set(x, y, z, "glass_pane", state);
}

// Quick structural check: every block has a block under it or beside it (floor slabs rest on the walls).
let loose = 0;
for (let x = 0; x < 8; x++) for (let y = 1; y < 36; y++) for (let z = 0; z < 26; z++) {
  if (!g.get(x, y, z)) continue;
  const below = g.get(x, y - 1, z);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!below && !beside) loose++;
}
console.log(`cells ${cells.length}, top ${Math.max(...cells.map(([x, z]) => topOf(x, z)))}, loose ${loose}`);

console.log(g.save(`${DIR}/NYC1035412.nbt`));
