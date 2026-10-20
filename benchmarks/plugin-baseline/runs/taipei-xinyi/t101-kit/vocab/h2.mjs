// vocab/h2.mjs: the nine plan.md VOCABULARY helpers this session owns (glassCell, ledgeSlab, litWindow, coin,
// mallMass, canopy, roofGarden, capStep, deckLights). Written to plan.md as specified.
//
// Conventions every helper keeps:
//   - positions are grid (structure-local) x/y/z; a rect is {x0, z0, x1, z1}, inclusive; a box adds y0 (and y1)
//   - a write goes only into air and inside the grid (g.isAir); any other cell is left alone and not counted
//   - nothing is written under the helper's own footprint (no ground, sand or floor); an option named in the call
//     is the only exception
//   - leaves are persistent=true; no helper here hangs a light, places a door, or places furniture
import { DIRS, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CONCRETE = "light_gray_concrete";
const LEAF = ["oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
const UPDOWN = { up: [0, 1, 0], down: [0, -1, 0] };
// Floor-line rows of a module, by plan.md: pedestal y ≡ 2 (mod 6); segment y 0, 6 … 42.
const FLOOR = { pedestal: (y) => y % 6 === 2, segment: (y) => y % 6 === 0 };

// ---- private geometry and the write rule --------------------------------------------------------------------------
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const insetRect = (r, k) => ({ x0: r.x0 + k, z0: r.z0 + k, x1: r.x1 - k, z1: r.z1 - k });
// Distance to the nearer edge of lo..hi: for a cell on a face this is its along-face offset from the corner.
const edgeDist = (v, lo, hi) => Math.min(v - lo, hi - v);
// Notch cells left out per corner: double sawtooth (a<2&&b<4 or a<4&&b<2), or the crown's single 2x2 corner.
const notchedAt = (dx, dz, kind) => (kind === "single" ? dx < 2 && dz < 2 : (dx < 2 && dz < 4) || (dx < 4 && dz < 2));
function inPlan(r, x, z, notch) {
  if (!inRect(r, x, z)) return false;
  return !notch || !notchedAt(edgeDist(x, r.x0, r.x1), edgeDist(z, r.z0, r.z1), notch);
}
// The rect's outline, walked once around (1 thick). Degenerate rects (one row or column) are handled.
function outline(r) {
  const out = [];
  if (r.x1 < r.x0 || r.z1 < r.z0) return out;
  for (let x = r.x0; x <= r.x1; x++) out.push([x, r.z0]);
  for (let z = r.z0 + 1; z <= r.z1; z++) out.push([r.x1, z]);
  if (r.z1 > r.z0) for (let x = r.x1 - 1; x >= r.x0; x--) out.push([x, r.z1]);
  if (r.x1 > r.x0) for (let z = r.z1 - 1; z > r.z0; z--) out.push([r.x0, z]);
  return out;
}
// The one write rule: into air, inside the grid, otherwise nothing. Returns whether the block went in.
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

// ---- glass grid ---------------------------------------------------------------------------------------------------
/**
 * The block for one wall cell of a band, placed into air. Returns the block id, or null if the cell was not air.
 * ctx: { box: {x0,z0,x1,z1} (the module's outer box), inset (the band's ring, 0 = outer), kind: "pedestal" |
 * "segment" (the floor-line rule), floor(y) (overrides kind, e.g. a pinnacle's bands), body, under (the glass ids;
 * default cyan_stained_glass and light_blue_stained_glass; a pinnacle swaps them) }.
 * Order (plan.md): floor line, mullion (box-local x on N/S faces or z on E/W faces, ≡ 1 mod 4), outer noses
 * (4,0) and (0,4), corner froglight (2,2), course under a floor line, body.
 */
export function glassCell(g, x, y, z, ctx) {
  const ring = insetRect(ctx.box, ctx.inset ?? 0);
  const floor = ctx.floor ?? FLOOR[ctx.kind ?? "pedestal"];
  const dx = edgeDist(x, ring.x0, ring.x1), dz = edgeDist(z, ring.z0, ring.z1);
  const bx = x - ctx.box.x0, bz = z - ctx.box.z0;
  let block, state;
  if (floor(y)) block = "dark_prismarine";
  else if ((dz === 0 && bx % 4 === 1) || (dx === 0 && bz % 4 === 1)) block = CONCRETE;
  else if ((dx === 4 && dz === 0) || (dx === 0 && dz === 4)) block = CONCRETE;
  else if (dx === 2 && dz === 2) {
    block = "ochre_froglight";
    state = B.pillar(block, "y")[1];
  } else block = floor(y + 1) ? (ctx.under ?? "light_blue_stained_glass") : (ctx.body ?? "cyan_stained_glass");
  return put(g, x, y, z, block, state) ? block : null;
}

// ---- slabs and ledges ---------------------------------------------------------------------------------------------
/**
 * A solid flat slab over the notched plan of box at height y, placed into air.
 * box: {x0,z0,x1,z1}; top: light_gray_concrete | smooth_quartz | smooth_stone; notch: "double" | "single" | false;
 * lanternRing: an inset k, where sea_lantern goes flush in the slab on every `every`-th cell of that ring.
 */
export function ledgeSlab(g, { box, y, notch = false, top = "smooth_stone", lanternRing, every = 5 }) {
  const lanterns = new Set();
  if (lanternRing != null) {
    outline(insetRect(box, lanternRing))
      .filter(([x, z]) => inPlan(box, x, z, notch))
      .forEach(([x, z], i) => { if (i % every === 0) lanterns.add(`${x},${z}`); });
  }
  let n = 0;
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (!inPlan(box, x, z, notch)) continue;
    n += put(g, x, y, z, lanterns.has(`${x},${z}`) ? "sea_lantern" : top) ? 1 : 0;
  }
  return n;
}

/**
 * A lit window: a froglight in the cell `inward` of the glass cell at [x, y, z], placed into air.
 * inward: a direction name (north | south | east | west | up | down) or a [dx, dy, dz] step; kind: "warm"
 * (ochre_froglight) or "cool" (pearlescent_froglight). Returns true if placed.
 */
export function litWindow(g, [x, y, z], inward, kind) {
  const step = Array.isArray(inward) ? inward : (DIRS[inward] ?? UPDOWN[inward]);
  const block = { warm: "ochre_froglight", cool: "pearlescent_froglight" }[kind];
  if (!step || !block) throw new Error(`litWindow: bad inward ${inward} or kind ${kind}`);
  const [id, state] = B.pillar(block, "y");
  return put(g, x + step[0], y + step[1], z + step[2], id, state);
}

// ---- medallions ---------------------------------------------------------------------------------------------------
/**
 * A giant coin on a wall: a disc of radius 11 two blocks proud of the wall. face: north | south | east | west.
 * center: [x, y, z] of the disc centre; the wall plane is center's coordinate on the face's axis (z for north and
 * south, x for east and west), and the disc sits outward of it. Rim (r >= 9) gold_block; a 6x6 hole open through
 * both layers (the glass shows through) framed by a 1-cell gold_block border; yellow_terracotta at r 6..7.5;
 * raw_gold_block field. opts.wallAt(y): the wall plane at row y when the wall steps; the gap behind the disc is
 * filled with raw_gold_block.
 */
export function coin(g, face, center, { wallAt } = {}) {
  const planeAxis = face === "north" || face === "south" ? 2 : 0;
  const inAxis = planeAxis === 2 ? 0 : 2;
  const s = face === "south" || face === "east" ? 1 : -1;
  const wall = center[planeAxis], cIn = center[inAxis], cy = center[1];
  const at = (plane, u, v) => {
    const p = [0, v, 0];
    p[planeAxis] = plane;
    p[inAxis] = u;
    return p;
  };
  let n = 0;
  for (let u = Math.floor(cIn - 11); u <= Math.ceil(cIn + 11); u++) {
    for (let v = Math.floor(cy - 11); v <= Math.ceil(cy + 11); v++) {
      const dx = u - cIn, dy = v - cy, r = Math.hypot(dx, dy);
      if (r > 11) continue;
      if (Math.abs(dx) <= 2.5 && Math.abs(dy) <= 2.5) continue;          // the 6x6 hole stays open
      const frame = Math.abs(dx) <= 3.5 && Math.abs(dy) <= 3.5;
      const block = r >= 9 || frame ? "gold_block" : r >= 6 && r <= 7.5 ? "yellow_terracotta" : "raw_gold_block";
      for (let k = 1; k <= 2; k++) n += put(g, ...at(wall + s * k, u, v), block) ? 1 : 0;
      const row = wallAt ? wallAt(v) : wall;
      for (let k = 1; k < (wall + s - row) * s; k++) n += put(g, ...at(row + s * k, u, v), "raw_gold_block") ? 1 : 0;
    }
  }
  return n;
}

// ---- mall ---------------------------------------------------------------------------------------------------------
/**
 * A mall mass: walls on the footprint's outer ring from box.y0 up to the deck, a floor slab every 11 courses from
 * box.y0 (2, 13, 24 … below the deck), a solid deck at deckY with a coping ring at its edge, and roofSpec.parapet
 * courses of coping on the ring above it. box: {x0, y0, z0, x1, z1}. roofSpec: { parapet = 1, coping = "smooth_quartz",
 * wall = "smooth_stone", floor = "smooth_stone" (a bottom slab), deck = "smooth_stone", plan = (x, z) => bool } where
 * plan is the footprint mask (the `#` cells); the default footprint is the whole box.
 */
export function mallMass(g, box, deckY, roofSpec = {}) {
  const o = { parapet: 1, coping: "smooth_quartz", wall: "smooth_stone", floor: "smooth_stone", deck: "smooth_stone", plan: null, ...roofSpec };
  const foot = (x, z) => inRect(box, x, z) && (!o.plan || o.plan(x, z));
  const cells = [], ring = [];
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (!foot(x, z)) continue;
    cells.push([x, z]);
    if (!foot(x - 1, z) || !foot(x + 1, z) || !foot(x, z - 1) || !foot(x, z + 1)) ring.push([x, z]);
  }
  const onRing = new Set(ring.map(([x, z]) => `${x},${z}`));
  const slab = B.slab(o.floor);
  let n = 0;
  for (let y = box.y0; y < deckY; y++) for (const [x, z] of ring) n += put(g, x, y, z, o.wall) ? 1 : 0;
  for (let y = box.y0; y < deckY; y += 11) for (const [x, z] of cells) n += put(g, x, y, z, ...slab) ? 1 : 0;
  for (const [x, z] of cells) n += put(g, x, deckY, z, onRing.has(`${x},${z}`) ? o.coping : o.deck) ? 1 : 0;
  for (let y = deckY + 1; y <= deckY + o.parapet; y++) for (const [x, z] of ring) n += put(g, x, y, z, o.coping) ? 1 : 0;
  return n;
}

// ---- canopies -----------------------------------------------------------------------------------------------------
/**
 * A canopy: a glass deck at y with a smooth_quartz edge beam all round, and a quartz_pillar at each listed [x, z]
 * running from the deck down to the first solid block below it. A column with no ground under it is not built.
 */
export function canopy(g, rect, y, columns = []) {
  let n = 0;
  for (let x = rect.x0; x <= rect.x1; x++) for (let z = rect.z0; z <= rect.z1; z++) {
    const beam = x === rect.x0 || x === rect.x1 || z === rect.z0 || z === rect.z1;
    n += put(g, x, y, z, beam ? "smooth_quartz" : "glass") ? 1 : 0;
  }
  for (const [x, z] of columns) n += pillar(g, x, y - 1, z);
  return n;
}
function pillar(g, x, top, z) {
  let base = top;
  while (base >= 0 && g.isAir(x, base, z)) base--;
  if (base < 0) return 0;
  let n = 0;
  for (let y = base + 1; y <= top; y++) n += put(g, x, y, z, "quartz_pillar", { axis: "y" }) ? 1 : 0;
  return n;
}

// ---- roofs --------------------------------------------------------------------------------------------------------
/**
 * A roof garden on a deck. deck: {x0, z0, x1, z1, y}, y being the deck's top course; its outline is the parapet.
 * Planting sits on y + 1: moss_block and grass_block patches (2 to 6 square, about two tiles in three, inset 1 from
 * the parapet); oak trees about every 14 cells (grass base, 4-log trunk, persistent leaves).
 * opts.skylight: a rect whose deck cells at y become light_blue_stained_glass. This replaces existing deck blocks,
 * so it is the one explicit overwrite here. opts.parapet (default 1): standing lanterns on the parapet every 6 cells,
 * only where the parapet is solid below.
 */
export function roofGarden(g, deck, { skylight = null, parapet = 1 } = {}) {
  const L = deck.y + 1;
  const inner = insetRect(deck, 1);
  let n = 0;
  for (let tx = inner.x0; tx <= inner.x1; tx += 8) for (let tz = inner.z0; tz <= inner.z1; tz += 8) {
    const h = (tx * 7919 + tz * 104729) % 1009;
    if (h % 3 === 0) continue;                       // not continuous: some tiles stay bare
    const size = 2 + (h % 5);
    const ox = tx + ((h >> 3) % (8 - size)), oz = tz + ((h >> 5) % (8 - size));
    const block = (h >> 7) % 2 ? "moss_block" : "grass_block";
    for (let x = ox; x < ox + size; x++) for (let z = oz; z < oz + size; z++) {
      if (inRect(inner, x, z)) n += put(g, x, L, z, block) ? 1 : 0;
    }
  }
  for (let x = deck.x0 + 4; x <= deck.x1 - 4; x += 14) for (let z = deck.z0 + 4; z <= deck.z1 - 4; z += 14) {
    n += tree(g, x, L, z);
  }
  if (skylight) {
    for (let x = Math.max(skylight.x0, deck.x0); x <= Math.min(skylight.x1, deck.x1); x++) {
      for (let z = Math.max(skylight.z0, deck.z0); z <= Math.min(skylight.z1, deck.z1); z++) {
        if (g.inBounds(x, deck.y, z)) { g.set(x, deck.y, z, "light_blue_stained_glass"); n++; }
      }
    }
  }
  const top = deck.y + parapet;
  outline(deck).forEach(([x, z], i) => {
    if (i % 6 === 0 && !g.isAir(x, top, z)) n += put(g, x, top + 1, z, ...B.lantern(false)) ? 1 : 0;
  });
  return n;
}
// An oak with a 4-log trunk on the planting layer at `base`, persistent leaves round the top.
function tree(g, x, base, z) {
  let n = put(g, x, base, z, "grass_block") ? 1 : 0;
  for (let k = 1; k <= 4; k++) n += put(g, x, base + k, z, ...B.log("oak", "y")) ? 1 : 0;
  const layers = [[base + 3, 2, true], [base + 4, 2, true], [base + 5, 1, false], [base + 6, 1, true]];
  for (const [y, r, cornersOut] of layers) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (cornersOut && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      n += put(g, x + dx, y, z + dz, ...LEAF) ? 1 : 0;
    }
  }
  return n;
}

// ---- caps and lights ----------------------------------------------------------------------------------------------
/**
 * A solid stepped cap. tiers: [{x0, z0, x1, z1, y0, y1, block}] in grid coordinates, each tier filled solid into air
 * (the architect's table gives smooth_quartz, iron_block, light_gray_concrete tiers).
 */
export function capStep(g, tiers) {
  let n = 0;
  for (const t of tiers) {
    for (let y = t.y0; y <= t.y1; y++) for (let x = t.x0; x <= t.x1; x++) for (let z = t.z0; z <= t.z1; z++) {
      n += put(g, x, y, z, t.block) ? 1 : 0;
    }
  }
  return n;
}

/**
 * Sea lanterns on a walkable top: every `every`-th cell of the rect's ring `ring` (inset k), at the rect's y.
 * Air only, unless opts.flush: then the deck's own top block there is replaced, so the light sits flush in the
 * surface (the plan's "flush sea_lantern").
 */
export function deckLights(g, rect, ring, every, { flush = false } = {}) {
  let n = 0;
  outline(insetRect(rect, ring)).forEach(([x, z], i) => {
    if (i % every !== 0 || !g.inBounds(x, rect.y, z)) return;
    if (flush && !g.isAir(x, rect.y, z)) {
      g.set(x, rect.y, z, "sea_lantern");
      n++;
    } else n += put(g, x, rect.y, z, "sea_lantern") ? 1 : 0;
  });
  return n;
}
