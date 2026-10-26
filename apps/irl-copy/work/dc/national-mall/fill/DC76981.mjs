// DC76981: 1225 19th St NW, Commercial-Office-Large. A 1980s-style pale precast-clad office block on a granite base:
// a 14-block tower on the 16x11 footprint's centre, an 11-block podium round it, a stepped east end (12, 13) and a
// 1-block granite plinth on the west edge (lidar roof 1). Storeys are 2 blocks (window band over a spandrel), with
// a ground-floor shopfront and a recessed entrance on the z=0 face. The inside is an air gap behind the glass with a
// floor slab per storey, so no interior; a few windows show a warm light in that gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76981.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 16, D = 11, H = 26;

const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, r); }
const roofAt = (x, z) => roof.get(`${x},${z}`);     // undefined off the footprint
const groundAt = (x, z) => ground.get(`${x},${z}`);

const BASE = "polished_granite", CAP = "quartz_block", CORNICE = "chiseled_quartz_block", SPAN = "smooth_quartz";
const FRAME = "quartz_pillar", GLASS = "cyan_stained_glass", ROOF = "gray_concrete", SLAB = "light_gray_concrete";
const CANOPY = "gray_concrete", DOOR = "dark_oak_door";
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// a face is open at height y where a neighbour is off the footprint or no taller than y (the street, the sky, a lower roof)
const openX = (x, y, z) => [[1, 0], [-1, 0]].some(([dx]) => { const r = roofAt(x + dx, z); return r === undefined || r <= y; });
const openZ = (x, y, z) => [[0, 1], [0, -1]].some(([, dz]) => { const r = roofAt(x, z + dz); return r === undefined || r <= y; });
const exposed = (x, y, z) => openX(x, y, z) || openZ(x, y, z);

// a glazed cell: a frame pillar every second cell along its face, glass between; corners are pillars
function glazed(x, z, ox, oz) {
  if (ox && oz) return { block: FRAME, state: { axis: "y" } };
  const along = ox ? z : x;
  return along % 2 === 0 ? { block: FRAME, state: { axis: "y" } } : { block: GLASS };
}

// what an exposed (façade) cell is at height y of a footprint cell whose roof is r; null for an interior cell
function facade(x, y, z, r) {
  const ox = openX(x, y, z), oz = openZ(x, y, z);
  if (!ox && !oz) return null;
  if (y === r - 1) return { block: CAP };                                          // parapet on the roof edge
  if (y === r - 2) return { block: CORNICE };                                     // cornice course under it
  if (y === 0) return { block: BASE };                                            // granite base course
  if (z === 0 && x >= 7 && x <= 9 && y === 3) return { block: CANOPY };           // canopy over the entrance
  if (z === 0 && x === 8 && (y === 1 || y === 2)) {                               // the entrance door
    return { block: DOOR, state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (y % 2 === 1 && y >= 3) return { block: SPAN };                              // storey spandrel, over each 2-block storey
  return glazed(x, z, ox, oz);                                                    // shopfront (y 1-2) and window bands (y 4, 6, ...)
}

// an interior cell: a floor slab at each storey line, air elsewhere, a warm light in some gap behind a window
const LIGHTS = [
  ["lantern", { hanging: "false", waterlogged: "false" }],
  ["glowstone", undefined],
  ["shroomlight", undefined],
];
function interior(x, y, z) {
  if (y % 2 === 1 && y >= 3) return { block: SLAB };
  if (y % 2 === 0 && y >= 4 && (x * 7 + y * 5 + z * 3) % 6 === 0) {
    const behindGlass = NEIGH.some(([dx, dz]) => {
      const nx = x + dx, nz = z + dz, r = roofAt(nx, nz);
      return r !== undefined && exposed(nx, y, nz) && facade(nx, y, nz, r)?.block === GLASS;
    });
    if (behindGlass) { const [block, state] = LIGHTS[(x + z) % 3]; return { block, state }; }
  }
  return null;
}

function cellSpec(x, y, z, r) {
  if (y === r - 1) return exposed(x, y, z) ? { block: CAP } : { block: ROOF };      // roof: a parapet at the edge, membrane inside
  const f = facade(x, y, z, r);
  if (f) return f;
  if (y === 0) return { block: BASE };
  return interior(x, y, z);
}

const g = new Voxels([W, H, D]);
for (const [x, z, , r] of cells) {
  const gnd = groundAt(x, z);
  for (let y = 0; y < gnd; y++) g.set(x, y, z, BASE);                              // foundation under a slope (none on this flat site)
  for (let y = gnd; y < r; y++) {
    const s = cellSpec(x, y, z, r);
    if (s) g.set(x, y, z, s.block, s.state);
  }
}

// the lobby's pendant light, hung in the air gap under the entrance canopy
g.set(8, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof equipment: a few small plant boxes on the roof membrane, on the podium and the tower
for (const [x, z, , r] of cells) {
  if (r >= 11 && roofAt(x, z) === r && !exposed(x, r - 1, z) && (x * 5 + z * 3) % 13 === 0) g.set(x, r, z, SLAB);
}

const out = `${DIR}/DC76981.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
