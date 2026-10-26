// DC64517: 1200 18th St NW, a 1960s-70s brick apartment block with precast concrete bands and a stepped core.
// Lidar roof: 16 blocks over most of the footprint, an 18 shoulder on the north side, a 19 core in the middle.
// Storey grid: ground storey rows 1-3, then a concrete floor band every 3 rows (4, 7, 10, 13, 16), each storey
// two rows of glazing between bands. Walls are brick with concrete piers; windows are panes with an air gap behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64517.cells.json", "utf8"));
const N = 16;
const at = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => x >= 0 && z >= 0 && x < N && z < N && at.has(`${x},${z}`);

// Smooth the lidar roof: mean over the 3x3 neighbourhood inside the footprint, then snap to three flat tiers.
const tier = new Map();
for (const [key, c] of at) {
  const [x, z] = key.split(",").map(Number);
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inFp(x + dx, z + dz)) { s += at.get(`${x + dx},${z + dz}`).roof; n++; }
  }
  const m = s / n;
  tier.set(key, m >= 18.4 ? 19 : m >= 17.3 ? 18 : 16);
}
const T = (x, z) => tier.get(`${x},${z}`);
const G = (x, z) => at.get(`${x},${z}`).ground;

const FLOOR_ROWS = new Set([4, 7, 10, 13, 16]);                           // concrete floor bands
const WINDOW_ROWS = new Set([2, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18]);     // glazed rows (2 = ground storey)
const DOOR = new Set(["7,0", "8,0"]);                                     // double door on the street face (z = 0)

const g = new Voxels([N, 31, N]);
const place = (x, y, z, block, state) => g.set(x, y, z, block, state);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Exposed sides: a footprint edge, or a neighbour whose tier is lower (the core's walls rise clear of the shoulder).
function exposed(x, z) {
  const t = T(x, z), out = [];
  const dirs = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
  for (const [name, dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || T(nx, nz) < t) out.push(name);
  }
  return out;
}

for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!inFp(x, z)) continue;
  const t = T(x, z), gr = G(x, z), ex = exposed(x, z), shell = ex.length > 0;
  const ns = ex.includes("north") || ex.includes("south");
  const ew = ex.includes("east") || ex.includes("west");

  // which way the glazing runs: along a north/south face the index is x, along an east/west face it is z
  const idx = ns ? x : z, last = N - 1;
  const cornerPier = ns && ew ? true : idx === 0 || idx === last;
  const pier = (idx - 1) % 3 === 2 || cornerPier;
  const paneState = ns ? { east: "true", west: "true", north: "false", south: "false" }
                       : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = 0; y < t; y++) {
    if (y < gr) { place(x, y, z, "stone_bricks"); continue; }            // foundation to the lowest ground
    if (y === t - 1) { place(x, y, z, shell ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof deck
    if (FLOOR_ROWS.has(y)) { place(x, y, z, "smooth_quartz"); continue; }   // floor slab, full footprint
    if (!shell) continue;                                                // interior: air (no interiors)

    const door = DOOR.has(`${x},${z}`);
    if (door && (y === 1 || y === 2)) {                                   // the entrance, on the street face
      place(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (y <= 1) { place(x, y, z, "stone_bricks"); continue; }           // base course on the shell
    if (y === 3) { place(x, y, z, "smooth_quartz"); continue; }           // ground-storey frieze
    if (!WINDOW_ROWS.has(y) || pier) { place(x, y, z, "bricks"); continue; }
    place(x, y, z, "glass_pane", paneState);
    // warm light behind some panes, in the air gap on the inside of the shell
    if (hash(x, y, z) % 12 === 0) {
      const [ix, iz] = ns ? [x, z + (ex.includes("north") ? 1 : -1)] : [x + (ex.includes("west") ? 1 : -1), z];
      if (inFp(ix, iz)) place(ix, y, iz, "glowstone");
    }
  }
}

// The ring's roof: AC plant on the flat tier, and a plant on the shoulder.
for (const [x, z] of [[11, 12], [12, 12], [11, 13], [12, 13]]) if (T(x, z) === 16) place(x, 16, z, "iron_block");
for (const [x, z] of [[5, 2], [6, 2]]) if (T(x, z) === 18) place(x, 18, z, "light_gray_concrete");
// Penthouse on the core: a solid brick box, glazed on the south face, capped in concrete.
for (let z = 7; z <= 9; z++) for (let x = 5; x <= 7; x++) {
  place(x, 19, z, "bricks"); place(x, 20, z, "bricks"); place(x, 21, z, "smooth_quartz");
}
for (let x = 5; x <= 7; x++) place(x, 19, 9, "glass_pane", { north: "true", south: "true", east: "false", west: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64517.nbt");
console.log(JSON.stringify(out));
