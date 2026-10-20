// H2 helpers from plan.md VOCABULARY: retainingWall, canopyBay, quartzWindow, deckStrip, benchRow, towerShaft,
// plantedBank. Each takes its position as arguments and writes only through scope(): a cell is written only if it is
// inside the helper's own box, not in `skip`, and is air (or one of the `over` ids). Anything else is counted in
// `refused` and left alone, so a helper never touches the ground, a floor or an earlier part's blocks. Each returns
// { placed, refused }. Block ids and states are 1.21.1 (B.* from the build library, plus the few written out here).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["air", "cave_air", "void_air", "structure_void"]);
const bare = (id) => id.replace(/^minecraft:/, "");
const key = (x, y, z) => `${x},${y},${z}`;

/** Writer for one box [x0,x1,y0,y1,z0,z1] (inclusive). over: ids it may replace; skip: [x,y,z] cells it must leave alone. */
function scope(g, [x0, x1, y0, y1, z0, z1], { over = [], skip = [] } = {}) {
  const may = new Set(over.map(bare)), kept = new Set(skip.map((c) => key(...c)));
  const w = { placed: 0, refused: 0 };
  w.set = (x, y, z, block, state, nbt) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && g.inBounds(x, y, z);
    const here = bare(g.blockAt(x, y, z));
    if (!inside || kept.has(key(x, y, z)) || !(AIR.has(here) || may.has(here))) { w.refused++; return; }
    g.set(x, y, z, block, state, nbt);
    w.placed++;
  };
  return w;
}
const result = (w) => ({ placed: w.placed, refused: w.refused });
const OUT = { west: -1, east: 1 };      // outward x for a west or east face (the street side is +x, the bay is -x)

/** Retaining wall on a west (or east) edge: two-wide stone column at x (and x+in), cap slab at top, open spruce
 *  trapdoor rim at top+1 on the face, grass planter behind it. base = lowest stone (default top-3). */
export function retainingWall(g, { x, z0, z1, top, base = top - 3, face = "west", over = [], cap = "slab" }) {
  const inn = -OUT[face], xs = [x, x + inn];
  const w = scope(g, [Math.min(...xs), Math.max(...xs), base, top + 2, z0, z1], { over });
  for (let z = z0; z <= z1; z++) {
    for (const cx of xs) {
      for (let y = base; y < top; y++) {
        const mossy = y < base + 3 && (z + y) % 10 === 0;     // about 1 in 10 low in the wall
        w.set(cx, y, z, ...B.block(mossy ? "mossy_stone_bricks" : "stone_bricks"));
      }
      // cap: "block" for a planter that stands on the cap (a bottom slab would leave half a block of air under its grass)
      w.set(cx, top, z, ...(cap === "block" ? B.block("polished_andesite") : B.slab("polished_andesite", "bottom")));
    }
    w.set(x, top + 1, z, ...B.trapdoor("spruce", face === "west" ? "west" : "east", "bottom", true));   // rim
    w.set(x + inn, top + 1, z, ...B.block("grass_block"));                                              // planter
    w.set(x + inn, top + 2, z, ...B.block("short_grass"));
  }
  return result(w);
}

/** Timber canopy for one bay on a west (or east) face at storey floor F: beam out 1 at F+6 (x+out), soffit slab at x,
 *  smooth_stone deck edge at F+7, a hanging lantern from the beam, and a bracket on every 2nd post when `bracket`. */
export function canopyBay(g, { x, z0, z1, F, face = "west", bracket = true, over = [] }) {
  const out = OUT[face], w = scope(g, [Math.min(x, x + out), Math.max(x, x + out), F + 5, F + 7, z0, z1], { over });
  let lamp = Math.floor((z0 + z1) / 2);
  if (lamp % 5 === 0) lamp = lamp + 1 > z1 ? lamp - 1 : lamp + 1;   // mid-bay, never on a post (brackets sit on posts)
  for (let z = z0; z <= z1; z++) {
    w.set(x + out, F + 6, z, ...B.wood("stripped_spruce", "z"));
    w.set(x, F + 6, z, ...B.slab("spruce", "top"));
    w.set(x + out, F + 7, z, ...B.block("smooth_stone"));
    if (bracket && z % 10 === 0) w.set(x + out, F + 5, z, ...B.stairs("spruce", face === "west" ? "east" : "west", "top"));
  }
  w.set(x + out, F + 5, lamp, ...B.lantern(true));   // hangs from the beam at F+6
  return result(w);
}

const INWARD = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] };   // from each face into the building
/** Two-wide, three-high window set 1 in from a face: glass panes, smooth_quartz_slab sill under, smooth_quartz lintel over.
 *  at = the face line (x for west/east, z for north/south); pos = the first cell along the face; y = bottom of the glass. */
export function quartzWindow(g, { face, at, pos, y, over = [] }) {
  const [dx, dz] = INWARD[face], along = face === "west" || face === "east";
  const cell = (u, v, d) => (along ? [at + dx * d, v, pos + u] : [pos + u, v, at + dz * d]);
  const xs = [0, 1].map((u) => cell(u, y, 1)[0]), zs = [0, 1].map((u) => cell(u, y, 1)[2]);
  const w = scope(g, [Math.min(...xs), Math.max(...xs), y - 1, y + 3, Math.min(...zs), Math.max(...zs)], { over });
  // panes connect along the face, not out of it
  const join = along ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" };
  for (let u = 0; u < 2; u++) {
    const [x, , z] = cell(u, y, 1);
    w.set(x, y - 1, z, ...B.slab("smooth_quartz", "bottom"));
    for (let v = 0; v < 3; v++) w.set(x, y + v, z, "glass_pane", { ...join, waterlogged: "false" });
    w.set(x, y + 3, z, ...B.block("smooth_quartz"));
  }
  return result(w);
}

/** Spruce plank strips 3 wide along z on the plaza deck at y (28): they replace the pavers under them. strips = the
 *  x where each strip starts (default every 14 from x0). over defaults to smooth_stone, the deck they replace. */
export function deckStrip(g, { x0, x1, z0, z1, y = 28, strips = [], over = ["smooth_stone"] }) {
  const starts = strips.length ? strips : Array.from({ length: Math.floor((x1 - x0 - 2) / 14) + 1 }, (_, i) => x0 + 14 * i);
  const w = scope(g, [x0, x1, y, y, z0, z1], { over });
  for (const s of starts) for (let x = s; x <= s + 2; x++) for (let z = z0; z <= z1; z++) w.set(x, y, z, ...B.block("spruce_planks"));
  return result(w);
}

/** A row of spruce stair seats along z at (x, y, z0..z0+len-1), facing `facing` (the toolkit's back side); every 6th cell
 *  is left open. Writes only at y, so the 2-high lane above the seats stays clear. */
export function benchRow(g, { x, z0, len, y = 29, facing = "west", over = [] }) {
  const w = scope(g, [x, x, y, y, z0, z0 + len - 1], { over });
  for (let i = 0; i < len; i++) if (i % 6 !== 5) w.set(x, y, z0 + i, ...B.stairs("spruce", facing, "bottom"));
  return result(w);
}

/** Lift tower over the box, from base (air above the ground) to the smooth_stone cap at top, parapet at top+1.
 *  2x2 polished_andesite piers at the corners, glass between them, smooth_stone floor bands at the decks. The lift is
 *  the centre cell: soul_sand at base, a drag-free bubble column up to the cap, left open through the bands. doors: cells
 *  left air (the openings). */
export function towerShaft(g, { x0, x1, z0, z1, base, top, decks = [], doors = [], over = [] }) {
  const w = scope(g, [x0, x1, base, top + 1, z0, z1], { over, skip: doors });
  const lx = x0 + Math.floor((x1 - x0) / 2), lz = z0 + Math.floor((z1 - z0) / 2);
  const edge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const pier = (x, z) => (x - x0 < 2 || x1 - x < 2) && (z - z0 < 2 || z1 - z < 2);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const lift = x === lx && z === lz;
    if (!lift) w.set(x, top, z, ...B.block("smooth_stone"));
    if (edge(x, z)) w.set(x, top + 1, z, ...B.block("polished_andesite"));
    for (let y = base; y < top; y++) {
      if (edge(x, z)) w.set(x, y, z, ...(pier(x, z) ? B.block("polished_andesite") : B.pane("glass")));
      else if (lift) w.set(x, y, z, ...(y === base ? B.block("soul_sand") : ["bubble_column", { drag: "false" }]));
      else if (decks.includes(y)) w.set(x, y, z, ...B.block("smooth_stone"));
    }
  }
  return result(w);
}

/** Planted bank over the box, with grass_block at y, moss patches, low planting at y+1 and one small oak per 12 cells
 *  (trunk y+1..y+3, persistent leaves around y+3..y+4). Trees go in first, so plants never take a trunk cell. */
export function plantedBank(g, { x0, x1, z0, z1, y, over = [] }) {
  const w = scope(g, [x0, x1, y, y + 4, z0, z1], { over });
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    w.set(x, y, z, ...B.block((x * 3 + z * 5) % 7 === 0 ? "moss_block" : "grass_block"));
    cells.push([x, z]);
  }
  cells.forEach(([x, z], i) => {
    if (i % 12 !== 0) return;
    for (let dy = 1; dy <= 3; dy++) w.set(x, y + dy, z, ...B.log("oak", "y"));
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) w.set(x + dx, y + 3, z + dz, "oak_leaves", { persistent: "true" });
    w.set(x, y + 4, z, "oak_leaves", { persistent: "true" });
  });
  cells.forEach(([x, z]) => {
    const pick = (x + 2 * z) % 5;
    if (pick === 1) w.set(x, y + 1, z, ...B.block("short_grass"));
    else if (pick === 3) w.set(x, y + 1, z, ...B.block("azalea"));
    else if (pick === 4) w.set(x, y + 1, z, ...B.block("flowering_azalea"));
  });
  return result(w);
}
