// Elizabeth Arden Building, 1147 Connecticut Ave NW: a 1960s-70s office block, pale precast concrete piers and spandrels
// with blue-glass window bands on a granite base. The lidar roof is a stepped massing: a 19-block tower core, 17 and 15
// wings, low 11 and 9 pavilions on the flanks. Each footprint cell is one column; 2 blocks per storey (a spandrel row
// over a glass row) on a shared grid, so every storey lines up across the wings and the setbacks stand on the tier below.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64836.cells.json", "utf8"));
const W = 21, D = 15, H = 31;
const g = new Voxels([W, H, D]);

const FOUND = "polished_granite", PIER = "white_concrete", SPAND = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const CAP = "smooth_stone", DECK = "stone", SHOP = "light_blue_stained_glass", FLOOR = "light_gray_concrete", LIGHT = "glowstone";

// roof per cell (lidar, y0 based) and ground step; cell index [x][z]
const roof = Array.from({ length: W }, () => Array(D).fill(null));
const ground = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, gr, r] of cells) { roof[x][z] = r; ground[x][z] = gr; }
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[x][z] !== null;

// a 3x3 median kills lidar speckle (a single 5 among 17s), then the roof snaps to the massing tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => (r >= 18 ? 19 : r >= 16 ? 17 : r >= 14 ? 15 : r >= 12 ? 13 : r >= 10 ? 11 : 9);
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (has(x, z)) T[x][z] = tier(median(x, z));
const top = (x, z) => (has(x, z) ? T[x][z] : 0);

// exposure: which sides of a cell face open air (off the footprint, or above a lower neighbour's roof)
const sides = (x, z, y) => {
  const out = { n: false, s: false, w: false, e: false };
  const t = top(x, z);
  const test = (k, nx, nz) => { out[k] = !has(nx, nz) || (top(nx, nz) < t && y >= top(nx, nz)); };
  test("n", x, z - 1); test("s", x, z + 1); test("w", x - 1, z); test("e", x + 1, z);
  return out;
};

const ROOF_EQUIP = (x, z) => x >= 12 && x <= 14 && z >= 3 && z <= 4;   // a plant room on the tower roof

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const t = T[x][z], gr = ground[x][z];
  // foundation up to the ground step; a ground-level cell that sits low gets its shopfront course at y0
  if (gr === 1) g.set(x, 0, z, FOUND);
  for (let y = 0; y < t; y++) {
    if (y === 0 && gr === 1) continue;
    const s = sides(x, z, y);
    const exposed = s.n || s.s || s.w || s.e;
    const u = s.n || s.s ? x : z;                 // mullion rhythm runs along the face the cell sits on
    const pier = u % 3 === 0;
    const isCap = y === t - 1;
    const isDeck = y === t - 2;
    const groundRow = y === 1 || (y === 0 && gr === 0);
    if (isCap && exposed) { g.set(x, y, z, CAP); continue; }                    // parapet cap on the outside
    if (isCap) { g.set(x, y, z, DECK); continue; }                               // flat roof edge inside
    if (exposed) {
      if (groundRow) { g.set(x, y, z, pier ? PIER : SHOP); continue; }           // shopfront: glass bays, piers
      if (y % 2 === 0) { g.set(x, y, z, pier ? PIER : SPAND); continue; }       // spandrel course over each window row
      if (pier) { g.set(x, y, z, PIER); continue; }
      const warm = (x * 7 + z * 3 + y) % 23 === 0;                              // a few lit windows behind the glass
      g.set(x, y, z, warm ? LIGHT : GLASS); continue;
    }
    // inside the walls: floor slabs and a roof deck, air between (no interiors)
    if (isDeck || (y % 2 === 0 && y > 0 && y < t - 2)) g.set(x, y, z, isDeck ? DECK : FLOOR);
  }
  if (t === 19 && ROOF_EQUIP(x, z)) {                                             // plant room: block, grille, ledge
    g.set(x, t - 1, z, FLOOR); g.set(x, t, z, FLOOR);
    g.set(x, t + 1, z, "iron_bars");
  }
}

// main entrance on the front (south) face of the SE wing, cells x 18..20 at z 14: a door under a dark canopy row
g.set(19, 0, 14, FOUND);
g.set(19, 1, 14, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(19, 2, 14, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [18, 19, 20]) g.set(x, 3, 14, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64836.nbt");
console.log(JSON.stringify(out));
