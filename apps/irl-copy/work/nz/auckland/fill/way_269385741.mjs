// Datavault Auckland (OSM way 269385741): a 1980s office block in Auckland's volcanic basalt and pale concrete, glazed in
// blue-green. Plan: a 17-block main slab with a 19-block crown tower on its podium, 12- and 8-block wings. Each column is
// solid from y 0 up to its roof, so every storey and tier stands on the one below. Between the floor slabs the shell is
// hollow: an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_269385741.cells.json`, "utf8"));   // [x, z, ground, roof]
const [W, H, D] = [52, 32, 57];

// lidar roof heights to flat tiers: wings 8, mid 12, main slab 17, crown 19 (noise smoothed out)
const tier = (r) => (r >= 18 ? 19 : r >= 15 ? 17 : r >= 11 ? 12 : 8);

const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, t: tier(r) });
const at = (x, z) => col.get(`${x},${z}`);
const T = (x, z) => at(x, z)?.t ?? 0;

// faces a cell at height y shows to air: the outside of the footprint, or a lower neighbour's roof
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz) || y >= T(x + dx, z + dz));

// materials
const FOUND = "stone", PLINTH = "polished_blackstone_bricks", SLAB = "smooth_stone", DECK = "light_gray_concrete";
const SPAND = "white_concrete", FIN = "light_gray_concrete", SHOP = "cyan_stained_glass", PANE = "cyan_stained_glass_pane";
const TRIM = "smooth_stone";

// a pane runs along the wall: a face normal to x runs along z, so it connects north and south
const paneState = (dir) => {
  const alongZ = dir[0] !== 0;
  return { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" };
};

// the main entrance: the east face of the main slab on the ground, at the middle of its run
const at2 = [...col.entries()].map(([k, v]) => ({ x: +k.split(",")[0], z: +k.split(",")[1], ...v }));
const eastEdge = at2.filter((c) => c.t === 17 && c.g === 0 && !at(c.x + 1, c.z)).sort((a, b) => a.z - b.z);
const DOOR = eastEdge.length ? eastEdge[eastEdge.length >> 1] : null;
const doorState = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

// roof plant boxes on the main slab: 2x2 footprints a cell clear of any other tier and of the walls
const plant = new Set();
for (let x = 3; x < W - 4; x += 6) for (let z = 3; z < D - 4; z += 6) {
  let ok = true;
  for (let dx = -1; dx <= 2 && ok; dx++) for (let dz = -1; dz <= 2 && ok; dz++) if (T(x + dx, z + dz) !== 17 || (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1 && exposed(x + dx, z + dz, 16).length)) ok = false;
  if (ok) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) plant.add(`${x + dx},${z + dz}`);
}

// what a cell holds at (x, y, z); null is air
function block(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { g, t } = c;
  if (plant.has(`${x},${z}`) && (y === t || y === t + 1)) return [DECK];          // roof plant on the main slab
  if (y === t && exposed(x, z, t - 1).length) return [TRIM];                       // parapet on the outer edge
  if (y === t + 1 && t === 19 && exposed(x, z, t - 1).length > 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
  if (y >= t) return null;
  if (DOOR && x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) return ["iron_door", doorState(y === 1 ? "lower" : "upper")];
  if (y < g) return exposed(x, z, y).length ? [PLINTH] : [FOUND];                 // foundation under the ground
  if (y === t - 1) return [exposed(x, z, y).length ? TRIM : DECK];                  // roof deck, cornice on the edge
  if (y === 0) return [exposed(x, z, y).length ? PLINTH : DECK];                   // base course
  const ex = exposed(x, z, y);
  if (y % 4 === 0) return [ex.length ? TRIM : DECK];                               // floor slab, a storey line on the face
  if (!ex.length) return null;                                                     // interior: air behind the glass
  if (y % 4 === 3) return [y < 4 ? TRIM : SPAND];                                  // head band / spandrel
  const dir = ex[0];
  const u = dir[0] !== 0 ? z : x;
  if (ex.length > 1 || u % 3 === 0) return [FIN];                                  // mullion or corner
  if (y < 4) return [SHOP];                                                        // ground-storey shopfront
  return [PANE, paneState(dir)];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => g.set(x, y, z, b[0], b[1]);

for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = block(x, z, y); if (b) put(x, y, z, b); }
}

// warm light: a lantern or glowstone just inside some window, on the storey's floor slab (row 1 of each storey)
let lit = 0;
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 1; y < c.t - 1; y += 4) {
    const ex = exposed(x, z, y);
    const face = block(x, z, y)?.[0];
    if (ex.length !== 1 || (face !== PANE && face !== SHOP)) continue;
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    const ix = x - ex[0][0], iz = z - ex[0][1];
    if (!at(ix, iz) || block(ix, iz, y) || block(ix, iz, y - 1) === null) continue;
    put(ix, y, iz, (x + z + y) % 2 ? ["lantern", { hanging: "false", waterlogged: "false" }] : ["glowstone"]);
    lit++;
  }
}

// crown corners carry lanterns on their parapets
for (const [k, c] of col) if (c.t === 19) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z, 18).length > 1) put(x, 20, z, ["lantern", { hanging: "false", waterlogged: "false" }]);
}

// entrance: a porch lintel is the head band; the iron door sits at the floor
if (DOOR) put(DOOR.x, 1, DOOR.z, ["iron_door", doorState("lower")]), put(DOOR.x, 2, DOOR.z, ["iron_door", doorState("upper")]);

const info = g.save(`${HERE}/way_269385741.nbt`);
console.log(JSON.stringify({ footprint: cells.length, lit, door: DOOR, ...info }));
