// Market Place North Phase I Condominium (1982), on 1st Ave at the east edge of Pike Place Market: four storeys of
// brick over a granite base, 22 blocks to the roof (about 5 per storey), with a cornice, a parapet and a coping at
// the top. The ground storey is a dark-oak-framed shopfront band on every face, with a glazed residential lobby on the
// 1st Ave (east) face under a green canopy and two lanterns. Upper storeys: a cream sill and punched windows in
// 3-block bays between 2-block brick piers, the glass set one block back in a recess, with a stone string course at
// every storey line. The U-plan opens north onto a light court, so its inner faces are facades too. Its roof is flat
// stone with a spruce-decked terrace and azalea planters on the east wing, two plant boxes and a stair bulkhead.
// Interiors are hollow: a floor slab per storey, air behind the glass, sea lanterns, glowstone and shroomlight in some
// windows. Each footprint cell is filled from y 0 to its own ground, so the west wing shows four storeys and the east
// wing (on the rising ground) shows two plus the parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${HERE}/SEA1270135285.cells.json`, "utf8"));   // [x, z, ground] per footprint cell

const W = 52, D = 41, H = 34;
const FLOORS = [5, 10, 15, 20];                  // storey lines, absolute y
const DECK = 21, CORNICE = 21, PARAPET = 22, COPING = 23;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const TERRACE = { x0: 39, x1: 46, z0: 9, z1: 13 };
const BOX = { x0: 8, x1: 10, z0: 3, z1: 5 };
const BULK = { x0: 13, x1: 16, z0: 33, z1: 35 };
const OUT = `${HERE}/SEA1270135285.nbt`;

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(k(x, z), g);
const gAt = (x, z) => ground.get(k(x, z));       // undefined outside the footprint

// Cells from outside the footprint: 1 = outer face, 2 = second layer (window recesses), 3+ = interior.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) if (NB.some(([dx, dz]) => gAt(x + dx, z + dz) === undefined)) { dist.set(k(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(k(x, z));
  for (const [dx, dz] of NB) {
    const key = k(x + dx, z + dz);
    if (gAt(x + dx, z + dz) !== undefined && !dist.has(key)) { dist.set(key, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const ringAt = (x, z) => Math.min(dist.get(k(x, z)) ?? 0, 3);

// A face cell's facade: the outward direction, whether it sits on a corner, and its position along the wall (z on
// east/west faces, x on north/south faces). Ring 2 looks at the ring-1 cell in front of it.
function facade(x, z) {
  const r = ringAt(x, z);
  const dirs = r === 1 ? NB.filter(([dx, dz]) => gAt(x + dx, z + dz) === undefined)
    : r === 2 ? NB.filter(([dx, dz]) => ringAt(x + dx, z + dz) === 1) : [];
  if (!dirs.length) return null;
  const ew = dirs.some(([dx]) => dx !== 0), ns = dirs.some(([, dz]) => dz !== 0);
  return { u: ew ? z : x, corner: ew && ns, ew, out: dirs[0] };
}
const bay = (u) => [1, 2, 3].includes(u % 5);     // 3-block windows between 2-block piers

const inBox = (x, z) => x >= BOX.x0 && x <= BOX.x1 && z >= BOX.z0 && z <= BOX.z1;
const inBulk = (x, z) => x >= BULK.x0 && x <= BULK.x1 && z >= BULK.z0 && z <= BULK.z1;
const inTerrace = (x, z) => x >= TERRACE.x0 && x <= TERRACE.x1 && z >= TERRACE.z0 && z <= TERRACE.z1;
const terraceEdge = (x, z) => inTerrace(x, z) && (x === TERRACE.x0 || x === TERRACE.x1 || z === TERRACE.z0 || z === TERRACE.z1);

// The storey line under y (or the ground), so a sill sits one block above it.
const below = (G, y) => Math.max(G, ...FLOORS.filter((F) => F < y));

// The block for one cell at one height, as [name, state] or null for air.
function blockAt(x, z, y, r, G, f) {
  if (y < G) return ["stone_bricks"];                                  // foundation under the cell
  if (r === 3) {                                                       // interior: floor slabs, deck, roof plant
    if (FLOORS.includes(y)) return ["smooth_stone"];
    if (y === DECK) return inTerrace(x, z) ? ["spruce_planks"] : ["stone"];
    if (y === PARAPET && terraceEdge(x, z)) return ["iron_bars", { waterlogged: "false" }];
    if (y === PARAPET && inTerrace(x, z) && x % 3 === 1) return ["azalea_leaves", { distance: "1", persistent: "true", waterlogged: "false" }];
    if ((y === PARAPET || y === COPING) && inBox(x, z)) return ["light_gray_concrete"];
    if ((y === PARAPET || y === COPING) && inBulk(x, z)) return ["stone_bricks"];
    if (y === COPING + 1 && inBulk(x, z)) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
    return null;
  }
  if (y === G) return ["polished_granite"];                            // base course
  if (y === CORNICE) return ["smooth_stone"];
  if (y === PARAPET) return r === 1 ? ["stone_bricks"] : null;
  if (y === COPING) return r === 1 ? ["stone_brick_slab", { type: "bottom", waterlogged: "false" }] : null;
  if (FLOORS.includes(y)) return ["smooth_stone"];                     // string course
  const shop = below(G, y) === G;                                      // the ground storey: a shopfront band
  if (!f || f.corner) return ["bricks"];
  if (y === below(G, y) + 1) return shop ? ["polished_granite"] : [bay(f.u) ? "white_concrete" : "bricks"];
  if (!bay(f.u)) return shop ? ["dark_oak_log", { axis: "y" }] : ["bricks"];
  return r === 1 ? null : ["glass_pane"];                              // ring 1 is the recess, ring 2 the glass
}

const vox = new Voxels([W, H, D]);
const panes = [], bars = [];
for (const [x, z, G] of cells) {
  const r = ringAt(x, z), f = facade(x, z);
  for (let y = 0; y <= COPING + 1; y++) {
    const b = blockAt(x, z, y, r, G, f);
    if (!b) continue;
    if (b[0] === "glass_pane") panes.push([x, y, z, f.ew ? "ew" : "ns"]);
    if (b[0] === "iron_bars") bars.push([x, y, z]);
    vox.set(x, y, z, b[0], b[1]);
  }
}

// Warm light behind some of the glass: the interior cell straight in from a ring-2 window, middle row of each storey.
const LAMPS = { 0: "glowstone", 4: "sea_lantern", 7: "shroomlight" };   // about a third of the middle-row windows
for (const [x, y, z] of panes) {
  const f = facade(x, z);
  const inX = x - f.out[0], inZ = z - f.out[1];
  const h = (x * 7 + z * 13 + y * 5) % 9;
  const shop = below(gAt(x, z), y) === gAt(x, z);
  if (ringAt(inX, inZ) !== 3 || FLOORS.includes(y)) continue;
  if (shop) { if (y === gAt(x, z) + 2) vox.set(inX, y, inZ, "sea_lantern"); continue; }   // the shopfronts glow at dusk
  if (!(h in LAMPS) || y !== below(gAt(x, z), y) + 2) continue;
  vox.set(inX, y, inZ, LAMPS[h]);
}

// The lobby on the 1st Ave face: the east face nearest to z 20 where five ring-1 cells line up, with a door in the
// middle, a three-wide glazed vestibule, a green canopy over it and a lantern at each side.
const eastOuter = (x, z) => ringAt(x, z) === 1 && gAt(x + 1, z) === undefined;
let entrance = null;
for (const z0 of [20, 19, 21, 18, 22, 17, 23, 16, 24]) {
  for (let x = 0; x < W && !entrance; x++) {
    if (!eastOuter(x, z0)) continue;
    if ([-2, -1, 1, 2].every((dz) => eastOuter(x, z0 + dz))) entrance = { x, z0 };
  }
  if (entrance) break;
}
if (!entrance) throw new Error("no straight east face for the lobby");
{
  const { x, z0 } = entrance, G = gAt(x, z0);
  for (const dz of [-1, 1]) for (const y of [G + 1, G + 2]) {
    vox.set(x, y, z0 + dz, "air");                                    // the vestibule: open either side of the door
    vox.set(x - 1, y, z0 + dz, "air");
  }
  vox.set(x - 1, G + 1, z0, "air"); vox.set(x - 1, G + 2, z0, "air");  // lobby behind the door
  vox.set(x, G + 1, z0, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(x, G + 2, z0, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dz = -2; dz <= 2; dz++) vox.set(x, G + 3, z0 + dz, "green_concrete");
  for (const dz of [-2, 2]) vox.set(x, G + 2, z0 + dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Panes and bars join the neighbours they touch in the plane of their wall (the glass runs along the face).
const link = (x, y, z, axis) => {
  const at = (dx, dz) => vox.get(x + dx, y, z + dz) !== null;
  const ew = axis === "ew";
  return {
    east: String(ew ? false : at(1, 0)), west: String(ew ? false : at(-1, 0)),
    north: String(ew ? at(0, -1) : false), south: String(ew ? at(0, 1) : false),
    waterlogged: "false",
  };
};
for (const [x, y, z, axis] of panes) vox.set(x, y, z, "glass_pane", link(x, y, z, axis));
for (const [x, y, z] of bars) {
  const at = (dx, dz) => vox.get(x + dx, y, z + dz) !== null;
  vox.set(x, y, z, "iron_bars", { east: String(at(1, 0)), west: String(at(-1, 0)), north: String(at(0, -1)), south: String(at(0, 1)), waterlogged: "false" });
}

const stats = vox.save(OUT);
console.log(JSON.stringify({ out: OUT, ...stats }));
