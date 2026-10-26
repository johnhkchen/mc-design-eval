// 1512 Corcoran St NW: a 1910s-20s Dupont Circle brick walk-up, three storeys over a stone plinth, with a
// smooth-stone string course at each floor line, a quartz cornice, a stair bulkhead and a chimney on the roof.
// Shell: the footprint's edge cells are a one-block wall; the interior cells are air with a floor slab per storey,
// so every glazed opening has an air gap behind it. Roof: lidar heights median-filtered into flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55661.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inFoot = (x, z) => byKey.has(k(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar roof -> clean tiers: each cell takes the median of itself and its footprint neighbours (kills the 7/8 noise)
const tier = new Map();
for (const [x, z, , r] of cells) {
  const vals = [r, ...NB.filter(([dx, dz]) => inFoot(x + dx, z + dz)).map(([dx, dz]) => byKey.get(k(x + dx, z + dz)).r)]
    .sort((a, b) => a - b);
  tier.set(k(x, z), vals[vals.length >> 1]);
}

// Which sides of a cell face the street or the lot line (no neighbour in the footprint)
const outward = (x, z) => ({ N: !inFoot(x, z - 1), S: !inFoot(x, z + 1), W: !inFoot(x - 1, z), E: !inFoot(x + 1, z) });
const ext = (x, z) => Object.values(outward(x, z)).some(Boolean);

// The window face of an exterior cell: N/S faces take windows in the middle four columns, E/W faces in the middle five rows;
// corners and the ends of each face are brick piers.
function wallFace(x, z) {
  const f = outward(x, z);
  if ((f.N || f.S) && x >= 1 && x <= 4) return f.N ? "N" : "S";
  if ((f.E || f.W) && z >= 1 && z <= 5) return f.E ? "E" : "W";
  return null;
}

// Glass pane states: the pane runs along its wall and joins the neighbouring panes or piers in the same plane
function pane(face, x, z) {
  const join = (dx, dz) => (inFoot(x + dx, z + dz) ? "true" : "false");
  if (face === "N" || face === "S") return { north: "false", south: "false", east: join(1, 0), west: join(-1, 0) };
  return { north: join(0, -1), south: join(0, 1), east: "false", west: "false" };
}

const DOOR = [2, 0];                 // the street entrance, centre of the north face
const DOOR_STATE = { facing: "south", hinge: "left", open: "false", powered: "false" };

// The block list for one cell at one height (null = air). Layers: 0 plinth, 1-2 ground-floor glazing (2 high),
// 3 string course, 4 second-floor glazing, 5 string course, 6 third-floor glazing, 7 cornice (roof-7 cells stop at 6).
function blocksAt(x, z, y) {
  const { g } = byKey.get(k(x, z));
  const cap = tier.get(k(x, z)) - 1;
  if (y < g) return [{ name: "stone_bricks" }];                       // foundation fill from y 0 up to the ground
  if (y > cap) return null;
  if (y === cap) return [{ name: ext(x, z) ? "smooth_quartz" : "stone" }];   // cornice on the shell, roof slab inside
  if (!ext(x, z)) return (y === 0 || y === 3 || y === 5) ? [{ name: "stone" }] : null;   // interior: floor slabs only
  if (y === 0) return [{ name: "stone_bricks" }];
  if (y === 3 || y === 5) return [{ name: "smooth_quartz" }];
  if ([x, z].join() === DOOR.join() && (y === 1 || y === 2)) {
    return [{ name: "dark_oak_door", state: { ...DOOR_STATE, half: y === 1 ? "lower" : "upper" } }];
  }
  const face = wallFace(x, z);
  if (!face) return [{ name: "bricks" }];
  // a warm window in about one of every nine: glowstone set in the glazing, so the street reads lit at dusk
  if ((3 * x + 5 * z + y) % 9 === 0) return [{ name: "glowstone" }];
  return [{ name: "glass_pane", state: pane(face, x, z) }];
}

const g = new Voxels([6, 20, 7]);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = 0; y <= 12; y++) {
    const b = blocksAt(x, z, y);
    if (b) g.set(x, y, z, b[0].name, b[0].state);
  }
}

// Roof plant: a stair bulkhead on the two north-east roof cells, and a brick chimney stack
for (const [x, z] of [[2, 4], [3, 4]]) {
  if (tier.get(k(x, z)) !== 8) throw new Error(`bulkhead cell ${x},${z} is not on the roof-8 tier`);
  g.set(x, 8, z, "bricks"); g.set(x, 9, z, "bricks"); g.set(x, 10, z, "smooth_quartz");
}
if (tier.get(k(1, 4)) !== 8) throw new Error("chimney cell 1,4 is not on the roof-8 tier");
for (const y of [8, 9, 10]) g.set(1, y, 4, "bricks");

// Sanity: every exterior wall block rests on a filled block below it (interior floor slabs are held by the walls).
let floating = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!ext(x, z)) continue;
  for (let y = 1; y <= 12; y++) {
    if (g.get(x, y, z) && !g.get(x, y - 1, z)) floating++;
  }
}
if (floating) console.warn(`${floating} exterior blocks without support below`);

const counts = g.save(`${DIR}/DC55661.nbt`);
console.log(`DC55661.nbt: ${counts.blocks} blocks, ${counts.palette} palette entries`);
