import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw761845752.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw761845752.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 19, H = 43, D = 35;
const g = new Voxels([W, H, D]);

// Footprint lookup: cell key -> ground height (clamped, integer)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(x + "," + z, Math.max(0, Math.min(20, Math.round(gr))));
}
const has = (x, z) => ground.has(x + "," + z);
const gr = (x, z) => ground.get(x + "," + z);

// Design: 6 storeys of 5 blocks, roof deck at y=30, parapet to 32,
// mechanical penthouse 31..35 on the core, lightning-rod mast to 40.
const ROOF = 30;      // roof deck top layer
const STOREY = 5;
const DOOR_U = 9;     // entrance column on south face

const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// Outward-facing sides of a footprint cell
function outDirs(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("north");
  if (!has(x, z + 1)) d.push("south");
  if (!has(x + 1, z)) d.push("east");
  if (!has(x - 1, z)) d.push("west");
  return d;
}

const isPerimeter = (x, z) => outDirs(x, z).length > 0;

// Facade block for a perimeter cell at height y (y < ROOF)
function facade(x, z, y, dirs) {
  const k = Math.floor(y / STOREY);
  const j = y % STOREY;
  const corner = dirs.length > 1;
  const dir = dirs[0];
  const alongX = dir === "north" || dir === "south";
  const u = alongX ? x : z;
  const southEntrance = !corner && dir === "south";

  if (j === 0) {
    if (k === 0) return { id: "polished_granite" };        // base course
    return { id: "light_gray_concrete" };                  // storey line
  }
  if (j === 4) return { id: "smooth_quartz" };             // spandrel / cornice band

  // j = 1..3 : window zone
  if (k === 0 && southEntrance && u === DOOR_U && j <= 2) {
    return {
      id: "oak_door",
      props: {
        facing: "south",
        half: j === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }
  if (k === 0 && southEntrance && u >= 7 && u <= 11 && j === 3) {
    return { id: "white_concrete" };                       // entrance lintel
  }
  if (corner || u % 3 === 0) return { id: "white_concrete" }; // pillars

  const props = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { id: "light_blue_stained_glass_pane", props };
}

// 1. Foundation, floors, facade, roof per footprint cell
for (const [x, z, gRaw] of cells) {
  const cx = x, cz = z;
  const base = gr(cx, cz);
  const dirs = outDirs(cx, cz);
  const perim = dirs.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(cx, y, cz, "stone_bricks");

  // Storeys from its ground up to the roof deck
  for (let y = base; y < ROOF; y++) {
    if (perim) {
      const b = facade(cx, cz, y, dirs);
      if (b.props) g.set(cx, y, cz, b.id, b.props);
      else g.set(cx, y, cz, b.id);
    } else if (y % STOREY === 0) {
      g.set(cx, y, cz, "smooth_quartz");                   // floor slab
    }
  }

  // Roof deck (full footprint, top layer at ROOF)
  g.set(cx, ROOF, cz, "light_gray_concrete");

  // Parapet and cap on perimeter
  if (perim) {
    g.set(cx, ROOF + 1, cz, "white_concrete");
    g.set(cx, ROOF + 2, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2. Warm lights: glowstone just inside some upper-storey windows
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const dirs = outDirs(x, z);
  if (dirs.length !== 1) continue;
  const dir = dirs[0];
  const alongX = dir === "north" || dir === "south";
  const u = alongX ? x : z;
  const [ox, oz] = OFF[OPP[dir]];          // inward offset
  const ix = x + ox, iz = z + oz;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  if (u % 3 === 0) continue;
  for (let k = 1; k <= 4; k++) {
    if (u % 6 !== 1) continue;             // sparse, roughly every other bay
    const y = k * STOREY + 2;
    if (y < gr(ix, iz) || y >= ROOF) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 3. Mechanical penthouse on the central core, if the core lies in the footprint
const CORE = { x0: 4, x1: 14, z0: 10, z1: 24 };
let coreOk = true;
for (let x = CORE.x0; x <= CORE.x1 && coreOk; x++)
  for (let z = CORE.z0; z <= CORE.z1; z++)
    if (!has(x, z)) { coreOk = false; break; }

if (coreOk) {
  for (let x = CORE.x0; x <= CORE.x1; x++) {
    for (let z = CORE.z0; z <= CORE.z1; z++) {
      const ring = x === CORE.x0 || x === CORE.x1 || z === CORE.z0 || z === CORE.z1;
      // Penthouse walls: solid base course then louvred bands
      if (ring) {
        g.set(x, 31, z, "light_gray_concrete");
        for (let y = 32; y <= 34; y++) {
          const u = (x === CORE.x0 || x === CORE.x1) ? z : x;
          if (u % 2 === 0) g.set(x, y, z, "smooth_quartz");
          else g.set(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
        }
      }
      // Penthouse roof
      g.set(x, 35, z, "light_gray_concrete");
    }
  }
  // Mast on the penthouse roof
  for (let y = 36; y <= 40; y++) {
    g.set(9, y, 17, y === 36 ? "light_gray_concrete" : "lightning_rod",
      y === 36 ? undefined : { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
