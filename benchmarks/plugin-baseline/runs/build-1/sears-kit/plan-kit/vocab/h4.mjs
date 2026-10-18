// Sears row vocabulary, batch 4 (plan.md VOCABULARY items 4, 8, 12, 16, 18, 20, furniture).
// Every helper takes absolute coordinates and a footprint it derives from them. It writes only inside that footprint,
// only into air (a cell that is not air is skipped, never overwritten), and it never writes ground (y 0).
// chimneyStack is the one exception: chimney() lays the stack over the roof, and the band overwrites the stack's own masonry.
import { B, shutter, chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Inclusive box [x0, y0, z0, x1, y1, z1], corners in any order.
const norm = ([a, b, c, d, e, f]) => [Math.min(a, d), Math.min(b, e), Math.min(c, f), Math.max(a, d), Math.max(b, e), Math.max(c, f)];
const inside = (fp, x, y, z) => x >= fp[0] && y >= fp[1] && z >= fp[2] && x <= fp[3] && y <= fp[4] && z <= fp[5];
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

/** Place one block ([block, state, nbt] or [block]) at [x, y, z] if the cell is air. A write outside fp is a bug, so it throws. */
function place(g, fp, [x, y, z], [block, state, nbt], over = false) {
  if (!inside(fp, x, y, z)) throw new Error(`h4: ${block} at ${x},${y},${z} is outside its footprint ${fp.join(",")}`);
  if (!over && !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state, nbt);
  return true;
}

// ---- 4. clapboardWall -------------------------------------------------------------------------------------------------
/** A wall of body blocks over box [x0,y0,z0,x1,y1,z1] (one cell thick on a plan wall). The four corner columns take
 *  trim (corner boards); the row at bandY takes band (string course); cells inside a holes box stay air (openings).
 *  (courseSlab is not used: plan.md keeps full blocks.) */
export function clapboardWall(g, { box, body, trim = body, band = null, bandY = 5, holes = [] }) {
  const fp = norm(box), [x0, y0, z0, x1, y1, z1] = fp;
  const holed = (x, y, z) => holes.some((h) => inside(norm(h), x, y, z));
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (holed(x, y, z)) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const block = corner ? trim : band && y === bandY ? band : body;
    if (place(g, fp, [x, y, z], [block])) n++;
  }
  return n;
}

// ---- 8. shutterPair ---------------------------------------------------------------------------------------------------
/** Two open trapdoor shutters, 2 high, in the cell in front of the wall at x0 and x1 (either side of a window).
 *  face: the way the wall looks; trap: the wood ("dark_oak", "warped", "spruce"). Lays them with shutter(). */
export function shutterPair(g, { x0, x1, y, z, face, trap = "dark_oak" }) {
  const fp = norm([x0, y, z, x1, y + 1, z]);
  let n = 0;
  for (const x of new Set([fp[0], fp[3]])) {
    if (!g.isAir(x, y, z) || !g.isAir(x, y + 1, z)) continue;
    shutter(g, [x, y, z], face, trap, { height: 2 });
    n += 2;
  }
  return n;
}

// ---- 12. shapedParapet ------------------------------------------------------------------------------------------------
const PANE_ALONG_X = { north: "false", east: "true", south: "false", west: "true" };

/** A stepped parapet on the plan wall at z. steps: [[y, x0, x1], ...], bottom row first. piers: top y of the two square
 *  end piers that rise from the first row's ends (plan: x18 and x29 to y10). Each column's top cell is coping:
 *  brick_stairs turned toward a higher neighbour (rising inward), otherwise brick_slab. body fills the rest.
 *  vent: {x0, x1, y} glass panes set into the body. */
export function shapedParapet(g, { z, steps, piers = null, vent = null, body = "white_terracotta", coping = "brick" }) {
  const span = new Map(); // x -> Set of outline y
  const add = (x, y) => { if (!span.has(x)) span.set(x, new Set()); span.get(x).add(y); };
  const rows = steps.map(([y, a, b]) => [y, Math.min(a, b), Math.max(a, b)]);
  for (const [y, a, b] of rows) for (let x = a; x <= b; x++) add(x, y);
  if (piers != null) for (const x of [rows[0][1], rows[0][2]]) for (let y = rows[0][0] + 1; y <= piers; y++) add(x, y);
  const top = new Map([...span].map(([x, ys]) => [x, Math.max(...ys)]));
  const ys = [...span.values()].flatMap((s) => [...s]);
  const fp = [Math.min(...span.keys()), Math.min(...ys), z, Math.max(...span.keys()), Math.max(...top.values()), z];
  let n = 0;
  for (const [x, cells] of span) for (const y of cells) {
    if (vent && x >= vent.x0 && x <= vent.x1 && y === vent.y) { if (place(g, fp, [x, y, z], ["glass_pane", PANE_ALONG_X])) n++; continue; }
    if (y < top.get(x)) { if (place(g, fp, [x, y, z], [body])) n++; continue; }
    const t = top.get(x), west = top.get(x - 1) ?? -Infinity, east = top.get(x + 1) ?? -Infinity;
    const block = east > t && west <= t ? B.stairs(coping, "east", "bottom")
      : west > t && east <= t ? B.stairs(coping, "west", "bottom")
      : B.slab(coping, "bottom");
    if (place(g, fp, [x, y, z], block)) n++;
  }
  return n;
}

// ---- 16. rafterTails --------------------------------------------------------------------------------------------------
/** Exposed rafter tails along an eave course at row z (beyond the wall line), x0..x1: alternate cells, a flat wood
 *  trapdoor then a wood stair lip, both turned to face into (the way to the wall). */
export function rafterTails(g, { x0, x1, z, y, into = "south", wood = "spruce" }) {
  const fp = norm([x0, y, z, x1, y, z]);
  let n = 0;
  for (let x = fp[0]; x <= fp[3]; x++) {
    const tail = (x - fp[0]) % 2 === 0 ? B.trapdoor(wood, into, "top", false) : B.stairs(wood, into, "top");
    if (place(g, fp, [x, y, z], tail)) n++;
  }
  return n;
}

// ---- 18. pedimentPorch ------------------------------------------------------------------------------------------------
/** Pedimented entry porch (plan: Puritan), 3 cells wide: deck at y, two pillars at x0 and x1 on the front row
 *  (y+1..y+3), entablature at y+4, a tympanum at the centre of y+5 with stair rakes either side, peak at y+6.
 *  facing: north (front row z0) or south (front row z1). trim: "quartz" gives quartz_pillar, quartz_stairs, smooth_quartz. */
export function pedimentPorch(g, { x0, x1, z0, z1, y = 1, facing = "north", trim = "quartz" }) {
  const fp = norm([x0, y, z0, x1, y + 6, z1]);
  if (fp[3] - fp[0] !== 2) throw new Error("pedimentPorch: the plan's porch is 3 cells wide (two pillars, one peak)");
  const fz = facing === "south" ? fp[5] : fp[2], [xa, xb, xm] = [fp[0], fp[3], fp[0] + 1], block = `smooth_${trim}`;
  let n = 0;
  for (let x = fp[0]; x <= fp[3]; x++) for (let z = fp[2]; z <= fp[5]; z++) if (place(g, fp, [x, y, z], [block])) n++;
  for (const x of [xa, xb]) for (let k = 1; k <= 3; k++) if (place(g, fp, [x, y + k, fz], [`${trim}_pillar`, { axis: "y" }])) n++;
  for (let x = fp[0]; x <= fp[3]; x++) if (place(g, fp, [x, y + 4, fz], [block])) n++;
  if (place(g, fp, [xa, y + 5, fz], B.stairs(trim, "east", "bottom"))) n++;
  if (place(g, fp, [xb, y + 5, fz], B.stairs(trim, "west", "bottom"))) n++;
  if (place(g, fp, [xm, y + 5, fz], [block])) n++;
  if (place(g, fp, [xm, y + 6, fz], [block])) n++;
  return n;
}

// ---- 20. chimneyStack -------------------------------------------------------------------------------------------------
/** A brick chimney through chimney() (wall + into, or at + open, as chimney takes them), then this helper's courses:
 *  a deepslate_bricks band on the stack's four faces one course under the top, and a brick_slab cap ring on top that
 *  steps out by 1 (the flue cell stays open). chimney() writes hay under the fire at y 0, which is ground, so that is
 *  left out unless hay is true. The band overwrites the stack's own masonry; the cap writes only into air. */
export function chimneyStack(g, { wall = null, into = null, at = null, open = "south", top, hay = false }) {
  const [dx, dz] = wall ? STEP[into] : [0, 0];
  const [fx, , fz] = wall ? [wall[0] - dx, wall[1], wall[2] - dz] : at;
  const fp = [fx - 1, 1, fz - 1, fx + 1, top + 1, fz + 1];
  // chimney() only reads and sets through g; the shim drops writes to ground (y 0) unless hay.
  const shim = { get: (...a) => g.get(...a), inBounds: (...a) => g.inBounds(...a), set: (x, y, z, b, s, nbt) => (y >= 1 || hay ? g.set(x, y, z, b, s, nbt) : null) };
  chimney(shim, wall ? { wall, into, top, material: "bricks" } : { at, open, top, material: "bricks" });
  let n = 0;
  for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (place(g, fp, [fx + ox, top - 1, fz + oz], ["deepslate_bricks"], true)) n++;
  for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
    if (!ox && !oz) continue;
    if (place(g, fp, [fx + ox, top + 1, fz + oz], B.slab("brick", "bottom"))) n++;
  }
  return n;
}

// ---- furniture for designers ------------------------------------------------------------------------------------------
/** A kitchen run along x: smoker, furnace and barrel at feet level y (x..x+2 at row z), a bottom-slab counter on top.
 *  facing: the way the front looks, into the room. The run is three cells wide to fit the 3-wide P0 kitchen; the cell
 *  row in front of it is left clear. */
export function kitchenStove(g, { x, y, z, facing = "north", wood = "oak" }) {
  const fp = norm([x, y, z, x + 2, y + 1, z]);
  let n = 0;
  if (place(g, fp, [x, y, z], ["smoker", { facing, lit: "false" }])) n++;
  if (place(g, fp, [x + 1, y, z], ["furnace", { facing, lit: "false" }])) n++;
  if (place(g, fp, [x + 2, y, z], ["barrel", { facing: "up", open: "false" }])) n++;
  for (let dx = 0; dx <= 2; dx++) if (place(g, fp, [x + dx, y + 1, z], B.slab(wood, "bottom"))) n++;
  return n;
}

/** A coat rack: a fence post at feet level with a standing banner on top, its cloth turned to facing. */
export function coatRack(g, { x, y, z, facing = "north", color = "brown", wood = "spruce" }) {
  const fp = norm([x, y, z, x, y + 1, z]);
  const rotation = { south: 0, west: 4, north: 8, east: 12 }[facing] ?? 8;
  if (!place(g, fp, [x, y, z], B.fence(wood))) return 0;
  return 1 + (place(g, fp, [x, y + 1, z], B.banner(color, [], { wall: false, rotation })) ? 1 : 0);
}
