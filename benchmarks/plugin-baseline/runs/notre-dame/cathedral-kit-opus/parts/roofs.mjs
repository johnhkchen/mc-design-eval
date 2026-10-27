// P2 Lead roofs (plan.md ROOFS R1..R8): the nave+choir and transept gables, the sacristy roofs, the apse's hipped
// half-cone, the tribune and aisle lean-tos (straight and polar), the chapel gables, the tower decks, the turret cone
// and the iron ridge crests. R1/R2/R8 are drawn here course by course (1:1 lead stairs, 70 tile / 30 polished, a full
// course under each stair) rather than by `$MCD roof`, so the spire box, apostle stations and valleys come out exact.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { apseRoof, leanTo, leanToPolar, radialChapel, leadDeck, ridgeCrest, SPIRE_BOX } from "../vocab.mjs";

const C = [152, 38];
const stairsOf = (id, facing) => [id, { facing, half: "bottom", shape: "straight" }];
const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 10;
const leadStair = (x, y, z) => (hash(x, y, z) < 3 ? "polished_deepslate_stairs" : "deepslate_tile_stairs");
const leadSlab = (x, y, z) => (hash(x, y, z) < 3 ? "polished_deepslate_slab" : "deepslate_tile_slab");
const inBox = (b, x, y, z) => x >= b.from[0] && x <= b.to[0] && y >= b.from[1] && y <= b.to[1] && z >= b.from[2] && z <= b.to[2];

// only into air: an earlier part's cell is left as it is (never a refused write)
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return false;
  if (inBox(SPIRE_BOX, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}
// a lead roof cell: stair (or ridge slab / full tile) at y, a full tile course under it
function leadCell(g, x, y, z, facing, kind = "stair") {
  if (kind === "tile") put(g, x, y, z, "deepslate_tiles");
  else if (kind === "ridge") put(g, x, y, z, leadSlab(x, y, z), { type: "top" });   // top: the iron crest stands on it
  else put(g, x, y, z, ...stairsOf(leadStair(x, y, z), facing));
  put(g, x, y - 1, z, "deepslate_tiles");
}

// Apostle stations (P5 stands them on a full block): the roof cell under each pair of feet is a full tile.
const APOSTLE_UNDER = new Set([
  ...[[43, 54], [44, 53], [45, 52]].flatMap(([z, y]) => [`100,${y},${z}`, `88,${y},${z}`]),
  ...[[99, 52], [100, 51], [101, 50]].map(([x, y]) => `${x},${y},48`),
  ...[[89, 52], [88, 51], [87, 50]].map(([x, y]) => `${x},${y},28`),
]);

// R1 (x 23..151, z 27..49, eave 48, ridge 59 at z 38) and R2 (x 85..103, z 11..65, eave 48, ridge 57 at x 94) as one
// surface: each cell takes the higher of the two slopes, so the valleys fall out where they cross.
function naveAndTransept(g) {
  const h1 = (x, z) => (x >= 23 && x <= 151 && z >= 27 && z <= 49 ? 48 + Math.min(z - 27, 49 - z) : -1);
  const h2 = (x, z) => (x >= 85 && x <= 103 && z >= 11 && z <= 65 ? 48 + Math.min(x - 85, 103 - x) : -1);
  for (let x = 23; x <= 151; x++) for (let z = 11; z <= 65; z++) {
    const a = h1(x, z), b = h2(x, z);
    if (a < 0 && b < 0) continue;
    let y, facing, ridge;
    if (a >= b) { y = a; facing = z < 38 ? "south" : "north"; ridge = z === 38; }
    else { y = b; facing = x < 94 ? "east" : "west"; ridge = x === 94; }
    const kind = APOSTLE_UNDER.has(`${x},${y},${z}`) ? "tile" : ridge ? "ridge" : "stair";
    leadCell(g, x, y, z, facing, kind);
  }
  // valleys against the spire drum: close the roof's edge round the box with full tiles one course down
  const [x0, , z0] = SPIRE_BOX.from, [x1, , z1] = SPIRE_BOX.to;
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;
    const y = Math.max(h1(x, z), h2(x, z));
    if (y > 48) put(g, x, y - 2, z, "deepslate_tiles");
  }
}

// A gable roof over a box, ridge along `axis`, 1:1 (or 1:2 in slabs: half = true); overhang rows at the gable ends get
// smooth_sandstone_stairs verges; the gable triangles at the end walls are filled with smooth_sandstone.
function gable(g, { x0, x1, z0, z1, eave, axis, half = false, ends = [] }) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const across = axis === "z" ? x : z, a0 = axis === "z" ? x0 : z0, a1 = axis === "z" ? x1 : z1;
    const along = axis === "z" ? z : x, l0 = axis === "z" ? z0 : x0, l1 = axis === "z" ? z1 : x1;
    const d = Math.min(across - a0, a1 - across);
    const verge = along === l0 || along === l1;
    const facing = axis === "z" ? (across - a0 < a1 - across ? "east" : "west") : (across - a0 < a1 - across ? "south" : "north");
    const ridge = across - a0 === a1 - across || (Math.abs((across - a0) - (a1 - across)) === 1 && half);
    if (half) {
      const y = eave + Math.floor(d / 2);
      put(g, x, y, z, leadSlab(x, y, z), { type: d % 2 ? "top" : "bottom" });
      if (d % 2 === 0) put(g, x, y - 1, z, "deepslate_tiles");
      continue;
    }
    const y = eave + d;
    if (ridge) { put(g, x, y - 1, z, "deepslate_tiles"); put(g, x, y, z, "deepslate_tile_slab", { type: "bottom" }); continue; }
    if (verge) put(g, x, y, z, ...stairsOf("smooth_sandstone_stairs", facing));
    else put(g, x, y, z, ...stairsOf(leadStair(x, y, z), facing));
    put(g, x, y - 1, z, "deepslate_tiles");
  }
  // gable triangles: in each end wall plane, masonry from the wall top up under the roof
  for (const e of ends) for (let a = (axis === "z" ? x0 : z0) + 1; a < (axis === "z" ? x1 : z1); a++) {
    const a0 = axis === "z" ? x0 : z0, a1 = axis === "z" ? x1 : z1, d = Math.min(a - a0, a1 - a);
    const top = half ? eave + Math.floor(d / 2) - 1 : eave + d - 1;
    for (let y = eave - 1; y < top; y++) axis === "z" ? put(g, a, y, e, "smooth_sandstone") : put(g, e, y, a, "smooth_sandstone");
  }
}

// turret cone (M21: octagon w 4 about (106.5, 70.5), walls to 50): stairs stepping in, a lead finial
function turretCone(g) {
  for (let x = 105; x <= 108; x++) for (let z = 69; z <= 72; z++) {
    const ex = x === 105 || x === 108, ez = z === 69 || z === 72;
    if (ex && ez) continue;                                              // the cut corners
    const facing = x === 105 ? "east" : x === 108 ? "west" : z === 69 ? "south" : z === 72 ? "north" : null;
    if (facing) put(g, x, 51, z, ...stairsOf(leadStair(x, 51, z), facing));
    else put(g, x, 51, z, "deepslate_tiles");
  }
  for (const [x, z, f] of [[106, 70, "south"], [107, 70, "west"], [106, 71, "east"], [107, 71, "north"]])
    put(g, x, 52, z, ...stairsOf("polished_deepslate_stairs", f));
  put(g, 106, 53, 70, "deepslate_tile_wall");
  put(g, 106, 54, 70, "deepslate_tile_wall");
}

export function build(g) {
  // R1 + R2 (the spire box and apostle stations left for P5)
  naveAndTransept(g);
  ridgeCrest(g, { x0: 23, x1: 89, z: 38, y: 60 });
  ridgeCrest(g, { x0: 99, x1: 151, z: 38, y: 60 });
  ridgeCrest(g, { z0: 11, z1: 33, x: 94, y: 58 });
  ridgeCrest(g, { z0: 43, z1: 65, x: 94, y: 58 });

  // R3 apse half-cone with its hips and the ridge cross (152, 60..62, 38)
  apseRoof(g);

  // R4 tribune lean-tos (32 at the tribune wall -> 37 at the clerestory), R5 outer aisle lean-tos (21 -> 25);
  // the wall buttresses (x p..p+1, z 50 / 26, y 37..47) are kept clear for P4.
  const piers = [32, 40, 48, 56, 64, 72, 80, 112, 120, 128, 136, 144];
  const keepS = piers.map((p) => [p, 37, 50, p + 1, 47, 50]);
  const keepN = piers.map((p) => [p, 37, 26, p + 1, 47, 26]);
  for (const [x0, x1] of [[23, 84], [104, 151]]) {
    leanTo(g, { x0, x1, zLow: 59, zHigh: 50, yLow: 32, yHigh: 37, keep: keepS });
    leanTo(g, { x0, x1, zLow: 17, zHigh: 26, yLow: 32, yHigh: 37, keep: keepN });
    leanTo(g, { x0, x1, zLow: 64, zHigh: 60, yLow: 21, yHigh: 25 });
    leanTo(g, { x0, x1, zLow: 12, zHigh: 16, yLow: 21, yHigh: 25 });
  }
  // round the apse: the vertex buttresses' cells (P4) stay clear above y 37
  const verts = [[152, 49], [158, 47], [162, 41], [162, 35], [158, 29], [152, 27]];
  const nearVertex = (x, y, z) => y >= 37 && verts.some(([vx, vz]) => Math.hypot(x - vx, z - vz) <= 1.6);
  leanToPolar(g, { r0: 12, r1: 19, yLow: 32, yHigh: 37, keep: nearVertex });
  leanToPolar(g, { r0: 19.5, r1: 26, yLow: 21, yHigh: 25 });

  // R6 radiating chapel gables + corner pinnacles
  for (const angle of [0, 36, -36, 72, -72]) radialChapel(g, { angle, walls: false, roof: true, pinnacles: true });

  // R7 tower decks (flat lead at 95 inside the parapet ring)
  leadDeck(g, [3, 11, 21, 29], 95);
  leadDeck(g, [3, 47, 21, 65], 95);

  // R8 sacristy: main hall (ridge along z), the low west wing (ridge along x, half pitch), the gallery (ridge along x)
  gable(g, { x0: 134, x1: 150, z0: 79, z1: 108, eave: 17, axis: "z", ends: [80, 107] });
  gable(g, { x0: 114, x1: 134, z0: 79, z1: 100, eave: 12, axis: "x", half: true, ends: [115] });
  gable(g, { x0: 121, x1: 143, z0: 69, z1: 80, eave: 11, axis: "x", ends: [122, 142] });

  // the stair turret's cone
  turretCone(g);
}
