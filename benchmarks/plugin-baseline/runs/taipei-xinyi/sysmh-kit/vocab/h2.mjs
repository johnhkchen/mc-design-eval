// Vocabulary helpers, batch h2 (plan.md VOCABULARY): step_ramp, red_wall_run, roof_shell, fin, door_bay, flood_well,
// lamp_post, flagpole. Coordinates are plot-local (plan.md; y 0 = ground course). Blocks are plan.md PALETTE ids and
// states are valid for 1.21.1.
//
// Contract, for every helper: the footprint comes in as arguments (a box {x0,x1,y0,y1,z0,z1}, inclusive, or a position
// [x,y,z] for one object); it writes only inside that footprint and only into air unless o.over is true; it returns
// { placed, blocked } where blocked lists the footprint cells that were not air (left alone). Facing comes in as an
// argument too. None of these is furniture, so there is no room lane to keep clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const inBox = (b, x, y, z) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;

// One writer per call: footprint check, air check (unless over), and the placed / blocked tally.
function writer(g, box, over = false) {
  const out = { placed: 0, blocked: [] };
  const set = (x, y, z, block, state, nbt) => {
    if (!inBox(box, x, y, z) || !g.inBounds(x, y, z)) return;
    if (!over && !g.isAir(x, y, z)) { out.blocked.push([x, y, z]); return; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  };
  return { set, out };
}

// The concave hip (plan.md ROOFS): surface y by distance d in from the nearest outer eave edge.
const hipY = (d) => (d <= 2 ? 24 : d <= 5 ? 25 : d <= 8 ? 26 : d <= 11 ? 27 : d <= 13 ? 28 : d <= 15 ? 29 : d <= 17 ? 30 : d <= 19 ? 31 : d <= 21 ? 32 : d <= 29 ? d + 11 : 41);
// The corner upsweep on the eave ring: lift by k, the distance along the edge from the nearest corner (+4 at the corner, 0 from k = 8).
const EAVE_LIFT = [4, 3, 3, 2, 2, 1, 1, 1, 0, 0];

// Surface top and eave ring depth of the roof cell (x, z) on the roof footprint r = {x0,x1,z0,z1}.
function roofAt(r, x, z) {
  const u = Math.min(x - r.x0, r.x1 - x), v = Math.min(z - r.z0, r.z1 - z);
  const d = Math.min(u, v), k = Math.max(u, v);
  const lift = d === 0 && k < 10 ? EAVE_LIFT[k] : 0;
  return { d, top: hipY(d) + lift };
}

const SOUTH_STEP_FULL = "polished_andesite";

/**
 * South steps (plan.md OPENINGS table). box.z1 is the street-side bottom row, box.z0 the podium-side deck row, and
 * k = z1 - z. k 0: bottom slab on y1. k 1: full on y1. k 2..4: full on y1 with a bottom slab on y2 (the landing).
 * k >= 5: full on y1 and y2 (deck level). Writes only y1..y2, so the ground under the steps is never touched.
 * box: { x0,x1 (56..95), y0 1, y1 2, z0 (144), z1 (157) }.
 */
export function step_ramp(g, box, o = {}) {
  const w = writer(g, box, o.over === true);
  const slab = B.slab("polished_andesite", "bottom");
  for (let z = box.z0; z <= box.z1; z++) for (let x = box.x0; x <= box.x1; x++) {
    const k = box.z1 - z;
    for (let y = box.y0; y <= box.y1; y++) {
      let put = null;
      if (y === 1) put = k === 0 ? slab : [SOUTH_STEP_FULL];
      else if (y === 2 && k >= 2) put = k <= 4 ? slab : [SOUTH_STEP_FULL];
      if (put) w.set(x, y, z, ...put);
    }
  }
  return w.out;
}

/**
 * A red wall run on one face of the hall: red_terracotta on the wall plane over box y0..y1, and smooth_stone pilasters
 * one block proud on the outer face at each column centre. The box spans both planes: north: z1 is the wall and z0 the
 * pilasters; south: z0 the wall, z1 the pilasters; west: x1 the wall, x0 the pilasters; east: x0 the wall, x1 the
 * pilasters. Along the wall, the run is x0..x1 (north, south) or z0..z1 (east, west). o.columns: the along-wall
 * coordinates of the column centres; o.gaps: [a0, a1] spans left air (door bays, see door_bay).
 */
export function red_wall_run(g, box, side, o = {}) {
  const { gaps = [], columns = [] } = o;
  const w = writer(g, box, o.over === true);
  const ew = side === "east" || side === "west";
  const wallP = side === "north" ? box.z1 : side === "south" ? box.z0 : side === "west" ? box.x1 : box.x0;
  const outP = side === "north" ? box.z0 : side === "south" ? box.z1 : side === "west" ? box.x0 : box.x1;
  const cell = (a, y, p) => (ew ? [p, y, a] : [a, y, p]);
  const [a0, a1] = ew ? [box.z0, box.z1] : [box.x0, box.x1];
  const gapped = (a) => gaps.some(([s, e]) => a >= s && a <= e);
  for (let a = a0; a <= a1; a++) if (!gapped(a)) for (let y = box.y0; y <= box.y1; y++) w.set(...cell(a, y, wallP), "red_terracotta");
  for (const c of columns) if (c >= a0 && c <= a1) for (let y = box.y0; y <= box.y1; y++) w.set(...cell(c, y, outP), "smooth_stone");
  return w.out;
}

/**
 * The great roof's shell (plan.md ROOFS): every cell of the roof footprint box (x0..x1, z0..z1) filled from its bottom
 * up to its surface. Eave ring (d 0): smooth_stone fascia; d 0..5: smooth_stone soffit at y 23..24; the rest yellow,
 * yellow_terracotta on every third ring (d div 3 mod 3 = 0), otherwise yellow_concrete. The column bottom is one below
 * the previous ring's surface, so the shell has no holes on its risers. o.skip: a footprint box left to the portal part
 * (the south cut-out). box y0 23, y1 41.
 */
export function roof_shell(g, box, o = {}) {
  const { skip = null } = o;
  const w = writer(g, box, o.over === true);
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (skip && x >= skip.x0 && x <= skip.x1 && z >= skip.z0 && z <= skip.z1) continue;
    const { d, top } = roofAt(box, x, z);
    const bottom = d <= 5 ? 23 : hipY(d - 1) - 1;
    const tile = Math.floor(d / 3) % 3 === 0 ? "yellow_terracotta" : "yellow_concrete";
    for (let y = bottom; y <= top; y++) w.set(x, y, z, d === 0 || (d <= 5 && y <= 24) ? "smooth_stone" : tile);
  }
  return w.out;
}

/**
 * A portal fin (plan.md PARTS P3): a 3-thick smooth_stone wall on box x0..x1 that stands on the roof from the eave ring
 * (roof.z1 - 17 = box.z0) toward the front. From roof.z1 - 15 forward it rises to y 45; further back it is the roof
 * itself. The flick steps out over z roof.z1+1..+2 at y 46 in stone_stairs (facing south, bottom), with a gold_block tip
 * at (x0+1, 47, roof.z1+2) and a shroomlight under the flick at y 44 on the portal side. o.roof: {x0,x1,z0,z1} of the
 * roof (the same footprint roof_shell took); o.inner: "east" when the portal lies east of the fin (the west fin, default),
 * "west" for the east fin.
 */
export function fin(g, box, o = {}) {
  const { roof, inner = "east" } = o;
  const w = writer(g, box, o.over === true);
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= roof.z1; z++) {
    const base = roofAt(roof, x, z).top;
    const top = roof.z1 - z <= 15 ? 45 : base;
    for (let y = base + 1; y <= top; y++) w.set(x, y, z, "smooth_stone");
  }
  for (let x = box.x0; x <= box.x1; x++) for (const z of [roof.z1 + 1, roof.z1 + 2]) w.set(x, 46, z, ...B.stairs("stone", "south", "bottom"));
  w.set(box.x0 + 1, 47, roof.z1 + 2, "gold_block");
  w.set(inner === "east" ? box.x1 : box.x0, 44, roof.z1 + 1, "shroomlight");
  return w.out;
}

/**
 * A lit door bay on one face (plan.md OPENINGS and ROOMS): side is the wall's face ("east", "west", "north", "south"),
 * wallAt the wall plane's coordinate (x for east/west, z for north/south), [a0, a1] the span along the wall (6 wide).
 * In the wall: glass_pane from yFloor to yGlass, red_terracotta above it to yTop. Behind it, a 3-deep vestibule into the
 * hall: smooth_quartz floor at yFloor, and a smooth_quartz back wall four cells in, with two sea_lanterns set in it at
 * yFloor + 2, on the span's middle (so the lanterns have a block to hang on). o: { yFloor 3, yGlass 9, yTop 19, over }.
 */
export function door_bay(g, side, wallAt, [a0, a1], o = {}) {
  const { yFloor = 3, yGlass = 9, yTop = 19 } = o;
  const ew = side === "east" || side === "west";
  const inward = side === "west" || side === "north" ? 1 : -1;
  const at = (a, y, d) => (ew ? [wallAt + inward * d, y, a] : [a, y, wallAt + inward * d]);
  const planes = [wallAt, wallAt + inward * 4].sort((p, q) => p - q);
  const box = ew ? { x0: planes[0], x1: planes[1], z0: a0, z1: a1, y0: yFloor, y1: yTop } : { x0: a0, x1: a1, z0: planes[0], z1: planes[1], y0: yFloor, y1: yTop };
  const w = writer(g, box, o.over === true);
  const pane = ew ? { north: "true", east: "false", south: "true", west: "false" } : { north: "false", east: "true", south: "false", west: "true" };
  const mid = a0 + 2;
  for (let a = a0; a <= a1; a++) {
    for (let y = yFloor; y <= yGlass; y++) w.set(...at(a, y, 0), "glass_pane", pane);
    for (let y = yGlass + 1; y <= yTop; y++) w.set(...at(a, y, 0), "red_terracotta");
    for (let d = 1; d <= 3; d++) w.set(...at(a, yFloor, d), "smooth_quartz");
    for (let y = yFloor; y <= yTop; y++) w.set(...at(a, y, 4), y === yFloor + 2 && (a === mid || a === mid + 1) ? "sea_lantern" : "smooth_quartz");
  }
  return w.out;
}

/**
 * A floodlight well: shroomlight flush in the podium deck at [x, y, z] (the deck top is y 2), one cell outboard of a
 * column. The deck cell is polished_andesite; it is replaced only with o.over === true. Any other occupied cell is left.
 */
export function flood_well(g, [x, y, z], o = {}) {
  const box = { x0: x, x1: x, y0: y, y1: y, z0: z, z1: z };
  const deck = o.over === true && g.blockAt(x, y, z) === "minecraft:polished_andesite";
  const w = writer(g, box, deck);
  w.set(x, y, z, "shroomlight");
  return w.out;
}

/**
 * A lamp post: andesite_wall three high from [x, y, z] (the base sits on a cheek or podium top), a standing lantern on
 * top at y + 3. andesite_wall is the 1.21.1 id (no polished_andesite_wall). o.over: replace occupied cells.
 */
export function lamp_post(g, [x, y, z], o = {}) {
  const box = { x0: x, x1: x, y0: y, y1: y + 3, z0: z, z1: z };
  const w = writer(g, box, o.over === true);
  for (let i = 0; i < 3; i++) w.set(x, y + i, z, "andesite_wall", { up: "true" });
  w.set(x, y + 3, z, "lantern", { hanging: "false" });
  return w.out;
}

/**
 * A flagpole: iron_bars six high from [x, y, z] (a post, no arms), with a red wall banner on its east face at the top
 * (y + 5), pointing east. o.over: replace occupied cells.
 */
export function flagpole(g, [x, y, z], o = {}) {
  const box = { x0: x, x1: x + 1, y0: y, y1: y + 5, z0: z, z1: z };
  const w = writer(g, box, o.over === true);
  for (let i = 0; i < 6; i++) w.set(x, y + i, z, "iron_bars", { north: "false", east: "false", south: "false", west: "false" });
  w.set(x + 1, y + 5, z, ...B.banner("red", [], { wall: true, facing: "east" }));
  return w.out;
}
