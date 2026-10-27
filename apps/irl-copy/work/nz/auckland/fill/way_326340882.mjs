// City Side Baptist Church, Auckland: a late-Victorian stone church (grey volcanic-stone walls, light stone
// trim, a dark slate roof), a nave with a lower side wing and a square tower at the south end. Built from the
// footprint cells [x, z, ground, roof]: a cobble foundation to y 2, the floor at y 3 everywhere, walls and roofs
// stepped from the lidar's tiers, and a gable that rises on the nave's ends.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340882.cells.json", "utf8"));
const W = 26, D = 42;

// the footprint, keyed x*100+z (z < 100)
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(x * 100 + z, { ground, roof });
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp.has(x * 100 + z);

// the tower: the footprint's south end, where the lidar roof is 14-18
const inT = (x, z) => inFP(x, z) && x >= 12 && x <= 19 && z >= 31;
const inN = (x, z) => inFP(x, z) && !inT(x, z);

// the lidar roof, smoothed over a 3x3 of cells into clean tiers: a low wing where it sits at 8-9 blocks
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFP(x + dx, z + dz)) { s += fp.get((x + dx) * 100 + z + dz).roof; n++; }
  return s / n;
};
const isWing = (x, z) => inN(x, z) && smoothRoof(x, z) <= 10.2;
const classOf = (x, z) => (!inFP(x, z) ? null : inT(x, z) ? "T" : isWing(x, z) ? "W" : "N");

// Storey heights (y): plinth 0-2 under the floor at 3; nave walls 4-11 (eaves 12); the wing eaves at 8; the tower
// walls to 15 with the roof from 16, capped at 18 (the lidar's top).
const E = { N: 12, W: 8, T: 16 }, RIDGE = { N: 16, W: 10, T: 18 };
const FOUND = "cobblestone", TRIM = "smooth_stone", WALL = "stone_bricks", CRACK = "cracked_stone_bricks", QUOIN = "polished_andesite";
const FLOOR = "spruce_planks", ROOF = "deepslate_tiles", ROOF_STAIR = "deepslate_tile_stairs", PANE = "glass_pane";

// steps from (x, z) in direction (dx, dz) to the first cell not in the domain
const steps = (pred, x, z, dx, dz) => { let k = 1; while (pred(x + dx * k, z + dz * k)) k++; return k; };
const outFaces = (pred, x, z) => {
  const f = [];
  if (!pred(x - 1, z)) f.push({ dir: "west", idx: z, inx: 1, inz: 0 });
  if (!pred(x + 1, z)) f.push({ dir: "east", idx: z, inx: -1, inz: 0 });
  if (!pred(x, z - 1)) f.push({ dir: "north", idx: x, inx: 0, inz: 1 });
  if (!pred(x, z + 1)) f.push({ dir: "south", idx: x, inx: 0, inz: -1 });
  return f;
};

// the cell's class, eave, roof top, whether it is on the outside, and the sides the roof falls toward
function geom(x, z) {
  if (inT(x, z)) {
    const s = { west: steps(inT, x, z, -1, 0), east: steps(inT, x, z, 1, 0), north: steps(inT, x, z, 0, -1), south: steps(inT, x, z, 0, 1) };
    const dOut = Math.min(...Object.values(s));
    return { cls: "T", E: E.T, top: Math.min(RIDGE.T, E.T + dOut - 1), perim: dOut === 1, sides: s, faces: outFaces(inFP, x, z) };
  }
  const cls = isWing(x, z) ? "W" : "N";
  const s = { west: steps(inN, x, z, -1, 0), east: steps(inN, x, z, 1, 0) };   // the gable: the roof falls east and west
  const dx = Math.min(s.west, s.east);
  // a wall wherever the neighbour is another part (the tower, the wing) or outside: no open gap between the parts
  const perim = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => classOf(a, b) !== cls);
  return { cls, E: E[cls], top: Math.min(RIDGE[cls], E[cls] + dx - 1), perim, sides: s, faces: outFaces(inFP, x, z) };
}

const g = new Voxels([W, 31, D]);
const B = new Map();                       // "x,y,z" -> block, so panes and the cross can see their neighbours
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); B.set(`${x},${y},${z}`, { block, state }); };
const pick = (x, y, z) => ((x * 7 + y * 13 + z * 31) % 11 === 0 ? CRACK : WALL);
const stairs = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

// windows on each outer face: one glass pane every third cell along a face, never on a corner
const windowRows = { N: [5, 6, 9, 10], W: [5, 6], T: [5, 6, 9, 10, 13, 14] };

const geoms = new Map();
for (const [x, z] of cells) geoms.set(x * 100 + z, geom(x, z));
const G = (x, z) => geoms.get(x * 100 + z);

for (const [x, z] of cells) {
  const c = G(x, z);
  // foundation, then the floor
  for (let y = 0; y < 3; y++) put(x, y, z, FOUND);
  put(x, 3, z, c.perim ? TRIM : FLOOR);

  if (c.perim) {
    const corner = c.faces.length >= 2;
    for (let y = 4; y < c.E; y++) {
      let b = pick(x, y, z), st = null;
      if (y === c.E - 1) b = TRIM;                                   // cornice
      else if (c.cls !== "W" && y === 8) b = TRIM;                   // string course at the storey line
      if (corner) b = QUOIN;
      const win = !corner && c.faces.length === 1 && c.faces[0].idx % 3 === 1 && windowRows[c.cls].includes(y);
      if (win && b !== TRIM) b = PANE;
      put(x, y, z, b, b === PANE ? { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" } : undefined);
    }
    // a gable on the outside ends rises to the roof top in stone
    if (c.faces.length) for (let y = c.E; y < c.top; y++) put(x, y, z, pick(x, y, z));
  }
  if (!c.perim || !c.faces.length) {
    // a part's inner cells (and a wall between the parts) carry a floor under each storey and a ceiling under the roof
    if (!c.perim) {
      if (c.cls !== "W") put(x, 8, z, FLOOR);
      if (c.cls === "T") put(x, 12, z, FLOOR);
      put(x, c.E - 1, z, TRIM);                                      // the ceiling's edge shows above the cornice: a stone soffit
    }
    // roof: solid from the ceiling up to the top; the top course is a stair falling toward the nearest outside
    const lo = Object.entries(c.sides).filter(([, v]) => v === Math.min(...Object.values(c.sides)));
    const capped = c.top === RIDGE[c.cls];
    for (let y = c.E; y < c.top; y++) {
      if (y < c.top - 1 || capped || lo.length !== 1) put(x, y, z, ROOF);
      else put(x, y, z, ROOF_STAIR, stairs(lo[0][0]));
    }
  }
}

// the entrance on the tower's south face: a dark oak door, a canopy above it on the wall
const dx0 = 15, dz0 = 41;
put(dx0, 4, dz0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx0, 5, dz0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [14, 15, 16]) put(x, 6, dz0, "deepslate_tile_slab", { type: "top", waterlogged: "false" });

// the tower's top: a cross on the roof's flat cap
const cx = 15, cz = 36;
put(cx, 18, cz, "iron_bars", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
put(cx, 19, cz, "iron_bars", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
put(cx, 20, cz, "iron_bars", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
put(cx - 1, 19, cz, "iron_bars", { east: "true", west: "false", north: "false", south: "false", waterlogged: "false" });
put(cx + 1, 19, cz, "iron_bars", { east: "false", west: "true", north: "false", south: "false", waterlogged: "false" });

// warm light a cell behind some windows (an air gap between the glass and the lamp): glowstone on the ground storey,
// shroomlight on the upper one
let lamps = 0;
for (const [x, z] of cells) {
  const c = G(x, z);
  if (!c.perim || c.faces.length !== 1) continue;
  const f = c.faces[0];
  for (const [y, lamp, phase] of [[5, "glowstone", 1], [9, "shroomlight", 4]]) {
    if (!windowRows[c.cls].includes(y) || f.idx % 3 !== 1 || f.idx % 6 !== phase) continue;
    const lx = x + 2 * f.inx, lz = z + 2 * f.inz;
    if (!inFP(lx, lz) || G(lx, lz).perim) continue;
    put(lx, y, lz, lamp); lamps++;
  }
}

// each pane joins the neighbours that are solid at its height (walls and panes), so its frame reads as a grid
for (const [key, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = key.split(",").map(Number);
  const has = (xx, zz) => { const n = B.get(`${xx},${y},${zz}`); return !!n && n.block !== "minecraft:air"; };
  const st = { east: String(has(x + 1, z)), west: String(has(x - 1, z)), north: String(has(x, z - 1)), south: String(has(x, z + 1)), waterlogged: "false" };
  put(x, y, z, PANE, st);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340882.nbt";
const r = g.save(out);
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, lamps }));
