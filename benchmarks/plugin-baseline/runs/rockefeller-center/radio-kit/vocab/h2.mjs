// H2 vocabulary (plan.md VOCABULARY): setback_deck, lit_window_cluster, marquee_corner, blade_sign, glazed_front,
// garden_bed, sidewalk. Every helper takes its footprint (and facing, where it has one) as arguments, writes only
// inside that footprint, and only into air unless it is given { replace: true }.
// Block ids are the plan.md PALETTE as literals; nothing is imported from the other vocab/ files.
import { B, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One guarded write: into air only, unless replace. Returns 1 when the cell was written.
function put(g, [x, y, z], block, state = {}, replace = false) {
  if (!g.inBounds(x, y, z)) return 0;
  if (!replace && !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// [dx, dz] from a glass cell on a face into the building (the way the face looks out is the opposite).
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// A roof deck at y over the footprint [x0, z0, x1, z1]: ground material in the deck, sea_lantern flush in it every
// lightEvery cells (on the foot of the parapet too), and a smooth_sandstone parapet one block above the deck on the
// outer ring. Writes only at y and y + 1.
export function setback_deck(g, [x0, z0, x1, z1], { y, ground = "light_gray_concrete", lightEvery = 6, replace = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    if (rim) n += put(g, [x, y + 1, z], "smooth_sandstone", {}, replace);
    const lit = (x - x0) % lightEvery === 0 && (z - z0) % lightEvery === 0;
    n += put(g, [x, y, z], lit ? "sea_lantern" : ground, {}, replace);
  }
  return n;
}

// n (2..6) adjacent strip glass cells lit from behind: shroomlight in the cell directly inside each one. face is the way
// the wall looks out (north, south, east, west); plane is the glass cell's z (north/south faces) or x (east/west faces).
// The cluster is the first run of n strip glass cells on that row, or the run starting at `at` (its coordinate along
// the face). clear: also turn those glass cells to clear glass (the lit look); that is the one non-air write.
// Returns the number of blocks placed.
export function lit_window_cluster(g, face, plane, y, n, { at, clear = false, replace = false } = {}) {
  const alongX = face === "north" || face === "south";
  const cell = (s) => (alongX ? [s, y, plane] : [plane, y, s]);
  const isGlass = (s) => /(^|:)(gray_stained_glass|glass)$/.test(g.blockAt(...cell(s)));
  let start = null;
  if (at != null) { if ([...Array(n).keys()].every((i) => isGlass(at + i))) start = at; }
  else {
    const size = alongX ? g.size[0] : g.size[2];
    for (let s = 0, run = 0; s < size && start == null; s++) {
      run = isGlass(s) ? run + 1 : 0;
      if (run === n) start = s - n + 1;
    }
  }
  if (start == null) return 0;
  const [dx, dz] = INWARD[face];
  let placed = 0;
  for (let i = 0; i < n; i++) {
    const [x, , z] = cell(start + i);
    if (clear) placed += put(g, [x, y, z], "glass", {}, true);
    placed += put(g, [x + dx, y, z + dz], "shroomlight", {}, replace);
  }
  return placed;
}

// The rounded south-west corner of plot 0's marquee. [x, z] is the air cell left out for the round (plan: x1 z52); the
// runs leave it toward -z (west run, front column x) and +x (south run, front row z). The corner body is the other three
// cells of the 2x2. Bands per plan: y6 front red neon over shroomlight, y7..8 silver, y9 blue neon over sea_lantern,
// y10 quartz slab top with sea_lantern behind, end_rod bulbs at y11 on the front; soffit lights at y5 under the body.
export function marquee_corner(g, [x, z], { y = 6, replace = false } = {}) {
  const west = [x, z - 1], south = [x + 1, z], back = [x + 1, z - 1];
  const front = ["red_stained_glass", "light_gray_concrete", "light_gray_concrete", "blue_stained_glass"];
  let n = 0;
  for (const [cx, cz] of [west, south]) {
    front.forEach((block, i) => { n += put(g, [cx, y + i, cz], block, {}, replace); });
    n += put(g, [cx, y + 4, cz], ...B.slab("smooth_quartz", "bottom"), replace);
    n += put(g, [cx, y + 5, cz], "end_rod", { facing: "up" }, replace);
  }
  const [bx, bz] = back;
  n += put(g, [bx, y, bz], "shroomlight", {}, replace);
  n += put(g, [bx, y + 1, bz], "light_gray_concrete", {}, replace);
  n += put(g, [bx, y + 2, bz], "light_gray_concrete", {}, replace);
  n += put(g, [bx, y + 3, bz], "sea_lantern", {}, replace);
  n += put(g, [bx, y + 4, bz], "sea_lantern", {}, replace);
  n += put(g, [west[0], y - 1, west[1]], "glowstone", {}, replace);
  n += put(g, [bx, y - 1, bz], "sea_lantern", {}, replace);
  n += put(g, [south[0], y - 1, south[1]], "glowstone", {}, replace);
  return n;
}

// The vertical blade sign over the box [x0, y0, z0, x1, y1, z1] (plan: 0,11,51,4,34,52). The body runs y0..y1-2; the
// stepped cap is iron_block (y1-1 across the inner columns, y1 at the centre) with end_rod on top. Sea_lantern ring on
// both faces; the south face (z1) is blue_concrete with a silver centre column; the north face (z0) is all blue_concrete.
// Letters are red on white wall banners on the row z1 + 1, one per two rows from y1-3 down, a blank row for each space.
// replace: the blade replaces the mass wall cells it stands on (the plan says it does; pass it from the facade part).
export function blade_sign(g, [x0, y0, z0, x1, y1, z1], { word = "RADIO CITY", replace = false } = {}) {
  const mid = (x0 + x1) >> 1, top = y1 - 2;
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= top; y++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || y === y0 || y === top;
    const silver = z === z1 && x === mid;
    const block = ring ? "sea_lantern" : silver ? "light_gray_concrete" : "blue_concrete";
    n += put(g, [x, y, z], block, {}, replace);
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0; z <= z1; z++) n += put(g, [x, y1 - 1, z], "iron_block", {}, replace);
  for (let z = z0; z <= z1; z++) {
    n += put(g, [mid, y1, z], "iron_block", {}, replace);
    n += put(g, [mid, y1 + 1, z], "end_rod", { facing: "up" }, replace);
  }
  [...word].forEach((ch, i) => {
    n += bannerWord(g, ch, { center: [mid, y1 - 3 - 2 * i, z1 + 1], face: "south", letter: "red", base: "white" });
  });
  return n;
}

// A glazed front on the box [x0, y0, z0, x1, y1, z1], which is one block deep on the facing axis, glass at its outer face.
// facing is the way the glass looks out (required). Glass panes, waxed_cut_copper mullions every mullionEvery cells,
// and a shroomlight ceiling course on the inside of the top row. No door block: the doors are panes.
export function glazed_front(g, [x0, y0, z0, x1, y1, z1], { facing, mullionEvery = 3, replace = false } = {}) {
  if (!INWARD[facing]) throw new Error("glazed_front needs facing: north, south, east or west");
  const alongX = facing === "north" || facing === "south";
  const s0 = alongX ? x0 : z0, s1 = alongX ? x1 : z1;
  const p = { north: z0, south: z1, east: x1, west: x0 }[facing];
  const cell = (s, y) => (alongX ? [s, y, p] : [p, y, s]);
  const pane = alongX ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  const [dx, dz] = INWARD[facing];
  let n = 0;
  for (let s = s0; s <= s1; s++) {
    for (let y = y0; y <= y1; y++) {
      if ((s - s0) % mullionEvery === 0) n += put(g, cell(s, y), "waxed_cut_copper", {}, replace);
      else n += put(g, cell(s, y), "glass_pane", { ...pane, waterlogged: "false" }, replace);
    }
    const [bx, bz] = alongX ? [s, p + dz] : [p + dx, s];
    n += put(g, [bx, y1, bz], "shroomlight", {}, replace);
  }
  return n;
}

// A roof garden bed on the footprint [x0, z0, x1, z1] at y (the planting layer, one above the deck): smooth_sandstone
// kerb on the outer ring, moss_block soil inside, a persistent oak_leaves hedge down the middle along the long side,
// azalea and flowering_azalea in the rest, and a lantern on the kerb every 6 cells round the rim.
export function garden_bed(g, [x0, z0, x1, z1], { y, replace = false } = {}) {
  const longX = x1 - x0 >= z1 - z0;
  const mid = longX ? (z0 + z1) >> 1 : (x0 + x1) >> 1;
  const rim = [];
  for (let x = x0; x <= x1; x++) rim.push([x, z0]);
  for (let z = z0 + 1; z <= z1; z++) rim.push([x1, z]);
  for (let x = x1 - 1; x >= x0; x--) rim.push([x, z1]);
  for (let z = z1 - 1; z > z0; z--) rim.push([x0, z]);
  let n = 0;
  rim.forEach(([x, z], i) => {
    n += put(g, [x, y, z], "smooth_sandstone", {}, replace);
    if (i % 6 === 0) n += put(g, [x, y + 1, z], ...B.lantern(false), replace);
  });
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0 + 1; z <= z1 - 1; z++) {
    n += put(g, [x, y, z], "moss_block", {}, replace);
    const onHedge = (longX ? z : x) === mid;
    if (onHedge) n += put(g, [x, y + 1, z], "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }, replace);
    else n += put(g, [x, y + 1, z], (x + z) % 3 === 0 ? "flowering_azalea" : "azalea", {}, replace);
  }
  return n;
}

// A sidewalk course at y over the footprint [x0, z0, x1, z1]: smooth_stone, with a polished_andesite kerb on the outer row.
export function sidewalk(g, [x0, z0, x1, z1], { y, replace = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const kerb = x === x0 || x === x1 || z === z0 || z === z1;
    n += put(g, [x, y, z], kerb ? "polished_andesite" : "smooth_stone", {}, replace);
  }
  return n;
}
