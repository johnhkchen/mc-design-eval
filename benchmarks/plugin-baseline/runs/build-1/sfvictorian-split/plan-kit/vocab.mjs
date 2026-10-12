// Shared vocabulary for sfvictorian-split: the palette as named constants, the site coordinates from plan.md, and one
// helper per plan.md VOCABULARY item. Every helper writes through the build library (B.* states) into a Grid or a
// guard()/runParts() view, so a part can call the helpers it needs and nothing else.
//
// Conventions (plan.md): front is NORTH (z = 0 street, z grows south to the back fence). A stair's `facing` is the side
// of its full-height back. Cornice and bracket lips point at the street: half "top", facing "south" (into the wall).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (ids from palette.json; B.* adds _stairs / _slab / _trapdoor / _door / _fence / _wall) ----------------
export const BODY = "cyan_terracotta";            // BODY siding (sage-teal)
export const TRIM = "smooth_quartz";              // TRIM cream: + stairs / slab
export const PILLAR = "quartz_pillar";            // corner boards, column shafts
export const PLUM = "crimson";                    // PLUM: + planks / stairs / slab / trapdoor / door / fence
export const PLUM_PANEL = "purple_terracotta";    // spandrel bands
export const GOLD = "yellow_terracotta";          // fish scale, pediment tympanum
export const GOLD_ALT = "orange_terracotta";      // fish scale second tone
export const STONE = "stone_bricks";              // BASE stone, full block
export const STONE_FAMILY = "stone_brick";        // BASE stone: + _stairs / _slab / _wall
export const ANDESITE = "andesite";               // rustication
export const CHISELED = "chiseled_stone_bricks";  // string course
export const BRICK = "bricks";                    // party walls, chimney, full block
export const BRICK_FAMILY = "brick";              // party walls: + _stairs / _slab / _wall
export const IRON = "iron_bars";                  // fences, handrails
export const PANE = "glass_pane";
export const GLASS = "glass";                     // skylight
export const CONCRETE = "light_gray_concrete";    // sidewalk, drive
export const GRAVEL = "gravel";                   // path, roof deck
export const DIRT = "dirt";                       // flower-bed soil
export const COARSE_DIRT = "coarse_dirt";         // side borders
export const FARMLAND = "farmland";               // raised vegetable beds
export const GRASS = "grass_block";               // lawn
export const TIMBER_PLANKS = "spruce_planks";     // deck, bed rims
export const TIMBER = "spruce";                   // + stairs / slab / fence / trapdoor
export const LOG = "oak_log";                     // tree trunk
export const LEAVES = "oak_leaves";               // canopy (persistent)
export const AZALEA = "flowering_azalea";         // flower-bed shrub
export const FLOWERS = ["red_tulip", "poppy", "allium", "azure_bluet", "lilac"];
export const LANTERN = "lantern";
export const END_ROD = "end_rod";                 // finials

// ---- site coordinates from plan.md (x 0..15 W->E, z 0 street/N -> 49 back fence, y 0 = street) ------------------
export const SITE = {
  lot: { x0: 0, x1: 15, z0: 0, z1: 49 },
  streetZ: 0,
  frontZ: 7,                  // main front wall
  rearZ: 30,                  // rear wall
  partyW: 0, partyE: 15,      // party walls
  parapetY: 18,
  deckY: 17,                  // roof deck (skylight, cornice course)
  cornice: { y: 17 },
  brackets: { y: 16 },
  pediment: { x0: 6, x1: 9, y: 19 },
  sidewalk: { x0: 0, x1: 15, z0: 0, z1: 1 },
  drive: { x0: 3, x1: 6, z0: 0, z1: 3 },
  plinth: { x0: 1, x1: 8, y0: 0, y1: 3, z0: 4, z1: 6, stringY: 3 },
  garageDoor: { x0: 3, x1: 6, y0: 1, y1: 3, z: 4 },
  bay: {
    y0: 4, y1: 16,
    rows: [{ z: 4, x0: 3, x1: 6 }, { z: 5, x0: 2, x1: 7 }, { z: 6, x0: 1, x1: 8 }],
    windowYs: [[5, 7], [10, 12], [14, 15]],   // S1, S2, S3 window heads (openings left air)
    faceWindowXs: [4, 5],                     // the face pair; the diagonals are single windows
    spandrelY: 9,
    fishScaleY: 13,
    cornerXs: [3, 6],
  },
  porch: { x0: 10, x1: 14, z0: 7, z1: 9, floorY: 4, voidY0: 5, voidY1: 8, ceilingY: 9, columnXs: [10, 14], columnZ: 7, wainscotXs: [9, 15], wainscotZs: [8, 9] },
  entry: { x0: 11, x1: 12, y: 5, z: 10, transomY: 8, casingXs: [10, 13] },
  stoop: { x0: 11, x1: 13, treads: [[1, 2], [2, 3], [3, 4], [4, 5]], landing: { y: 4, z: 6 }, cheekXs: [10, 14], cheekZ0: 2, cheekZ1: 6, cheekTops: [1, 2, 3, 4, 4] },
  ironFence: { z: 2, y: 1, segments: [[0, 2], [7, 10], [14, 15]] },   // gaps: drive 3..6, stoop 11..13
  flowerBeds: {
    westFront: { x0: 0, x1: 2, z0: 2, z1: 3 },
    eastFront: { x0: 7, x1: 10, z0: 2, z1: 3 },
    stoopSide: { x0: 14, x1: 15, z0: 2, z1: 6 },
    strip: { x0: 9, x1: 9, z0: 4, z1: 6 },
  },
  chimney: { x0: 0, x1: 2, z0: 12, z1: 13, y0: 18, y1: 19, capY: 20 },
  skylight: { x0: 6, x1: 9, z0: 15, z1: 17, y: 17 },
  deck: {
    x0: 1, x1: 14, z0: 31, z1: 35, y: 4,
    posts: [[1, 31], [14, 31], [1, 35], [7, 35], [14, 35]], postY: 3,
    railY: 5, railGap: [6, 8],
    steps: { x0: 6, x1: 8, y: 3, z: 36 },
  },
  tree: { x: 12, z: 41, trunkY0: 3, trunkY1: 7, canopyY0: 7, canopyY1: 10, canopyCenterY: 9, r: 3 },
  raisedBeds: [{ x0: 1, x1: 4, z0: 45, z1: 47 }, { x0: 11, x1: 14, z0: 45, z1: 47 }],
};

// ---- small utilities --------------------------------------------------------------------------------------------
const span = (a, b) => {
  const out = [];
  for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
  return out;
};
const at = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");   // block id without namespace

// ---- VOCABULARY helpers -----------------------------------------------------------------------------------------

/** siding(x,y,z): plain BODY cyan_terracotta. */
export function siding(g, x, y, z) {
  g.set(x, y, z, BODY);
}

/** rusticated(box): stone_bricks fill; odd y and odd x = andesite; the string course row (plinth stringY) = chiseled. */
export function rusticated(g, a, b) {
  for (const y of span(a[1], b[1])) for (const x of span(a[0], b[0])) for (const z of span(a[2], b[2])) {
    const block = y === SITE.plinth.stringY ? CHISELED : y % 2 === 1 && x % 2 === 1 ? ANDESITE : STONE;
    g.set(x, y, z, block);
  }
}

/** fishscale(x0,x1,y0,z): two rows at y0, y0+1. Row y0 gold with gold_alt on every 2nd x; row y0+1 is the offset. */
export function fishscale(g, x0, x1, y0, z) {
  for (const x of span(x0, x1)) {
    const alt = (x - x0) % 2 === 0;               // orange on the even cells of row y0
    g.set(x, y0, z, alt ? GOLD_ALT : GOLD);
    g.set(x, y0 + 1, z, alt ? GOLD : GOLD_ALT);   // offset by one: orange where row y0 is gold
  }
}

/** spandrel(x0,x1,y,z): PLUM_PANEL row at y, with a cream bottom-slab moulding proud at z-1. */
export function spandrel(g, x0, x1, y, z) {
  for (const x of span(x0, x1)) {
    g.set(x, y, z, PLUM_PANEL);
    g.set(x, y, z - 1, ...B.slab(TRIM, "bottom"));
  }
}

/** sill(x0..x1, y, z): cream top-slab sill (proud). */
export function sill(g, x0, x1, y, z) {
  for (const x of span(x0, x1)) g.set(x, y, z, ...B.slab(TRIM, "top"));
}

/** hoodPair(x0,x1,y,z): two crimson stairs meeting at a ridge (x0 faces east, x1 faces west), cream eaves at x0-1, x1+1. */
export function hoodPair(g, x0, x1, y, z) {
  g.set(x0, y, z, ...B.stairs(PLUM, "east", "bottom"));
  g.set(x1, y, z, ...B.stairs(PLUM, "west", "bottom"));
  g.set(x0 - 1, y, z, ...B.slab(TRIM, "bottom"));
  g.set(x1 + 1, y, z, ...B.slab(TRIM, "bottom"));
}

/** hoodSingle(x,y,z): one cream bottom-slab hood cell. */
export function hoodSingle(g, x, y, z) {
  g.set(x, y, z, ...B.slab(TRIM, "bottom"));
}

/**
 * window(x0,x1,y0,y1,z,face): glass_pane fill in the opening; for a front face ("north", the default) casing (cream,
 * proud at z-1, skipped where a casing or corner board already is), a sill at y0-1 and a hood at y1+1; hood is a pair
 * for 2+ wide openings and a single for 1 wide, unless opts.hood is "slab" (flat cream bottom-slabs across the head).
 * For a rear face ("south"): flat cream bottom-slab hood at y1+1, proud at z+1; no casing, no sill.
 */
export function window(g, x0, x1, y0, y1, z, face = "north", { hood } = {}) {
  for (const y of span(y0, y1)) for (const x of span(x0, x1)) g.set(x, y, z, ...B.pane(PANE));
  const hoodY = y1 + 1;
  if (face === "south") {
    for (const x of span(x0, x1)) g.set(x, hoodY, z + 1, ...B.slab(TRIM, "bottom"));
    return;
  }
  for (const y of span(y0, y1)) for (const x of [x0 - 1, x1 + 1]) {
    if ([TRIM, PILLAR].includes(at(g, x, y, z - 1))) continue;   // neighbour's casing / corner board
    g.set(x, y, z - 1, TRIM);
  }
  sill(g, x0, x1, y0 - 1, z - 1);
  const kind = hood ?? (x1 > x0 ? "pair" : "single");
  if (kind === "pair") hoodPair(g, x0, x1, hoodY, z - 1);
  else if (kind === "single") hoodSingle(g, x0, hoodY, z - 1);
  else if (kind === "slab") for (const x of span(x0, x1)) hoodSingle(g, x, hoodY, z - 1);
}

/** cornerBoard(x,z,y0,y1): quartz_pillar axis=y replacing the wall block. */
export function cornerBoard(g, x, z, y0, y1) {
  for (const y of span(y0, y1)) g.set(x, y, z, ...B.pillar(PILLAR, "y"));
}

/** bracket(x,z,y=16): plum stair bracket, lip toward the street; a plum top-slab behind it when that cell is free. */
export function bracket(g, x, z, y = SITE.brackets.y) {
  g.set(x, y, z, ...B.stairs(PLUM, "south", "top"));
  if (g.isAir(x, y, z + 1)) g.set(x, y, z + 1, ...B.slab(PLUM, "top"));
}

/** dentils(x0,x1,z,y=16): plum top-closed trapdoors between brackets (skip the bracket xs). */
export function dentils(g, x0, x1, z, y = SITE.brackets.y, brackets = []) {
  for (const x of span(x0, x1)) {
    if (brackets.includes(x)) continue;
    g.set(x, y, z, ...B.trapdoor(PLUM, "south", "top", false));
  }
}

/**
 * cornice(cells): y17 courses. cells: [{x, z, facing = "south", corner = false}]; facing is into the wall (for the bay,
 * toward the bay); a corner cell of the ring uses the cream block instead of a stair.
 */
export function cornice(g, cells, y = SITE.cornice.y) {
  for (const { x, z, facing = "south", corner = false } of cells) {
    if (corner) g.set(x, y, z, TRIM);
    else g.set(x, y, z, ...B.stairs(TRIM, facing, "top"));
  }
}

/**
 * parapet(x0,x1): BODY false-front wall at y18, z=7, with a cream coping slab at y19 on z6 and z7. The coping skips the
 * pediment (x6..9) and the finial cells (x0 and x15 at z7).
 */
export function parapet(g, x0 = 0, x1 = 15) {
  const { x0: px0, x1: px1, y } = SITE.pediment;
  for (const x of span(x0, x1)) {
    g.set(x, SITE.parapetY, SITE.frontZ, BODY);
    if (x >= px0 && x <= px1) continue;
    g.set(x, y, SITE.frontZ - 1, ...B.slab(TRIM, "bottom"));
    if (x !== SITE.partyW && x !== SITE.partyE) g.set(x, y, SITE.frontZ, ...B.slab(TRIM, "bottom"));
  }
}

/** pediment(x0..x1): stepped crest at y19 z7 (stairs at the ends, gold in the middle), cream crown slab at y20. */
export function pediment(g, x0 = SITE.pediment.x0, x1 = SITE.pediment.x1) {
  const { y } = SITE.pediment;
  g.set(x0, y, SITE.frontZ, ...B.stairs(TRIM, "east", "bottom"));
  g.set(x1, y, SITE.frontZ, ...B.stairs(TRIM, "west", "bottom"));
  for (const x of span(x0 + 1, x1 - 1)) {
    g.set(x, y, SITE.frontZ, GOLD);
    g.set(x, y + 1, SITE.frontZ, ...B.slab(TRIM, "bottom"));
  }
}

/** finial(x): cream post at (x,19,7) with an end rod above it. */
export function finial(g, x) {
  g.set(x, SITE.pediment.y, SITE.frontZ, TRIM);
  g.set(x, SITE.pediment.y + 1, SITE.frontZ, END_ROD, { facing: "up" });
}

/** column(x,z=7): cream base slab y5, quartz shaft y6..7, cream capital stair y8 (lip outward). */
export function column(g, x, z = SITE.porch.columnZ) {
  g.set(x, 5, z, ...B.slab(TRIM, "bottom"));
  g.set(x, 6, z, ...B.pillar(PILLAR, "y"));
  g.set(x, 7, z, ...B.pillar(PILLAR, "y"));
  g.set(x, 8, z, ...B.stairs(TRIM, "south", "top"));
}

/** porchWainscot(): cream bottom-slabs at y5 on the porch side walls, z8..9. */
export function porchWainscot(g) {
  for (const x of SITE.porch.wainscotXs) for (const z of SITE.porch.wainscotZs) g.set(x, 5, z, ...B.slab(TRIM, "bottom"));
}

/**
 * entryDoor(): two crimson doors in the porch back wall z=10 (lower at y5, upper at y6), hinges outward, a glass transom
 * at y8, cream casing at x10 and x13 for y5..8.
 */
export function entryDoor(g) {
  const { x0, x1, y, z, transomY, casingXs } = SITE.entry;
  const hinges = ["left", "right"];
  span(x0, x1).forEach((x, i) => {
    g.set(x, y, z, ...B.door(PLUM, "north", "lower", hinges[i]));
    g.set(x, y + 1, z, ...B.door(PLUM, "north", "upper", hinges[i]));
  });
  for (const x of span(x0, x1)) g.set(x, transomY, z, ...B.pane(PANE));
  for (const x of casingXs) for (const yy of span(y, transomY)) g.set(x, yy, z, TRIM);
}

/**
 * garageDoor(): plum panelled door filling the garage opening (x3..6, y1..3, z4). Raised panels are closed plum
 * trapdoors on the outer face z=3, alternating columns by row; a cream lintel slab across the top at y4, z=3.
 */
export function garageDoor(g) {
  const { x0, x1, y0, y1, z } = SITE.garageDoor;
  for (const y of span(y0, y1)) for (const x of span(x0, x1)) g.set(x, y, z, ...B.block(`${PLUM}_planks`));
  for (const y of span(y0, y1)) {
    const cols = y % 2 === 1 ? [x0, x0 + 2] : [x0 + 1, x0 + 3];
    for (const x of cols) g.set(x, y, z - 1, ...B.trapdoor(PLUM, "north", "bottom", false));
  }
  for (const x of span(x0, x1)) g.set(x, y1 + 1, z - 1, ...B.slab(TRIM, "bottom"));
}

/**
 * stoop(): stone steps rising south from the sidewalk to the landing at y4 z6 (treads at [y,z] in SITE.stoop), solid
 * stone under each step, stone cheeks at x10 and x14 with an iron handrail one above the cheek top.
 */
export function stoop(g) {
  const s = SITE.stoop;
  for (const x of span(s.x0, s.x1)) {
    for (const [y, z] of s.treads) {
      g.set(x, y, z, ...B.stairs(STONE_FAMILY, "south", "bottom"));
      for (const yy of span(0, y - 1)) g.set(x, yy, z, STONE);
    }
    for (const yy of span(0, s.landing.y - 1)) g.set(x, yy, s.landing.z, STONE);
    g.set(x, s.landing.y, s.landing.z, STONE);
  }
  s.cheekXs.forEach((x) => {
    span(s.cheekZ0, s.cheekZ1).forEach((z, i) => {
      const top = s.cheekTops[i];
      for (const y of span(1, top)) g.set(x, y, z, STONE);
      g.set(x, top + 1, z, IRON);
    });
  });
}

/**
 * bayWall(y0,y1): BODY siding on the angled bay's wall cells (plan rows z4 x3..6; diagonals (2,5),(7,5),(1,6),(8,6))
 * for y0..y1. Window openings are left air: the face cells x4..5 and every diagonal inside a window head range.
 */
export function bayWall(g, y0, y1) {
  const { rows, windowYs, faceWindowXs } = SITE.bay;
  const inWindow = (y) => windowYs.some(([a, b]) => y >= a && y <= b);
  for (const row of rows) for (const x of span(row.x0, row.x1)) {
    for (const y of span(y0, y1)) {
      const onFace = row === rows[0];
      const opening = inWindow(y) && (onFace ? faceWindowXs.includes(x) : true);
      if (opening) continue;
      g.set(x, y, row.z, BODY);
    }
  }
}

/**
 * ironFence(x0,x1,z=2): stone curb at y0 under an iron rail at y1; every third cell (from x0) is a stone wall post
 * instead of bars.
 */
export function ironFence(g, x0, x1, z = SITE.ironFence.z) {
  const y = SITE.ironFence.y;
  for (const x of span(x0, x1)) {
    g.set(x, y - 1, z, STONE);
    if ((x - x0) % 3 === 0) g.set(x, y, z, ...B.wall(STONE_FAMILY));
    else g.set(x, y, z, IRON);
  }
}

/**
 * flowerBed(x0,x1,z0,z1,y=0): dirt soil at y, flowers at y+1 cycling through FLOWERS (lilac is two tall); one azalea
 * shrub at the first corner.
 */
export function flowerBed(g, x0, x1, z0, z1, y = 0) {
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    g.set(x, y, z, DIRT);
    const kind = FLOWERS[(x - x0 + z - z0) % FLOWERS.length];
    if (kind === "lilac") {
      g.set(x, y + 1, z, "lilac", { half: "lower" });
      g.set(x, y + 2, z, "lilac", { half: "upper" });
    } else {
      g.set(x, y + 1, z, kind);
    }
  }
  g.set(x0, y + 1, z0, AZALEA);
}

/**
 * deck(d = SITE.deck): spruce fence posts at y3 on the plan cells, spruce deck planks at y4 over x1..14 z31..35, a
 * spruce stair fascia at y3 round the outer edge (not the house side), a bare spruce-fence rail at y5 on z=35 (gap at
 * x6..8) and on x=1 and x=14, and one spruce step down at y3 z36 (x6..8).
 */
export function deck(g, d = SITE.deck) {
  const posts = new Set(d.posts.map(([x, z]) => `${x},${z}`));
  const [gapA, gapB] = d.railGap;
  for (const x of span(d.x0, d.x1)) for (const z of span(d.z0, d.z1)) g.set(x, d.y, z, ...B.block(TIMBER_PLANKS));
  for (const [x, z] of d.posts) g.set(x, d.postY, z, ...B.fence(TIMBER));
  // fascia: top-half stairs at y3 under the outer edge (south, east, west); the house side is left alone
  for (const x of span(d.x0, d.x1)) if (!posts.has(`${x},${d.z1}`)) g.set(x, d.y - 1, d.z1, ...B.stairs(TIMBER, "south", "top"));
  for (const z of span(d.z0, d.z1)) for (const [x, facing] of [[d.x0, "west"], [d.x1, "east"]]) {
    if (!posts.has(`${x},${z}`)) g.set(x, d.y - 1, z, ...B.stairs(TIMBER, facing, "top"));
  }
  for (const x of span(d.x0, d.x1)) if (x < gapA || x > gapB) g.set(x, d.railY, d.z1, ...B.fence(TIMBER));
  for (const z of span(d.z0, d.z1)) for (const x of [d.x0, d.x1]) g.set(x, d.railY, z, ...B.fence(TIMBER));
  const st = d.steps;
  for (const x of span(st.x0, st.x1)) g.set(x, st.y, st.z, ...B.stairs(TIMBER, "north", "bottom"));
}

/**
 * tree(t = SITE.tree): oak trunk (axis y) from trunkY0 to trunkY1 at (x,z); persistent oak canopy of radius r centred
 * on canopyCenterY, clipped to canopyY0..canopyY1, trunk cells kept; the edge is varied by a cheap parity rule.
 */
export function tree(g, t = SITE.tree) {
  for (const y of span(t.trunkY0, t.trunkY1)) g.set(t.x, y, t.z, ...B.log("oak", "y"));
  for (const y of span(t.canopyY0, t.canopyY1)) for (const x of span(t.x - t.r, t.x + t.r)) for (const z of span(t.z - t.r, t.z + t.r)) {
    const dx = x - t.x, dy = y - t.canopyCenterY, dz = z - t.z;
    const d2 = dx * dx + dy * dy + dz * dz, r2 = t.r * t.r;
    if (d2 > r2 || (x === t.x && z === t.z && y <= t.trunkY1)) continue;
    if (d2 > r2 - 2 && (dx + dy + dz) % 2 === 0) continue;                     // ragged edge
    g.set(x, y, z, LEAVES, { persistent: "true" });
  }
}

/** chimney(c = SITE.chimney): brick stack on the west party wall, stone cap slab at y20, two brick-wall pots. */
export function chimney(g, c = SITE.chimney) {
  for (const x of span(c.x0, c.x1)) for (const z of span(c.z0, c.z1)) for (const y of span(c.y0, c.y1)) g.set(x, y, z, BRICK);
  for (const x of span(c.x0, c.x1)) for (const z of span(c.z0, c.z1)) g.set(x, c.capY, z, ...B.slab(STONE_FAMILY, "top"));
  g.set(1, c.capY + 1, 12, ...B.wall(BRICK_FAMILY));
  g.set(1, c.capY + 1, 13, ...B.wall(BRICK_FAMILY));
}

/** skylight(s = SITE.skylight): glass in the deck opening, cream bottom-slab curb at y18 around it. */
export function skylight(g, s = SITE.skylight) {
  for (const x of span(s.x0, s.x1)) for (const z of span(s.z0, s.z1)) g.set(x, s.y, z, GLASS);
  for (const x of span(s.x0 - 1, s.x1 + 1)) for (const z of span(s.z0 - 1, s.z1 + 1)) {
    const inside = x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1;
    if (!inside) g.set(x, s.y + 1, z, ...B.slab(TRIM, "bottom"));
  }
}

/**
 * gardenBed(x0,x1,z0,z1): raised bed. Farmland soil at y4 over the box, spruce-plank rim at y3 round the outside.
 * (Not in plan.md VOCABULARY; added from elements.md item 15/17.)
 */
export function gardenBed(g, x0, x1, z0, z1) {
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) g.set(x, 4, z, FARMLAND);
  for (const x of span(x0 - 1, x1 + 1)) for (const z of span(z0 - 1, z1 + 1)) {
    const inside = x >= x0 && x <= x1 && z >= z0 && z <= z1;
    if (!inside) g.set(x, 3, z, ...B.block(TIMBER_PLANKS));
  }
}
