// DC70185: a 1970s Modernist federal office block on the Mall's south-west side, read from the lidar record. A long
// five-storey spine (16 blocks) with four-storey wings (13) and one-storey pavilions (4) at the ends and along the
// north and south edges. Pale precast-look walls (smooth quartz spandrels, white concrete mullions), a dark granite
// plinth and stone base course, blue-tinted glass in every storey, a chiseled cornice on each tier, and two iron-doored
// entrances (north on the 13-block wing under a stone hood, south in the pavilion). Roof plant on the spine.
//
// Storeys are three blocks on an absolute rhythm (spandrel, two glass rows; the top storey gives its upper glass row to
// the cornice), so neighbouring tiers line up. Each column fills from y 0 as foundation up to its tier, which is the
// lidar roof rounded to the nearest of 4, 13 and 16. The building is solid mass with one block of air behind the glass
// (the air gap), a floor slab in every storey, and a glowstone lamp standing in some of those gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70185.cells.json`, "utf8"));
const W = 75, D = 17, H = 20;

const key = (x, z) => `${x},${z}`;
const roofOf = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => roofOf.has(key(x, z));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Tiers: 1, 4 and 5 storeys (each storey three blocks, the last one closed by its cornice row).
const TIERS = [4, 13, 16];
const nearestTier = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) <= Math.abs(best - r) ? t : best));

// Lidar noise: a cell whose footprint neighbours (three or four) all sit in another tier takes that tier.
const base = new Map(cells.map(([x, z, , r]) => [key(x, z), nearestTier(r)]));
const TIER = new Map();
for (const [k, t] of base) {
  const [x, z] = k.split(",").map(Number);
  const counts = new Map();
  for (const [, dx, dz] of DIRS) {
    const v = base.get(key(x + dx, z + dz));
    if (v !== undefined) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let adopt = t;
  for (const [v, n] of counts) if (v !== t && n >= 3) adopt = v;
  TIER.set(k, adopt);
}

// Stubs: a patch of one tier smaller than eight cells (a lidar spike at a corner) takes the tier most of its edge touches.
const seen = new Set();
for (const k of [...TIER.keys()]) {
  if (seen.has(k)) continue;
  const t = TIER.get(k), patch = [k], edge = new Map();
  seen.add(k);
  for (let i = 0; i < patch.length; i++) {
    const [x, z] = patch[i].split(",").map(Number);
    for (const [, dx, dz] of DIRS) {
      const n = key(x + dx, z + dz), nt = TIER.get(n);
      if (nt === undefined) continue;
      if (nt === t && !seen.has(n)) { seen.add(n); patch.push(n); }
      if (nt !== t) edge.set(nt, (edge.get(nt) ?? 0) + 1);
    }
  }
  if (patch.length >= 8 || !edge.size) continue;
  const [to] = [...edge].sort((a, b) => b[1] - a[1])[0];
  for (const p of patch) TIER.set(p, to);
}
const tier = (x, z) => TIER.get(key(x, z)) ?? 0;

// A face is exposed at a row where the neighbour is outside the footprint or stands lower than that row.
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => tier(x + dx, z + dz) <= y).map(([n]) => n);

const storey = (y) => ({ k: Math.floor((y - 1) / 3), r: (y - 1) % 3 });   // y >= 1: r 0 spandrel, 1 and 2 glass

const PLINTH = { block: "polished_granite" }, BASE = { block: "stone_bricks" }, SPAND = { block: "smooth_quartz" };
const CORNICE = { block: "chiseled_quartz_block" }, MULLION = { block: "white_concrete" };
const GLASS = { block: "light_blue_stained_glass" }, FILL = { block: "light_gray_concrete" };
const LAMP = { block: "glowstone" };

// Entrances: north on the 13-block wing (x 27), south in the 4-block pavilion (x 45). Two-high iron doors, stone hood above.
const DOORS = [{ x: 27, z: 0, facing: "north" }, { x: 45, z: 16, facing: "south" }];
const doorAt = (x, z, y) => DOORS.find((d) => d.x === x && d.z === z && (y === 1 || y === 2));
const hoodAt = (x, z, y) => y === 3 && z === 0 && x >= 26 && x <= 28;

function kindAt(x, z, y) {
  if (!inF(x, z)) return null;
  const T = tier(x, z);
  if (y >= T) return null;
  if (y === 0) return PLINTH;
  const door = doorAt(x, z, y);
  if (door) return { block: "iron_door", state: { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (hoodAt(x, z, y)) return CORNICE;
  const { k, r } = storey(y);
  const top = y === T - 1;
  const fs = faces(x, z, y);
  if (fs.length) {
    if (top) return CORNICE;
    if (r === 0) return k === 0 ? BASE : SPAND;
    const corner = fs.some((n) => n === "N" || n === "S") && fs.some((n) => n === "E" || n === "W");
    if (corner) return MULLION;
    const coord = fs.some((n) => n === "N" || n === "S") ? x : z;   // bays of three along each face
    return coord % 3 === 0 ? MULLION : GLASS;
  }
  // Interior: the one block behind a glass pane is air (or a lamp); everything else is solid mass and floor slabs.
  if (!top && r !== 0 && behindGlass(x, z, y)) return (x * 7 + y * 13 + z * 5) % 6 === 0 ? LAMP : null;
  return FILL;
}

// Only facade neighbours are asked (they never recurse back here), so an interior cell beside glass is the gap.
function behindGlass(x, z, y) {
  return DIRS.some(([, dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return faces(nx, nz, y).length > 0 && kindAt(nx, nz, y)?.block === GLASS.block;
  });
}

const v = new Voxels([W, H, D]);
for (const [k] of roofOf) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < tier(x, z); y++) {
    const kind = kindAt(x, z, y);
    if (!kind) continue;
    v.set(x, y, z, kind.block, kind.state);
  }
}

// Roof plant on the five-storey spine: two louvred boxes with a cornice cap.
const plant = [[22, 25, 8, 10], [50, 53, 8, 10]];
for (const [x0, x1, z0, z1] of plant)
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (tier(x, z) !== 16) continue;
    v.set(x, 16, z, "stone_bricks"); v.set(x, 17, z, "stone_bricks");
    if (x === x0 || x === x1 || z === z0 || z === z1) v.set(x, 17, z, "chiseled_stone_bricks");
  }

const { blocks, palette } = v.save(`${DIR}/DC70185.nbt`);
console.log(`DC70185.nbt: ${blocks} blocks, ${palette} palette entries`);
