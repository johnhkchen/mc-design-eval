import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s commercial block (two storeys over a granite base, white
// tiled piers, light-blue glass bands, stone cornice and parapet, rooftop
// plant). Storey lines: ground storey y=g..4, floor band y=5, storey two
// y=6..9, cornice y=10, parapet slab y=11. Roof is about 11 blocks above the
// lowest ground.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455213.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455213.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 19;
const ROOF_DECK = 10;   // interior roof deck layer
const PARAPET = 11;     // top of parapet slab
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), clamp(Math.round(gr), 0, 21));
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

// Outward faces: N = -z, S = +z, W = -x, E = +x
const FACES = {
  N: { dx: 0, dz: -1, along: "x", facing: "north" },
  S: { dx: 0, dz: 1, along: "x", facing: "south" },
  W: { dx: -1, dz: 0, along: "z", facing: "west" },
  E: { dx: 1, dz: 0, along: "z", facing: "east" },
};
const exposed = (x, z) =>
  Object.keys(FACES).filter((F) => !has(x + FACES[F].dx, z + FACES[F].dz));
const alongOf = (F, x, z) => (FACES[F].along === "x" ? x : z);

// Run extents per face so each facade can be indexed from its first cell.
const ranges = {};
for (const F of Object.keys(FACES)) ranges[F] = { min: Infinity, max: -Infinity };
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const F of exposed(x, z)) {
    const a = alongOf(F, x, z);
    ranges[F].min = Math.min(ranges[F].min, a);
    ranges[F].max = Math.max(ranges[F].max, a);
  }
}

// Role of a perimeter cell on one face: pier, door, window or mullion.
function faceRole(F, x, z) {
  const r = ranges[F];
  const a = alongOf(F, x, z);
  const pos = a - r.min;
  const span = r.max - r.min;
  if (pos === 0 || pos === span) return "pier";
  if (F === "S" && pos === Math.floor(span / 2)) return "door";
  return pos % 2 === 1 ? "window" : "mullion";
}

// Priority: door > pier > window > mullion.
function cellRole(x, z, ex) {
  const roles = ex.map((F) => ({ F, role: faceRole(F, x, z) }));
  const pick = (name) => roles.find((r) => r.role === name);
  return pick("door") || pick("pier") || pick("window") || roles[0];
}

// Perimeter wall block for a given level.
function wallBlock(role, y, gy) {
  if (y === gy) return ["polished_granite"];                       // base course
  if (y >= PARAPET) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
  if (y === ROOF_DECK) return ["stone_bricks"];                    // cornice
  if (role === "pier") return ["white_concrete"];
  if (y === 4 || y === 5) return ["smooth_stone"];                  // lintel and floor band
  const winBand = (y >= gy + 1 && y <= 3) || y === 7 || y === 8;
  if (winBand && role === "window") return ["light_blue_stained_glass"];
  return ["white_concrete"];                                       // mullion or spandrel
}

const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gy = groundAt(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  if (gy > PARAPET) continue;

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior: floor at grade, floor slab at y=5, roof deck; air elsewhere.
    for (let y = gy; y <= ROOF_DECK; y++) {
      if (y === gy || y === 5 || y === ROOF_DECK) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const { F: face, role: cRole } = cellRole(x, z, ex);
  const fac = FACES[face];
  const doorCell = cRole === "door";

  for (let y = gy; y <= PARAPET; y++) {
    if (doorCell && (y === gy + 1 || y === gy + 2)) {
      const half = y === gy + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: fac.facing, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (doorCell && y === gy + 3 && y <= 3) {
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    const [id, props] = wallBlock(cRole, y, gy);
    put(x, y, z, id, props);
  }

  // Warm light behind some ground and upper windows (inward neighbour).
  if (cRole === "window" && (x + z) % 4 === 0) {
    const ix = x - fac.dx, iz = z - fac.dz;
    if (has(ix, iz) && exposed(ix, iz).length === 0) {
      const igy = groundAt(ix, iz);
      for (const ly of [2, 7]) {
        if (ly >= igy && ly <= ROOF_DECK && ly !== gy) put(ix, ly, iz, "glowstone");
      }
    }
  }
}

// Rooftop plant: a plant box and a water tank on the roof deck.
const roofOK = (x, z) => {
  if (!has(x, z)) return false;
  if (exposed(x, z).length > 0) return false;
  return groundAt(x, z) <= ROOF_DECK;
};
const block2x2 = (x0, z0) =>
  [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]].every(([x, z]) => roofOK(x, z));

if (block2x2(5, 6)) {
  for (let y = PARAPET; y <= PARAPET + 1; y++)
    for (const [x, z] of [[5, 6], [6, 6], [5, 7], [6, 7]]) put(x, y, z, "light_gray_concrete");
}
if (block2x2(11, 12)) {
  for (let y = PARAPET; y <= PARAPET + 2; y++)
    for (const [x, z] of [[11, 12], [12, 12], [11, 13], [12, 13]]) put(x, y, z, "white_concrete");
  for (const [x, z] of [[11, 12], [12, 12], [11, 13], [12, 13]])
    put(x, PARAPET + 3, z === 12 || z === 13 ? z : z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
