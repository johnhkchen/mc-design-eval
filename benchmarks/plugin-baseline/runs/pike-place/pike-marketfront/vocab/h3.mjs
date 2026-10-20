// Helpers from plan.md VOCABULARY (glassBay, shopDoor, cornice, glassRail, lampPost, stairFlight, glowStrip).
// Every helper takes its own position (and facing) as arguments, writes only inside the footprint it returns
// as `box`, and writes only into air unless { replace: true }. A refused write is listed in `refused`, never forced.
import { B, flight, guard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// One writer per helper: a cell outside the footprint throws (a bug), a non-air cell is refused unless replace.
function writer(g, box, replace) {
  const out = { box, placed: 0, refused: [] };
  const put = (x, y, z, block, state) => {
    if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1 || z < box.z0 || z > box.z1)
      throw new Error(`${block} at ${x},${y},${z} is outside the footprint ${JSON.stringify(box)}`);
    if (!replace && !g.isAir(x, y, z)) { out.refused.push([x, y, z, g.blockAt(x, y, z)]); return false; }
    g.set(x, y, z, block, state);
    out.placed++;
    return true;
  };
  return { put, out };
}

/** A glass bay on a west-facing wall. x is the face line: posts (z % 5 == 0) sit flush on it, panes 1 in at x + 1.
 *  Covers z0..z0+4 and F+1..F+5. kick: a gray_concrete kick row at F+1 (T2). panel: a flush gray_concrete panel
 *  instead of glass (its lanterns sit outside this footprint: the caller lights them). */
export function glassBay(g, { x, z0, F, kick = false, panel = false, replace = false }) {
  const box = { x0: x, x1: x + 1, y0: F + 1, y1: F + 5, z0, z1: z0 + 4 };
  const { put, out } = writer(g, box, replace);
  const pane = (z, y) => z >= z0 && z <= z0 + 4 && !(kick && y === F + 1);   // a neighbouring pane in this bay
  for (let z = z0; z <= z0 + 4; z++) for (let y = F + 1; y <= F + 5; y++) {
    const post = z % 5 === 0;
    if (panel) { put(x, y, z, "gray_concrete"); continue; }
    if (post) put(x, y, z, "stripped_spruce_log", { axis: "y" });
    if (kick && y === F + 1) put(x + 1, y, z, "gray_concrete");
    else put(x + 1, y, z, "glass_pane", { north: String(pane(z - 1, y)), east: "false", south: String(pane(z + 1, y)), west: String(post) });
  }
  return out;
}

/** A double door in a west-facing opening: two leaves side by side along z, hinges mirrored, each lower + upper half.
 *  (x, z) is the first leaf's cell at the bottom; the second leaf is at z + 1. */
export function shopDoor(g, { x, z, y, facing = "west", material = "spruce", replace = false }) {
  const box = { x0: x, x1: x, y0: y, y1: y + 1, z0: z, z1: z + 1 };
  const { put, out } = writer(g, box, replace);
  for (const [zz, hinge] of [[z, "left"], [z + 1, "right"]]) {
    put(x, y, zz, ...B.door(material, facing, "lower", hinge));
    put(x, y + 1, zz, ...B.door(material, facing, "upper", hinge));
  }
  return out;
}

/** A stepped quartz course at y projecting 1 on the west and east faces of box (plan M1), then a quartz_bricks
 *  parapet at y+1..y+2 around the box and a smooth_quartz coping at y+3. box: { x0, x1, z0, z1 }. The corbel
 *  stairs face outward, as plan.md says (the toolkit's cornice note says into the wall; see the summary). */
export function cornice(g, { box: w, y, replace = false }) {
  const box = { x0: w.x0 - 1, x1: w.x1 + 1, y0: y, y1: y + 3, z0: w.z0, z1: w.z1 };
  const { put, out } = writer(g, box, replace);
  for (let z = w.z0; z <= w.z1; z++) {
    put(w.x0 - 1, y, z, ...B.stairs("quartz", "west", "bottom"));
    put(w.x1 + 1, y, z, ...B.stairs("quartz", "east", "bottom"));
  }
  for (let x = w.x0; x <= w.x1; x++) for (let z = w.z0; z <= w.z1; z++) {
    if (!(x === w.x0 || x === w.x1 || z === w.z0 || z === w.z1)) continue;
    put(x, y + 1, z, "quartz_bricks");
    put(x, y + 2, z, "quartz_bricks");
    put(x, y + 3, z, "smooth_quartz");
  }
  return out;
}

/** A glass rail along one edge at y (the deck edge, walk level): from and to are [x, z] on one line (x or z equal).
 *  glass_pane between andesite_wall posts every 10 cells (the first at from). Panes connect to their neighbours
 *  along the rail only. */
export function glassRail(g, { from: [x0, z0], to: [x1, z1], y = 29, replace = false }) {
  if (x0 !== x1 && z0 !== z1) throw new Error("glassRail: from and to must share an x or a z");
  const alongZ = x0 === x1, dir = (alongZ ? Math.sign(z1 - z0) : Math.sign(x1 - x0)) || 1;
  const n = Math.max(Math.abs(z1 - z0), Math.abs(x1 - x0));
  const box = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: y, y1: y, z0: Math.min(z0, z1), z1: Math.max(z0, z1) };
  const { put, out } = writer(g, box, replace);
  const at = (t) => (alongZ ? [x0, z0 + dir * t] : [x0 + dir * t, z0]);
  const isPane = (t) => t >= 0 && t <= n && t % 10 !== 0;
  // the neighbour at +1 along the rail is south (or east) when the rail runs +z (or +x), north (west) otherwise
  const plus = alongZ ? (dir > 0 ? "south" : "north") : (dir > 0 ? "east" : "west");
  const minus = alongZ ? (dir > 0 ? "north" : "south") : (dir > 0 ? "west" : "east");
  for (let t = 0; t <= n; t++) {
    const [x, z] = at(t);
    if (t % 10 === 0) { put(x, y, z, "andesite_wall", { up: "true" }); continue; }
    const state = { north: "false", east: "false", south: "false", west: "false" };
    state[plus] = String(isPane(t + 1));
    state[minus] = String(isPane(t - 1));
    put(x, y, z, "glass_pane", state);
  }
  return out;
}

/** A lamp post: andesite_wall x3 at y..y+2 with a standing lantern on top (y+3). */
export function lampPost(g, { x, z, y, replace = false }) {
  const box = { x0: x, x1: x, y0: y, y1: y + 3, z0: z, z1: z };
  const { put, out } = writer(g, box, replace);
  for (let dy = 0; dy < 3; dy++) put(x, y + dy, z, "andesite_wall", { up: "true" });
  put(x, y + 3, z, "lantern", { hanging: "false" });
  return out;
}

/** A stair flight a player walks up without jumping (toolkit flight: from = first step's cell, facing = the way you
 *  walk up, to = the upper floor's layer). Solid polished_andesite under every tread down to the first solid block,
 *  a 1-wide polished_andesite cheek each side, and a smooth_stone landing at the top. Stays in air: the toolkit's
 *  flight runs through guard(), which refuses every write into a non-air cell. */
export function stairFlight(g, { from: [x, y, z], facing, to, width = 1, material = "polished_andesite_stairs", replace = false }) {
  const [dx, dz] = STEP[facing], [rx, rz] = [-dz, dx], base = material.replace(/_stairs$/, ""), n = to - y + 1;
  if (n < 1) throw new Error(`stairFlight: to (${to}) is below the first step (${y})`);
  // footprint: the steps, a cheek either side, the landing row; down to 24 below the first step; 2 over the top
  const cells = [];
  for (let i = 0; i <= n; i++) for (const w of [-1, width]) cells.push([x + dx * i + rx * w, z + dz * i + rz * w]);
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.max(0, y - 24), y1: to + 2, z0: Math.min(...zs), z1: Math.max(...zs) };
  const { put, out } = writer(g, box, replace);

  // the steps and headroom: toolkit flight through a guard that protects every non-air cell of the box
  const protect = new Set();
  for (let xx = box.x0; xx <= box.x1; xx++) for (let yy = box.y0; yy <= box.y1; yy++) for (let zz = box.z0; zz <= box.z1; zz++)
    if (!g.isAir(xx, yy, zz)) protect.add(`${xx},${yy},${zz}`);
  const guarded = guard(g, protect);
  const flown = flight(guarded, { from: [x, y, z], facing, to, material, width, stringer: false });
  for (let i = 0; i < n; i++) for (let w = 0; w < width; w++) if (!protect.has(`${x + dx * i + rx * w},${y + i},${z + dz * i + rz * w}`)) out.placed++;
  out.refused.push(...guarded.refused);
  out.notes = flown.notes;

  // solid under each tread and the cheeks: base blocks in air, from the layer below down to the first solid block
  const solidDown = (px, py, pz) => { for (let yy = py - 1; yy >= box.y0 && g.isAir(px, yy, pz); yy--) put(px, yy, pz, base); };
  for (let i = 0; i < n; i++) {
    for (const w of [-1, width]) { const px = x + dx * i + rx * w, pz = z + dz * i + rz * w; put(px, y + i, pz, base); solidDown(px, y + i, pz); }
    for (let w = 0; w < width; w++) solidDown(x + dx * i + rx * w, y + i, z + dz * i + rz * w);
  }
  // the top landing: smooth_stone at the upper floor's layer, solid under it
  for (let w = 0; w < width; w++) {
    const px = x + dx * n + rx * w, pz = z + dz * n + rz * w;
    put(px, to, pz, "smooth_stone");
    solidDown(px, to, pz);
  }
  out.landing = [x + dx * n, to + 1, z + dz * n];
  return out;
}

/** Lit strip behind glass: shroomlight / ochre_froglight alternating on the ceiling row y over x0..x1 x z0..z1, and a
 *  candle (lit) on the sill row y-1 along the glass-side column x0, every 3 cells, only where a block holds it.
 *  The strip is at most 4 deep (plan ROOMS). */
export function glowStrip(g, { x0, x1, z0, z1, y, replace = false }) {
  if (x1 - x0 + 1 > 4) throw new Error("glowStrip: a lit strip is 4 deep at most (plan ROOMS)");
  const box = { x0, x1, y0: y - 1, y1: y, z0, z1 };
  const { put, out } = writer(g, box, replace);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, y, z, (x + z) % 2 === 0 ? "shroomlight" : "ochre_froglight");
  for (let z = z0; z <= z1; z += 3) if (!g.isAir(x0, y - 2, z)) put(x0, y - 1, z, "candle", { candles: "1", lit: "true" });
  return out;
}
