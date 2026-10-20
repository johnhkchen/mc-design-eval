// Vocabulary helpers, batch h3 (plan.md VOCABULARY): roadStrip, seatingWall, tunnelBore, deck, drift, youngTree,
// umbrella, hiddenLight.
//
// Every helper takes its position as arguments and returns { placed, refused, footprint }:
//   footprint  [x0, y0, z0, x1, y1, z1], the only cells the helper writes
//   refused    [[x, y, z, blockThere], ...], cells it wanted but found not empty
// Writes go into air only. A cell that is not air is refused and listed, not overwritten, unless the caller passes
// { over: true } (still inside the footprint). tunnelBore alone carves its own bore cells: that is what a bore is.
// Nothing is written below a helper's own lowest layer, so no ground, sand or floor is touched.
//
// The y argument is the layer the helper's own blocks start in. Surface helpers (roadStrip, deck, hiddenLight) take the
// surface layer itself. Planting, trees, furniture and seating take the ground-top y and build above it.

import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DYES = ["white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray", "light_gray", "cyan", "purple", "blue", "brown", "green", "red", "black"];
const DOUBLE_PLANTS = new Set(["tall_grass", "lilac", "sunflower"]);
const LEAVES = (block) => [block, { persistent: "true" }];

const keyOf = (x, y, z) => `${x},${y},${z}`;
const span = (a, b) => (a <= b ? [a, b] : [b, a]);

// Cells are planned first and written after, so a later mark on the same cell wins and nothing is written twice.
// spec: a block id, or [block, state, nbt] as the build library's B.* helpers return.
function mark(plan, x, y, z, spec, force = false) {
  const [block, state, nbt] = typeof spec === "string" ? [spec] : spec;
  plan.set(keyOf(x, y, z), { at: [x, y, z], block, state, nbt, force });
}

// Check every planned cell is inside the footprint before writing any, so a bad call writes nothing.
function commit(g, footprint, plan, { over = false, refused: extra = [] } = {}) {
  const [x0, y0, z0, x1, y1, z1] = footprint;
  const entries = [...plan.values()];
  for (const { at: [x, y, z] } of entries) {
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) throw new Error(`cell ${x},${y},${z} is outside footprint ${footprint}`);
  }
  const refused = [...extra];
  let placed = 0;
  for (const { at: [x, y, z], block, state, nbt, force } of entries) {
    if (!force && !over && !g.isAir(x, y, z)) { refused.push([x, y, z, g.blockAt(x, y, z)]); continue; }
    g.set(x, y, z, block, state, nbt);
    placed++;
  }
  return { placed, refused, footprint };
}

/**
 * Road surface in the layer box[1] (box = [x0, y, z0, x1, y1, z1]; only y is written). Gray concrete, a white dash on the
 * centre line (2 on, 2 off along the road), and yellow concrete on the cross-axis coordinates in `yellow` (e.g. [55, 56]).
 * axis "x": the road runs east-west, so the cross axis is z. Replaces ground surface only with { over: true }.
 */
export function roadStrip(g, box, axis, { over = false, yellow = null } = {}) {
  if (axis !== "x" && axis !== "z") throw new Error(`roadStrip: axis must be "x" or "z", got ${axis}`);
  const [x0, y, z0, x1, , z1] = box;
  const footprint = [x0, y, z0, x1, y, z1];
  const along = axis === "x" ? span(x0, x1) : span(z0, z1);
  const across = axis === "x" ? span(z0, z1) : span(x0, x1);
  const mid = Math.floor((across[0] + across[1]) / 2);
  const plan = new Map();
  for (let a = along[0]; a <= along[1]; a++) {
    for (let c = across[0]; c <= across[1]; c++) {
      const [x, z] = axis === "x" ? [a, c] : [c, a];
      const onYellow = yellow?.includes(c);
      const onDash = c === mid && (a - along[0]) % 4 < 2;
      mark(plan, x, y, z, onYellow ? "yellow_concrete" : onDash ? "white_concrete" : "gray_concrete");
    }
  }
  return commit(g, footprint, plan, { over });
}

/**
 * Seating wall along x from x0 to x1 on row z, rising from the lower terrace (surface yLow) to the upper level (yHigh).
 * Body white_terracotta at y yLow+1..yHigh, birch_slab bottom cap at yHigh+1, the row drifting ±1 in z over each 10 x.
 * A lantern every 6 blocks stands on the upper side of the cap (nothing stands on a bottom slab, so not on the cap).
 * The caller leaves the wall row at yLow. Footprint: x0..x1, z-2..z+2, yLow+1..yHigh+1.
 */
export function seatingWall(g, x0, x1, z, yLow, yHigh, { over = false } = {}) {
  if (yHigh <= yLow) throw new Error(`seatingWall: yHigh ${yHigh} must be above yLow ${yLow}`);
  const [a, b] = span(x0, x1);
  const footprint = [a, yLow + 1, z - 2, b, yHigh + 1, z + 2];
  const plan = new Map();
  for (let x = a; x <= b; x++) {
    const zw = z + Math.round(Math.sin((2 * Math.PI * (x - a)) / 20));
    for (let y = yLow + 1; y <= yHigh; y++) mark(plan, x, y, zw, "white_terracotta");
    mark(plan, x, yHigh + 1, zw, B.slab("birch", "bottom"));
    if ((x - a) % 6 === 3) mark(plan, x, yHigh + 1, zw + 1, B.lantern(false));
  }
  return commit(g, footprint, plan, { over });
}

/**
 * One tunnel bore from the east portal face, z0..z1 (6 wide, 3 high at y3..5). Carved air through the face (x74..75) and
 * the tunnel (x66..73); black_concrete back wall at x65; gray_concrete road at y2; light_gray_concrete side walls at
 * z0-1 and z1+1; smooth_stone surround standing proud at x76 (jambs y3..5, lintel y6); hanging lanterns at x73 under the
 * lid (y6). lanternZ defaults to z0+1, z0+3, z0+5 (the north mouth: 49/51/53). The south mouth is 57/59/61, so pass that.
 * The bore's own cells are written regardless of what is there (force). Only the surround is air-only.
 * Coping and rail run the length of the face, so the portal face helper owns them. Footprint: x65..76, y2..6, z0-1..z1+1.
 */
export function tunnelBore(g, z0, z1, { lanternZ = [z0 + 1, z0 + 3, z0 + 5] } = {}) {
  const [a, b] = span(z0, z1);
  const footprint = [65, 2, a - 1, 76, 6, b + 1];
  const plan = new Map();
  for (let z = a; z <= b; z++) {
    for (let x = 66; x <= 75; x++) for (let y = 3; y <= 5; y++) mark(plan, x, y, z, "air", true);
    for (let x = 65; x <= 75; x++) mark(plan, x, 2, z, "gray_concrete", true);
    for (let y = 3; y <= 5; y++) mark(plan, 65, y, z, "black_concrete", true);
  }
  for (let x = 65; x <= 73; x++) {
    for (let y = 3; y <= 5; y++) {
      mark(plan, x, y, a - 1, "light_gray_concrete", true);
      mark(plan, x, y, b + 1, "light_gray_concrete", true);
    }
  }
  for (let y = 3; y <= 5; y++) {
    mark(plan, 76, y, a - 1, "smooth_stone");
    mark(plan, 76, y, b + 1, "smooth_stone");
  }
  for (let z = a - 1; z <= b + 1; z++) mark(plan, 76, 6, z, "smooth_stone");
  // A hanging lantern needs a block above it: the lid at y6. Without one, the lantern is refused, not floated.
  const unsupported = [];
  for (const z of lanternZ) {
    if (z < a || z > b) throw new Error(`tunnelBore: lantern z ${z} outside the bore ${a}..${b}`);
    if (g.isAir(73, 6, z)) { unsupported.push([73, 5, z, "no lid above"]); continue; }
    mark(plan, 73, 5, z, B.lantern(true), true);
  }
  return commit(g, footprint, plan, { over: false, refused: unsupported });
}

/** Deck of spruce_planks in the layer box[1] (box = [x0, y, z0, x1, y1, z1]; only y is written). Air only. */
export function deck(g, box, { over = false } = {}) {
  const [x0, y, z0, x1, , z1] = box;
  const [xa, xb] = span(x0, x1);
  const [za, zb] = span(z0, z1);
  const footprint = [xa, y, za, xb, y, zb];
  const plan = new Map();
  for (let x = xa; x <= xb; x++) for (let z = za; z <= zb; z++) mark(plan, x, y, z, "spruce_planks");
  return commit(g, footprint, plan, { over });
}

// Planting recipes from plan.md "Drift recipes". weight = share of the planted cells; density = chance a cell is planted;
// mounds = chance a cell starts a leaf mound (1-2 high, 3x3 at y+1 plus a centre at y+2).
const DRIFTS = {
  "grey-green": { density: 0.85, mounds: 0.08, mound: "azalea_leaves", plants: [[40, "moss_carpet"], [30, "fern"], [30, "short_grass"]] },
  ochre: { density: 0.9, mounds: 0, plants: [[35, "tall_grass"], [35, "short_grass"], [25, "dead_bush"], [5, "sunflower"]] },
  "purple-blue": { density: 0.85, mounds: 0.1, mound: "flowering_azalea_leaves", plants: [[35, "allium"], [30, "cornflower"], [35, "lilac"]] },
  "coastal scrub": { density: 0.8, mounds: 0.15, mound: "spruce_leaves", plants: [[60, "sweet_berry_bush"], [40, "fern"]] },
  accent: { density: 0.3, mounds: 0, plants: [[50, "torchflower"], [50, "orange_tulip"]] },
};

// Point-in-polygon for cell centres. polygon: [[x, z], ...] in plan coordinates.
function inside(poly, px, pz) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > pz) !== (zj > pz) && px <((xj - xi) * (pz - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

function seedOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Small seeded PRNG (mulberry32): the same bed always comes out the same, and neighbouring beds differ by their polygon.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Irregular planting bed. kind: "grey-green" | "ochre" | "purple-blue" | "coastal scrub" | "accent" (plan recipes).
 * polygon: [[x, z], ...] the bed outline. y: the ground-top y; plants sit at y+1 (tall plants also at y+2).
 * Leaf mounds (shrubs) are 1-2 high. Sunflowers are capped at one per 40 cells. Footprint: the polygon's bounding box, y+1..y+2.
 */
export function drift(g, kind, polygon, y, { over = false, seed } = {}) {
  const recipe = DRIFTS[kind];
  if (!recipe) throw new Error(`drift: unknown kind "${kind}" (one of ${Object.keys(DRIFTS).join(", ")})`);
  const xs = polygon.map(([x]) => x), zs = polygon.map(([, z]) => z);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const footprint = [x0, y + 1, z0, x1, y + 2, z1];
  const rand = mulberry32(seed ?? seedOf(kind + JSON.stringify(polygon)));
  const inPoly = (x, z) => inside(polygon, x + 0.5, z + 0.5);
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inPoly(x, z)) cells.push([x, z]);
  const sunflowerCap = Math.floor(cells.length / 40);
  const total = recipe.plants.reduce((s, [w]) => s + w, 0);
  const plan = new Map();
  let sunflowers = 0;
  for (const [x, z] of cells) {
    if (rand() > recipe.density) continue;
    if (recipe.mounds && rand() < recipe.mounds) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if ((dx === 0 && dz === 0) || rand() < 0.7) if (inPoly(x + dx, z + dz)) mark(plan, x + dx, y + 1, z + dz, LEAVES(recipe.mound));
        }
      }
      if (rand() < 0.5) mark(plan, x, y + 2, z, LEAVES(recipe.mound));
      continue;
    }
    let pickAt = rand() * total, block = recipe.plants[0][1];
    for (const [w, b] of recipe.plants) { if ((pickAt -= w) < 0) { block = b; break; } }
    if (block === "sunflower") { if (sunflowers >= sunflowerCap) block = "short_grass"; else sunflowers++; }
    if (DOUBLE_PLANTS.has(block)) {
      mark(plan, x, y + 1, z, [block, { half: "lower" }]);
      mark(plan, x, y + 2, z, [block, { half: "upper" }]);
    } else if (block === "sweet_berry_bush") {
      mark(plan, x, y + 1, z, [block, { age: "3" }]);
    } else {
      mark(plan, x, y + 1, z, block);
    }
  }
  // A tall plant needs both halves: drop any half that a later mark (a mound, say) has replaced.
  for (const e of [...plan.values()]) {
    const [x, , z] = e.at;
    if (DOUBLE_PLANTS.has(e.block) && e.state?.half === "lower") {
      const up = plan.get(keyOf(x, y + 2, z));
      if (!up || up.block !== e.block || up.state?.half !== "upper") plan.delete(keyOf(x, y + 1, z));
    }
  }
  for (const e of [...plan.values()]) {
    const [x, , z] = e.at;
    if (DOUBLE_PLANTS.has(e.block) && e.state?.half === "upper") {
      const low = plan.get(keyOf(x, y + 1, z));
      if (!low || low.block !== e.block || low.state?.half !== "lower") plan.delete(keyOf(x, y + 2, z));
    }
  }
  return commit(g, footprint, plan, { over });
}

/**
 * Young meadow tree: birch_log trunk 4 high at y+1..y+4 (y = ground top), crown of leaves 3-5 wide over three layers:
 * y+4 the ring of 8 around the trunk, y+5 a 5x5 with the corners cut, y+6 a plus. Leaves persistent, birch_leaves by
 * default (pass { leaves: "azalea_leaves" } for the other). Footprint: x-2..x+2, y+1..y+6, z-2..z+2.
 */
export function youngTree(g, x, y, z, { leaves = "birch_leaves", over = false } = {}) {
  const footprint = [x - 2, y + 1, z - 2, x + 2, y + 6, z + 2];
  const plan = new Map();
  for (let h = 1; h <= 4; h++) mark(plan, x, y + h, z, B.log("birch", "y"));
  const crown = [
    [4, (ax, az) => Math.max(ax, az) === 1],
    [5, (ax, az) => Math.max(ax, az) <= 2 && !(ax === 2 && az === 2)],
    [6, (ax, az) => ax <= 1 && az <= 1 && !(ax === 1 && az === 1)],
  ];
  for (const [h, inLayer] of crown) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (inLayer(Math.abs(dx), Math.abs(dz))) mark(plan, x + dx, y + h, z + dz, LEAVES(leaves));
      }
    }
  }
  return commit(g, footprint, plan, { over });
}

/**
 * Picnic umbrella: birch_fence pole 3 high at y+1..y+3 (y = ground top), a standing banner of `colour` on top at y+4.
 * colour: one of the 16 dye names (orange_banner, white_banner for the plan's alternation). Footprint: x, y+1..y+4, z.
 */
export function umbrella(g, x, y, z, colour, { rotation = 0, over = false } = {}) {
  if (!DYES.includes(colour)) throw new Error(`umbrella: colour must be a dye name, got "${colour}"`);
  const footprint = [x, y + 1, z, x, y + 4, z];
  const plan = new Map();
  for (let h = 1; h <= 3; h++) mark(plan, x, y + h, z, B.fence("birch"));
  mark(plan, x, y + 4, z, B.banner(colour, [], { wall: false, rotation }));
  return commit(g, footprint, plan, { over });
}

/**
 * Hidden light in a bed: shroomlight as the surface block at y, moss_carpet on it at y+1. The shroomlight replaces the
 * ground surface, so it is refused unless the caller passes { over: true }. Footprint: x, y..y+1, z.
 */
export function hiddenLight(g, x, y, z, { over = false } = {}) {
  const footprint = [x, y, z, x, y + 1, z];
  const plan = new Map();
  mark(plan, x, y, z, "shroomlight");
  mark(plan, x, y + 1, z, "moss_carpet");
  return commit(g, footprint, plan, { over });
}
