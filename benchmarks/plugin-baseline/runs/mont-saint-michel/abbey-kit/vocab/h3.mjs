// Seven helpers from plan.md VOCABULARY: round_window, buttress, octagon_ring, archangel, mullion_window,
// round_turret, lamp. Each takes the grid g first, then its position (and face) as arguments.
// Every write goes through painter(): it lands only inside the helper's footprint box and only into air, unless
// opts.replace. A refused cell is listed in the result, never thrown. Block ids are plan.md PALETTE (1.21.1).
import { DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const span = (...v) => [Math.min(...v), Math.max(...v)];
// the horizontal step across a wall facing f (a row of cells runs along it)
const along = (f) => (DIRS[f][0] !== 0 ? [0, 0, 1] : [1, 0, 0]);
const stairs = (facing, half = "bottom") => ({ facing, half, shape: "straight", waterlogged: "false" });
// glass pane on a wall facing f: it connects along the wall, not across it
const paneState = (f) => { const ew = along(f)[0] === 1; return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew) }; };

/** Writer for one footprint box: writes only inside it and only into air (or over solids with opts.replace). */
function painter(g, box, opts = {}) {
  const r = { placed: 0, refused: [] };
  const [x0, x1, y0, y1, z0, z1] = box;
  const set = (x, y, z, block, state) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (inside && g.inBounds(x, y, z) && (opts.replace || g.isAir(x, y, z))) { g.set(x, y, z, block, state); r.placed++; }
    else r.refused.push([x, y, z]);
  };
  return { set, r };
}

/** A 1 x 3 round-arched window in a wall facing f, at its bottom cell (x, y, z) in the wall plane. The opening stays air
 *  (the wall part leaves it open); glass set back one cell inside; slab sill proud below; upside-down stair head proud
 *  above. */
export function round_window(g, x, y, z, f, opts = {}) {
  const [ox, , oz] = DIRS[f];
  const [x0, x1] = span(x, x + ox, x - ox), [z0, z1] = span(z, z + oz, z - oz);
  const { set, r } = painter(g, [x0, x1, y - 1, y + 3, z0, z1], opts);
  for (let j = 0; j < 3; j++) {
    if (!g.isAir(x, y + j, z)) r.refused.push([x, y + j, z]);
    set(x - ox, y + j, z - oz, "gray_stained_glass_pane", paneState(f));
  }
  set(x + ox, y - 1, z + oz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  set(x + ox, y + 3, z + oz, "stone_brick_stairs", stairs(face.opposite(f), "top"));
  return r;
}

/** A 2-wide, 3-tall mullioned window in a wall facing f, at its bottom outer cell (x, y, z): opening stays air; a
 *  stone_brick_wall transom across the middle row; glass in the two outer rows set back inside; slab sill and stair
 *  head proud. */
export function mullion_window(g, x, y, z, f, opts = {}) {
  const [ox, , oz] = DIRS[f], [ax, , az] = along(f);
  const at = (k, j, d) => [x + k * ax + d * ox, y + j, z + k * az + d * oz];   // k across, j up, d out (+1) / in (-1)
  const cells = [];
  for (let k = 0; k < 2; k++) for (let j = -1; j <= 3; j++) for (let d = -1; d <= 1; d++) cells.push(at(k, j, d));
  const { set, r } = painter(g, [...span(...cells.map((c) => c[0])), ...span(...cells.map((c) => c[1])), ...span(...cells.map((c) => c[2]))], opts);
  // transom wall: low on the two ends along the wall, unset (none) across it
  const rail = along(f)[0] === 1 ? { east: "low", west: "low" } : { north: "low", south: "low" };
  for (let k = 0; k < 2; k++) {
    for (let j = 0; j < 3; j++) if (!g.isAir(...at(k, j, 0))) r.refused.push(at(k, j, 0));
    set(...at(k, 1, 0), "stone_brick_wall", { up: "true", ...rail });                   // transom, middle row
    for (const j of [0, 2]) set(...at(k, j, -1), "gray_stained_glass_pane", paneState(f));   // glass set back
    set(...at(k, -1, 1), "stone_brick_slab", { type: "top", waterlogged: "false" });   // proud sill
    set(...at(k, 3, 1), "stone_brick_stairs", stairs(face.opposite(f), "top"));        // proud head
  }
  return r;
}

/** Octagon ring of radius r about (cx, cz) at height y: the outline of a regular octagon (flat sides, corners cut).
 *  opts.block: the ring block (default polished_deepslate). */
export function octagon_ring(g, cx, cz, r, y, opts = {}) {
  const block = opts.block ?? "polished_deepslate", s = r + Math.floor(r / 2);
  const inside = (dx, dz) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= s;
  const { set, r: out } = painter(g, [cx - r, cx + r, y, y, cz - r, cz + r], opts);
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (!inside(dx, dz)) continue;
    if (!inside(dx + 1, dz) || !inside(dx - 1, dz) || !inside(dx, dz + 1) || !inside(dx, dz - 1)) set(cx + dx, y, cz + dz, block, {});
  }
  return out;
}

/** A buttress 2 wide: (x, z) is its cell touching the wall; it grows `opts.depth` (default 2) cells out along
 *  `opts.face` (default north). Stone_bricks column from y0 to y1; the outer cell is a stair course at the setbacks
 *  (y 22 and y 38) and at the top (sloped). */
export function buttress(g, x, z, y0, y1, opts = {}) {
  const f = opts.face ?? "north", depth = opts.depth ?? 2, [ox, , oz] = DIRS[f], [ax, , az] = along(f);
  const cell = (i, k) => [x + i * ax + k * ox, z + i * az + k * oz];
  const xs = [], zs = [];
  for (let i = 0; i < 2; i++) for (let k = 0; k < depth; k++) { const [cx, cz] = cell(i, k); xs.push(cx); zs.push(cz); }
  const { set, r } = painter(g, [...span(...xs), y0, y1, ...span(...zs)], opts);
  for (let y = y0; y <= y1; y++) for (let i = 0; i < 2; i++) for (let k = 0; k < depth; k++) {
    const [cx, cz] = cell(i, k);
    const ledge = k === depth - 1 && (y === 22 || y === 38 || y === y1);
    if (ledge) set(cx, y, cz, "stone_brick_stairs", stairs(face.opposite(f)));
    else set(cx, y, cz, "stone_bricks", {});
  }
  return r;
}

/** St Michael per plan.md ROOFS ANGEL, centred on (cx, cz) with the pedestal at yPed (143): the figure runs to yPed+8
 *  (151); the sword tip is the build's highest block, so anything above 151 throws. Offsets are the plan's own. */
export function archangel(g, cx, cz, yPed = 143, opts = {}) {
  const top = yPed + 8;
  if (top > 151) throw new Error(`archangel: top ${top} is above y 151`);
  const { set, r } = painter(g, [cx - 1, cx + 1, yPed, top, cz - 1, cz + 1], opts);
  const gold = (x, y, z) => set(x, y, z, "gold_block", {});
  gold(cx, yPed, cz);                                                    // pedestal
  for (let y = yPed + 1; y <= yPed + 5; y++) gold(cx, y, cz);            // legs, torso, head
  for (let y = yPed + 3; y <= yPed + 6; y++) { gold(cx - 1, y, cz - 1); gold(cx - 1, y, cz + 1); }   // wings
  gold(cx + 1, yPed + 5, cz);                                            // raised arm
  for (let y = yPed + 6; y <= top; y++) set(cx + 1, y, cz, "lightning_rod", { facing: "up", powered: "false" });   // sword
  set(cx, yPed + 1, cz + 1, "blackstone_slab", { type: "bottom", waterlogged: "false" });        // dragon under the feet
  set(cx + 1, yPed + 1, cz + 1, "blackstone_slab", { type: "bottom", waterlogged: "false" });
  return r;
}

/** Round turret shell of radius r about (cx, cz), from yFoot to yTop, 1.5 thick: cobblestone base (two courses),
 *  stone_bricks above, a merlon parapet at yTop + 1. opts.front = a direction name for a half-round front on that
 *  side (the Châtelet's south fronts); omitted = full ring. */
export function round_turret(g, cx, cz, r, yFoot, yTop, opts = {}) {
  const R = Math.ceil(r), front = opts.front ? DIRS[opts.front] : null;
  const { set, r: out } = painter(g, [cx - R, cx + R, yFoot, yTop + 1, cz - R, cz + R], opts);
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
    const d = Math.hypot(dx, dz);
    if (d > r || d <= r - 1.5) continue;
    if (front && dx * front[0] + dz * front[2] < 0) continue;
    for (let y = yFoot; y <= yTop; y++) set(cx + dx, y, cz + dz, y < yFoot + 2 ? "cobblestone" : "stone_bricks", {});
    if (Math.abs(dx + dz) % 2 === 0) set(cx + dx, yTop + 1, cz + dz, "stone_brick_wall", { up: "true" });
  }
  return out;
}

/** A lantern, standing on the block below it, or hanging from the block above (opts.hang). Refused with no support. */
export function lamp(g, x, y, z, opts = {}) {
  const hang = !!opts.hang;
  const { set, r } = painter(g, [x, x, y, y, z, z], opts);
  if (g.isAir(x, hang ? y + 1 : y - 1, z)) { r.refused.push([x, y, z]); r.reason = `no block ${hang ? "above" : "below"}`; return r; }
  set(x, y, z, "lantern", { hanging: String(hang), waterlogged: "false" });
  return r;
}
