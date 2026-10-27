// The Antipodean: a 14-storey office tower of the 1970s on a dark basalt base, the Auckland CBD's concrete-and-tinted-glass
// look. Storeys are 4 blocks: a floor line, two rows of glass, a spandrel. Piers every 3 blocks. The lidar roof is
// median-smoothed over 3x3 and quantised to five tiers (1, 2, 6, 11, 14 storeys) so the setbacks are flat.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_494051518.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_494051518.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const BASE = "deepslate_bricks", PIER = "white_concrete", SLAB = "light_gray_concrete", LINE = "smooth_stone";
const GLASS = "cyan_stained_glass", ROOF = "stone_bricks", PARAPET = "white_concrete", CANOPY = "oxidized_copper";
const PLANT = "light_gray_concrete", LOUVRE = "iron_bars", SHRUB = "oak_leaves";
const STOREY = 4;

const key = (x, z) => x * 1000 + z;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });
const has = (x, z) => cell.has(key(x, z));

// the lidar roof, 3x3 median over the footprint, quantised to storeys
function medianRoof(x, z) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = cell.get(key(x + dx, z + dz)); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
}
function storeysFor(r) { if (r < 8) return 1; if (r < 18) return 2; if (r < 36) return 6; if (r < 50) return 11; return 14; }
const S = new Map();
for (const [x, z] of cells) S.set(key(x, z), storeysFor(medianRoof(x, z)));
const storeys = (x, z) => S.get(key(x, z)) ?? 0;
const groundAt = (x, z) => cell.get(key(x, z)).ground;

// part of the building at this height: inside the footprint and up to its tier's roof slab
const inside = (x, z, y) => has(x, z) && y >= 0 && y <= STOREY * storeys(x, z);
// a horizontal face at this height: a neighbour is not part of the building there
const exposedX = (x, y, z) => !inside(x - 1, z, y) || !inside(x + 1, z, y);
const exposedZ = (x, y, z) => !inside(x, z - 1, y) || !inside(x, z + 1, y);
const exposed = (x, y, z) => exposedX(x, y, z) || exposedZ(x, y, z);
const nearFacade = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inside(x + dx, z + dz, y) && exposed(x + dx, y, z + dz));

// the entrance: the middle of the street-side (lowest z) row
const minZ = Math.min(...cells.map(([, z]) => z));
const zRow = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = zRow[zRow.length >> 1];
const litWindow = (x, z, s) => (x * 31 + z * 17 + s * 7) % 5 === 0;

function paint(x, z, y) {
  const gr = groundAt(x, z), top = STOREY * storeys(x, z);
  if (y === 0 || y < gr) return [BASE];                       // floor and foundation, solid from 0 up to the ground
  if (y === top) return [ROOF];                               // the tier's roof slab
  const s = Math.floor(y / STOREY), r = y % STOREY;
  if (r === 0) return [exposed(x, y, z) ? LINE : SLAB];        // floor slabs; a storey line on the face
  if (!exposed(x, y, z)) {                                    // the air gap: a warm lantern standing on the floor, behind a window
    if (r === 1 && y >= gr && nearFacade(x, y, z) && litWindow(x, z, s)) return ["lantern", { hanging: "false", waterlogged: "false" }];
    return null;
  }
  const pier = (exposedX(x, y, z) && exposedZ(x, y, z)) || (exposedZ(x, y, z) ? x % 3 === 0 : z % 3 === 0);
  if (s === 0) {                                              // the commercial ground storey: base, glazed shopfront, lintel
    const door = x === DOOR_X && z === minZ;
    if (door) return ["dark_oak_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (r === 1) return [BASE];
    if (r === 2) return [pier ? PIER : GLASS];
    return [z === minZ && Math.abs(x - DOOR_X) <= 1 ? CANOPY : LINE];
  }
  if (r === 3) return [SLAB];                                 // spandrel between the windows
  return [pier ? PIER : GLASS];                               // window band: glass, piers as frames
}

const v = new Voxels([61, 72, 78]);
for (const [x, z] of cells) {
  const top = STOREY * storeys(x, z);
  for (let y = 0; y <= top; y++) {
    const p = paint(x, z, y);
    if (p) v.set(x, y, z, p[0], p[1]);
  }
  // parapet on the roof's outer edge (outside the footprint or beside a lower tier); the tower gets two courses
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz) || storeys(x + dx, z + dz) < storeys(x, z));
  if (edge) for (let y = top + 1; y <= top + (storeys(x, z) === 14 ? 2 : 1); y++) v.set(x, y, z, PARAPET);
  // a planted terrace on the 11-storey setback: shrub clumps standing on its roof slab
  if (storeys(x, z) === 11 && !edge && (x + z) % 6 === 0) v.set(x, top + 1, z, SHRUB);
}

// the roof plant room: a box on the main roof, set in from the parapet, walls with a louvre band
const top14 = cells.filter(([x, z]) => storeys(x, z) === 14);
const cx = Math.round(top14.reduce((a, [x]) => a + x, 0) / top14.length), cz = Math.round(top14.reduce((a, [, z]) => a + z, 0) / top14.length);
const CORE = { x0: cx - 5, x1: cx + 5, z0: cz - 6, z1: cz + 6, y0: 57, y1: 60 };
let coreOk = true;
for (let x = CORE.x0; x <= CORE.x1; x++) for (let z = CORE.z0; z <= CORE.z1; z++) if (storeys(x, z) !== 14) coreOk = false;
if (coreOk) {
  for (let x = CORE.x0; x <= CORE.x1; x++) for (let z = CORE.z0; z <= CORE.z1; z++) {
    const wall = x === CORE.x0 || x === CORE.x1 || z === CORE.z0 || z === CORE.z1;
    for (let y = CORE.y0; y <= CORE.y1; y++) {
      if (y === CORE.y1) v.set(x, y, z, PLANT);
      else if (wall) v.set(x, y, z, y === 58 ? LOUVRE : PLANT);
    }
  }
} else console.log("plant room skipped: the core rectangle leaves the 14-storey tier");

const res = v.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries; tiers ${JSON.stringify(Object.fromEntries([1, 2, 6, 11, 14].map((t) => [t, cells.filter(([x, z]) => storeys(x, z) === t).length])))}; entrance x=${DOOR_X} z=${minZ}; plant core at ${cx},${cz}`);
