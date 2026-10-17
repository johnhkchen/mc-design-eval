// Helpers for plan.md VOCABULARY (part h1): laneRow, pierRow, shaftFrame, lancet, bellCupola, balcony, wheelStand,
// sackStack, bedAt. Each takes its position (and facing) as arguments and returns { placed, refused }.
// Every write goes through writer(): it must land inside the helper's own footprint, and only into air unless the
// caller passes { replace: true }. A cell the rule keeps it from writing is listed in refused, never thrown.
// States are written as 26.3 has them: B.stairs / B.slab / B.trapdoor add waterlogged/powered keys that these blocks
// don't have, so the stairs, slabs, trapdoors, panes, bars, bell and rod are written here with exact states.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const PANE = { north: "true", south: "true", east: "false", west: "false" };

const stairs = (mat, facing, half = "bottom") => [`${mat}_stairs`, { facing, half, shape: "straight" }];
const slab = (mat, type = "bottom") => [`${mat}_slab`, { type }];
const trapdoor = (mat, facing, open = true) => [`${mat}_trapdoor`, { facing, half: "bottom", open: String(open) }];
const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// The one write path: [x0, y0, z0, x1, y1, z1] is the footprint; air only unless replace.
function writer(g, box, { replace = false } = {}) {
  const out = { placed: 0, refused: [] };
  const put = (x, y, z, [block, state]) => {
    if (!inside(box, x, y, z)) throw new Error(`outside its footprint: ${x},${y},${z} not in ${box}`);
    if (!replace && !g.isAir(x, y, z)) return out.refused.push([x, y, z]);
    g.set(x, y, z, block, state);
    out.placed++;
  };
  return { put, out };
}

/** Lane row at y0, z0..z0+4 (default z0 0): gravel centre, coarse ruts (gravel every third column), coarse edges. */
export function laneRow(g, x0, x1, { z0 = 0, replace = false } = {}) {
  const w = writer(g, [x0, 0, z0, x1, 0, z0 + 4], { replace });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z0 + 4; z++) {
    const centre = z === z0 + 2, edge = z === z0 || z === z0 + 4, gap = (x - x0) % 3 === 2;
    w.put(x, 0, z, B.block(centre || (!edge && gap) ? "gravel" : "coarse_dirt"));
  }
  return w.out;
}

/** Cobblestone piers in one row at height y: every third cell from x0, and always the far end x1. Air between. */
export function pierRow(g, x0, x1, z, y, opts = {}) {
  const w = writer(g, [x0, y, z, x1, y, z], opts);
  for (let x = x0; x <= x1; x++) if ((x - x0) % 3 === 0 || x === x1) w.put(x, y, z, B.block("cobblestone"));
  return w.out;
}

/** 3x3 floor frame of stripped_spruce_wood at y, hole at the centre (not written; the ground part digs it).
 *  port: also the framed 1x1 shaft port in the wall at (x+4, y+2, z+1), the frame around it set into the wall. */
export function shaftFrame(g, x, y, z, { port = false, replace = false } = {}) {
  const w = writer(g, [x, y, z, x + (port ? 4 : 2), y + (port ? 3 : 0), z + 2], { replace });
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) if (dx !== 1 || dz !== 1) w.put(x + dx, y, z + dz, B.wood("stripped_spruce"));
  if (port) {
    for (const [dx, dy, dz] of [[4, 1, 1], [4, 3, 1], [4, 2, 0], [4, 2, 2]]) w.put(x + dx, y + dy, z + dz, B.wood("stripped_spruce"));
  }
  return w.out;
}

/** Lancet window in the wall plane x: sill slab at y0, 1-wide glass y0+1..y1, a pair of upside-down stairs over it at
 *  y1+1 (z-1 and z+1), backs toward `into` (the side the room is on). */
export function lancet(g, x, z, y0, y1, { into = "east", material = "stone_brick", replace = false } = {}) {
  const w = writer(g, [x, y0, z - 1, x, y1 + 1, z + 1], { replace });
  w.put(x, y0, z, slab(material, "bottom"));
  for (let y = y0 + 1; y <= y1; y++) w.put(x, y, z, ["glass_pane", PANE]);
  for (const dz of [-1, 1]) w.put(x, y1 + 1, z + dz, stairs(material, into, "top"));
  return w.out;
}

/** Bell cupola, 4x4 at x..x+3, z..z+3, from base level y (plan: 11) to the lightning rod at y+8 (19).
 *  Solid white concrete base y..y+2 (through the roof: replace), pale oak posts at the corners y+3..y+4, open louvres
 *  on the lower course of each side, a bell hung from the andesite deck at y+5 (attachment ceiling, bell at y+4),
 *  then a stepped cone: stairs ring at y+6 backed to the centre, a full centre column to y+7, rod at y+8. */
export function bellCupola(g, x, y, z, { replace = false } = {}) {
  const w = writer(g, [x, y, z, x + 3, y + 8, z + 3], { replace });
  const edge = (dx, dz) => dx === 0 || dx === 3 || dz === 0 || dz === 3;
  const corner = (dx, dz) => (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) for (let dy = 0; dy < 3; dy++) w.put(x + dx, y + dy, z + dz, B.block("white_concrete"));
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) if (corner(dx, dz)) for (const dy of [3, 4]) w.put(x + dx, y + dy, z + dz, B.fence("pale_oak"));
  // louvres: the middle two cells of each side on the lower course, facing outward so each lies on its wall
  const louvres = [[1, 0, "north"], [2, 0, "north"], [1, 3, "south"], [2, 3, "south"], [0, 1, "west"], [0, 2, "west"], [3, 1, "east"], [3, 2, "east"]];
  for (const [dx, dz, f] of louvres) w.put(x + dx, y + 3, z + dz, trapdoor("spruce", f, true));
  w.put(x + 1, y + 4, z + 1, ["bell", { attachment: "ceiling", facing: "north" }]);
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) w.put(x + dx, y + 5, z + dz, slab("andesite", "bottom"));
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
    if (!edge(dx, dz)) continue;
    // stair backs face the centre: a z-row cell steps toward the other z-row, an x-column cell toward the other column
    const facing = dz === 0 ? "south" : dz === 3 ? "north" : dx === 0 ? "east" : "west";
    w.put(x + dx, y + 6, z + dz, stairs("andesite", facing, "bottom"));
  }
  for (let dx = 1; dx <= 2; dx++) for (let dz = 1; dz <= 2; dz++) for (const dy of [6, 7]) w.put(x + dx, y + dy, z + dz, B.block("andesite"));
  w.put(x + 1, y + 8, z + 1, ["lightning_rod", { facing: "up", powered: "false" }]);
  return w.out;
}

/** Rear balcony: a 4x2 mangrove deck at y (plan: 6) over x..x+3, z..z+1 (the outer row is z+1; the wall is z-1). Pale oak
 *  posts at the outer corners down to y-5, upside-down stair brackets under the deck at the wall, a pale oak rail on
 *  the outer row and the two ends. */
export function balcony(g, x, y, z, opts = {}) {
  const w = writer(g, [x, y - 5, z, x + 3, y + 1, z + 1], opts);
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 2; dz++) w.put(x + dx, y, z + dz, B.block("mangrove_planks"));
  for (const dx of [0, 3]) {
    for (let dy = 1; dy <= 5; dy++) w.put(x + dx, y - dy, z + 1, B.log("pale_oak"));
    w.put(x + dx, y - 1, z, stairs("pale_oak", "north", "top"));
  }
  for (let dx = 0; dx < 4; dx++) w.put(x + dx, y + 1, z + 1, B.fence("pale_oak"));
  for (const dx of [0, 3]) w.put(x + dx, y + 1, z, B.fence("pale_oak"));
  return w.out;
}

/** Wheel on edge on a 3x3 stand, its disc in the z+1 plane: a ring of iron bars round a spruce fence hub. Takes y..y+2. */
export function wheelStand(g, x, y, z, opts = {}) {
  const w = writer(g, [x, y, z, x + 2, y + 2, z + 2], opts);
  for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) {
    if (dx === 1 && dy === 1) continue;
    w.put(x + dx, y + dy, z + 1, ["iron_bars", { north: "false", south: "false", east: String(dx < 2), west: String(dx > 0) }]);
  }
  w.put(x + 1, y + 1, z + 1, B.fence("spruce"));
  return w.out;
}

/** Sack stack 2x2 at y..y+1: hay bales, with white wool on two diagonal tops. */
export function sackStack(g, x, y, z, opts = {}) {
  const w = writer(g, [x, y, z, x + 1, y + 1, z + 1], opts);
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) w.put(x + dx, y, z + dz, B.pillar("hay_block", "y"));
  w.put(x, y + 1, z, B.block("white_wool"));
  w.put(x + 1, y + 1, z + 1, B.block("white_wool"));
  return w.out;
}

/** A bed at foot [x,y,z], head one step toward facing (against a solid wall). Places nothing unless the bed fits:
 *  both cells air, the wall past the head solid, the 2 cells above foot and head clear, and the 2-high lane past the
 *  foot (the cells behind it at y and y+1) clear. Returns { placed: 2 } or { placed: 0, refused: [the blocking cells] }. */
export function bedAt(g, [x, y, z], facing = "north", colour = "red") {
  const [dx, dz] = STEP[facing];
  const foot = [x, y, z], head = [x + dx, y, z + dz];
  const air = (c) => g.isAir(...c);
  const need = [
    [foot, air], [head, air],
    [[x, y + 1, z], air], [[x, y + 2, z], air], [[head[0], y + 1, head[2]], air], [[head[0], y + 2, head[2]], air],
    [[head[0] + dx, y, head[2] + dz], (c) => !air(c)],
    [[x - dx, y, z - dz], air], [[x - dx, y + 1, z - dz], air],
  ];
  const refused = need.filter(([c, ok]) => !ok(c)).map(([c]) => c);
  if (refused.length) return { placed: 0, refused };
  g.set(x, y, z, `${colour}_bed`, { facing, part: "foot" });
  g.set(head[0], y, head[2], `${colour}_bed`, { facing, part: "head" });
  return { placed: 2, refused: [] };
}
