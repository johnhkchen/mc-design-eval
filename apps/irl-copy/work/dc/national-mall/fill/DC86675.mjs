// DC86675: a 1930s stripped-classical office block of Indiana limestone on the Federal Triangle side of the Mall.
// Six storeys of 3 blocks (the lidar's 18) on a 1-block plinth, a 2-block penthouse on the 7x9 core (lidar 20),
// and a 1-storey colonnaded wing on the east (lidar 3). Walls are a 1-block shell; interiors are air behind the
// glass, with a solid floor or deck per storey. Lamps sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86675.cells.json", "utf8"));
const W = 18, H = 32, D = 14;
const WING_TOP = 3, MAIN_TOP = 18, PENT_TOP = 20;

// footprint: [x, z, ground, roof] per cell
const foot = new Map();
for (const [x, z, G, R] of cells) foot.set(`${x},${z}`, { G, R });
const cell = (x, z) => foot.get(`${x},${z}`);

// massing, flattened into tiers: the lidar's 18 is the main block, its 19-20 core is the penthouse, its 3s the wing
const isWing = (x, z) => cell(x, z)?.R <= WING_TOP;
const isPent = (x, z) => { const c = cell(x, z); return !!c && !isWing(x, z) && x >= 4 && x <= 8 && z >= 3 && z <= 9 && c.R >= 19; };
const top = (x, z) => !cell(x, z) ? 0 : isWing(x, z) ? WING_TOP : isPent(x, z) ? PENT_TOP : MAIN_TOP;
const V = (x, y, z) => { if (x < 0 || z < 0 || x >= W || z >= D || y < 0) return false; const t = top(x, z); return y < t; };

const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const exposure = (x, y, z) => NB.filter(([dx, dy, dz]) => !V(x + dx, y + dy, z + dz));

// storeys are 3 blocks: string course on the floor line, two rows of glass between, the top row a cornice
const STRING = new Set([3, 6, 9, 12, 15]);
const WIN = new Set([1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16]);
const FLOORS = new Set([0, 3, 6, 9, 12, 15, 17, 18]);   // solid slabs and decks in the hollow interior
const ENTRY = { x0: 5, x1: 6 };                           // double door, centred on the main block's z = 0 face

const set = [];                                           // [x, y, z, block, state?]
const put = (x, y, z, block, state) => set.push([x, y, z, block, state]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!cell(x, z)) continue;
  for (let y = 0; y < top(x, z); y++) {
    const ex = exposure(x, y, z);
    if (!ex.length) { if (FLOORS.has(y)) put(x, y, z, "smooth_stone"); continue; }
    const hz = ex.filter(([, dy]) => dy === 0);
    if (ex.some(([, dy]) => dy === 1)) { put(x, y, z, "smooth_stone"); continue; }   // roof deck and cornice
    if (y === 0) { put(x, y, z, "polished_andesite"); continue; }                     // base course and plinth
    if (STRING.has(y)) { put(x, y, z, "smooth_stone"); continue; }
    // the storey wall: glass in two-wide bays, a calcite pier every third cell, solid corners
    const face = hz.length === 1 ? hz[0] : null;
    const s = face ? (face[0] ? z : x) : -1;
    const glazed = face && WIN.has(y) && s % 3 !== 0;
    if (glazed) {
      const along = face[0] ? { north: "true", south: "true", east: "false", west: "false" }
                            : { east: "true", west: "true", north: "false", south: "false" };
      put(x, y, z, "glass_pane", { ...along, waterlogged: "false" });
    } else put(x, y, z, "calcite");
  }
}

// parapet on the main block's outer edge (where no penthouse or other tier is beside it)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!cell(x, z) || isWing(x, z) || isPent(x, z)) continue;
  const edge = NB.some(([dx, , dz]) => { const c = cell(x + dx, z + dz); return !c || isWing(x + dx, z + dz); });
  if (edge) put(x, MAIN_TOP, z, "calcite");
}

// pilasters either side of the entrance bay, carried up the front
for (const x of [ENTRY.x0 - 1, ENTRY.x1 + 1]) for (let y = 1; y <= 16; y++) if (!STRING.has(y)) put(x, y, 0, "polished_andesite");

// the double door, and the penthouse's centred roof plant
for (const x of [ENTRY.x0, ENTRY.x1]) {
  const hinge = x === ENTRY.x0 ? "left" : "right";
  put(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (const [x, z] of [[9, 10], [10, 10], [9, 11], [10, 11]]) put(x, MAIN_TOP, z, "light_gray_concrete");

// warm light behind some panes: the cell just inside a glazed wall, on a rhythm so the lamps scatter across the front
const glazedAt = new Map();
for (const [x, y, z, b] of set) if (b === "glass_pane") glazedAt.set(`${x},${y},${z}`, true);
for (const [x, y, z, b] of set) {
  if (b !== "glass_pane" || (x * 31 + y * 17 + z * 13) % 11 !== 0) continue;
  // inward = opposite of the outward face: find the neighbour that is interior (not exposed) and inside the volume
  for (const [dx, , dz] of NB.filter(([, dy]) => dy === 0)) {
    const ix = x - dx, iz = z - dz;
    if (!V(ix, y, iz) || exposure(ix, y, iz).length) continue;
    if (FLOORS.has(y)) continue;
    put(ix, y, iz, "glowstone"); break;
  }
}

// later entries win, so the doors pushed above replace the glass and pier cells beneath them
const g = new Voxels([W, H, D]);
for (const [x, y, z, block, state] of set) g.set(x, y, z, block, state);
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86675.nbt";
const info = g.save(out);
console.log(`DC86675.nbt: ${info.blocks} blocks, palette ${info.palette}`);
