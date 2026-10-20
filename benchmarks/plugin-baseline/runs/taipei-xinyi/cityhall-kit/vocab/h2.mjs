// Vocabulary helpers, part 2: officeBay, groundBay, roofDeck, mast, spurPavilion, lobbyGlass, nameBand, lampPost,
// planter. Each takes its own position as arguments, writes only its own footprint, and only into air. A facade or
// roof helper that must replace the earlier part's skin names those blocks in opts.over (e.g. ["smooth_sandstone"]).
// Any other existing block is refused and listed in the returned refused array; nothing is thrown for a world conflict.
// Every helper returns { placed, refused: [[x, y, z, wanted, found]] }.
import { DIRS, B, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const result = () => ({ placed: 0, refused: [] });

// the one write rule: a cell already holding the block is left alone; air, or a block opts.over names, is written
function put(g, out, [x, y, z], block, state = {}, over = []) {
  if (!g.inBounds(x, y, z)) { out.refused.push([x, y, z, block, "outside grid"]); return; }
  const cur = g.blockAt(x, y, z);
  if (cur === id(block)) return;
  if (g.isAir(x, y, z) || over.map(id).includes(cur)) { g.set(x, y, z, block, state); out.placed++; return; }
  out.refused.push([x, y, z, block, cur]);
}

// cell(k, d, y): k along the face from the outer pier, d deep (0 = the wall plane), y up; origin = [x, z] of the pier
function frame(face, [ox, oz]) {
  const [ex, , ez] = DIRS[face];
  const [ax, az] = ex === 0 ? [1, 0] : [0, 1];
  const [ix, iz] = [-ex, -ez];
  return (k, d, y) => [ox + ax * k + ix * d, y, oz + az * k + iz * d];
}

/** Office bay for one storey f..f+4: a 1-wide smooth_sandstone pier, then a 2-wide window, glazed 1 deep with black
 *  backing 2 deep, white_terracotta spandrels flush at f, f+1 and f+4. origin = [x, z] of the pier on the wall plane. */
export function officeBay(g, face, origin, f, opts = {}) {
  const at = frame(face, origin), over = opts.over ?? [], out = result();
  const w = (k, d, y, block, state) => put(g, out, at(k, d, y), block, state, over);
  for (let y = f; y <= f + 4; y++) w(0, 0, y, "smooth_sandstone");
  for (const y of [f, f + 1, f + 4]) for (const k of [1, 2]) w(k, 0, y, "white_terracotta");
  for (const y of [f + 2, f + 3]) for (const k of [1, 2]) { w(k, 1, y, "gray_stained_glass"); w(k, 2, y, "black_concrete"); }
  return out;
}

/** Ground-storey bay, 6 long (pier + 5 panes), y 2..6: smooth_stone pier and lintel flush, glass 2 deep at y 3..5, and a
 *  light 3 deep at the middle row behind every other pane (k 1, 3, 5). opts.glass / opts.light / opts.lit = false. */
export function groundBay(g, face, origin, opts = {}) {
  const at = frame(face, origin), over = opts.over ?? [], out = result();
  const w = (k, d, y, block, state) => put(g, out, at(k, d, y), block, state, over);
  for (let y = 2; y <= 6; y++) w(0, 0, y, "smooth_stone");
  for (let k = 1; k <= 5; k++) w(k, 0, 6, "smooth_stone");
  for (let y = 3; y <= 5; y++) for (let k = 1; k <= 5; k++) w(k, 2, y, opts.glass ?? "gray_stained_glass");
  if (opts.lit !== false) for (const k of [1, 3, 5]) w(k, 3, 4, opts.light ?? "sea_lantern");
  return out;
}

/** Flat roof behind a parapet. box = [x0, z0, x1, z1] is the footprint; y is the deck cell (bottom slab). The parapet is
 *  smooth_sandstone at y+1..y+2 on the footprint edge, the smooth_quartz_slab coping sits 1 proud of it at y+2, and a
 *  lantern stands on the deck just inside the parapet, every 8th cell round the inner ring. */
export function roofDeck(g, [x0, z0, x1, z1], y, opts = {}) {
  const over = opts.over ?? [], out = result();
  const w = (cell, block, state) => put(g, out, cell, block, state, over);
  const [slab, slabState] = B.slab("smooth_stone", "top");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    w([x, y, z], slab, slabState);
    if (x === x0 || x === x1 || z === z0 || z === z1) { w([x, y + 1, z], "smooth_sandstone"); w([x, y + 2, z], "smooth_sandstone"); }
  }
  const [coping, copingState] = B.slab("smooth_quartz");
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1) w([x, y + 2, z], coping, copingState);
  }
  const ring = [];
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0 + 1; z <= z1 - 1; z++) {
    if (x === x0 + 1 || x === x1 - 1 || z === z0 + 1 || z === z1 - 1) ring.push([x, z]);
  }
  ring.forEach(([x, z], i) => { if (i % 8 === 0) w([x, y + 1, z], ...B.lantern(false)); });
  return out;
}

/** Aircraft mast: iron_bars y..y+2, lightning_rod y+3..y+4, a lit redstone_torch on top at y+5. (x, z) is the column,
 *  y its base cell (the first cell above the roof slab). */
export function mast(g, x, y, z, opts = {}) {
  const over = opts.over ?? [], out = result();
  const w = (yy, block, state) => put(g, out, [x, yy, z], block, state, over);
  for (let i = 0; i < 3; i++) w(y + i, "iron_bars", { east: "false", north: "false", south: "false", west: "false" });
  for (let i = 3; i < 5; i++) w(y + i, "lightning_rod", { facing: "up", powered: "false" });
  w(y + 5, "redstone_torch", { lit: "true" });
  return out;
}

/** Glazed spur pavilion on footprint box = [x0, z0, x1, z1]; the spine runs along the longer side and its two long
 *  faces are glazed. Quartz pillars on the wall plane every 4 cells and at both ends, y 2..9; glass panes 1 deep between
 *  them; sea_lantern 2 deep behind the panes at y 2..5 (the lit link); a bottom-slab deck at y 10 with a 3-wide glass
 *  skylight down the spine. Ends (the glass doors) are left to the openings. */
export function spurPavilion(g, [x0, z0, x1, z1], opts = {}) {
  const over = opts.over ?? [], out = result();
  const w = (cell, block, state) => put(g, out, cell, block, state, over);
  const alongZ = z1 - z0 >= x1 - x0;
  const cx = (x0 + x1) >> 1, cz = (z0 + z1) >> 1;
  const len = alongZ ? z1 - z0 + 1 : x1 - x0 + 1;
  const pane = alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const sides = alongZ ? [["west", [x0, z0]], ["east", [x1, z0]]] : [["north", [x0, z0]], ["south", [x0, z1]]];
  for (const [face, origin] of sides) {
    const at = frame(face, origin);
    for (let k = 0; k < len; k++) {
      const pier = k % 4 === 0 || k === len - 1;
      for (let y = 2; y <= 9; y++) {
        if (pier) { w(at(k, 0, y), ...B.pillar("quartz_pillar", "y")); continue; }
        w(at(k, 1, y), "light_blue_stained_glass_pane", pane);
        if (y <= 5) w(at(k, 2, y), "sea_lantern");
      }
    }
  }
  const [slab, slabState] = B.slab("smooth_stone", "top");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const sky = alongZ ? Math.abs(x - cx) <= 1 : Math.abs(z - cz) <= 1;
    if (sky) w([x, 10, z], "glass"); else w([x, 10, z], slab, slabState);
  }
  return out;
}

/** The entrance hall's glass wall: light_blue_stained_glass over the whole box = [x0, y0, z0, x1, y1, z1], with rows of
 *  sea_lantern one cell behind it (x1 + 1) at y0+4 and y0+8 (6 and 10 for a hall from y 2). */
export function lobbyGlass(g, [x0, y0, z0, x1, y1, z1], opts = {}) {
  const over = opts.over ?? [], out = result();
  const w = (cell, block, state) => put(g, out, cell, block, state, over);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) w([x, y, z], opts.glass ?? "light_blue_stained_glass");
  for (const y of [y0 + 4, y0 + 8]) if (y <= y1) for (let z = z0; z <= z1; z++) w([x1 + 1, y, z], "sea_lantern");
  return out;
}

/** "TAIPEI CITY HALL" in blue banner letters on white, reading left to right from the street. center = [x, y, z] of the
 *  middle letter, in front of the board (x = the fascia cell's outside), face = the way the board looks (west by default).
 *  bannerWord writes only into air and skips the rest, so placed counts the letters it wrote. */
export function nameBand(g, center, opts = {}) {
  const placed = bannerWord(g, opts.word ?? "TAIPEI CITY HALL", { center, face: opts.face ?? "west", letter: "blue", base: "white" });
  return { placed, refused: [] };
}

/** Lamp post on the apron: andesite_wall 3 high from base y, a lantern standing on top at y+3. Nothing below y. */
export function lampPost(g, x, y, z, opts = {}) {
  const over = opts.over ?? [], out = result();
  const w = (yy, block, state) => put(g, out, [x, yy, z], block, state, over);
  for (let i = 0; i < 3; i++) w(y + i, "andesite_wall", { up: "true" });
  w(y + 3, ...B.lantern(false));
  return out;
}

/** Planter on a roof terrace: moss_block soil on the box's bottom layer, persistent flowering_azalea_leaves on top. The
 *  box is at most 2 high, so the 2 cells above it stay clear for a walker. */
export function planter(g, [x0, y0, z0, x1, y1, z1], opts = {}) {
  if (y1 - y0 > 1) throw new Error(`planter is at most 2 high: y ${y0}..${y1}`);
  const over = opts.over ?? [], out = result();
  const w = (cell, block, state) => put(g, out, cell, block, state, over);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    w([x, y0, z], "moss_block");
    if (y1 > y0) w([x, y1, z], "flowering_azalea_leaves", LEAF);
  }
  return out;
}
