// vocab/h4.mjs: seven plantation helpers from plan.md VOCABULARY: ventArch, chimneyStack, rearPorch, magnolia,
// gatePier, gazebo, riverBand. Shared conventions:
//  - Positions are SITE coordinates as plan.md writes them (ground grass at y0, player stands y1). The build grid's
//    y is the site y (plan y 0..32, vocab/base.mjs), so grid y = site y and SITE_Y is 0.
//  - Each helper takes its position (and facing where it has one) as arguments and returns
//    { box, placed, skipped }: box = the footprint it may write (site coords, inclusive); placed = blocks written;
//    skipped = [x, y, z] cells refused (outside the box, outside the grid, or not air unless { overwrite: true }).
//    Nothing is written below box[1], so ground, sand and floors an earlier part owns are left alone.
//  - Stairs, slabs, pillars, logs and lanterns come from the build library's B helpers (they carry the states).
//  - Leaves are persistent=true (terrain.mjs convention).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export const SITE_Y = 0;
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Inclusive run from a to b, in either direction. */
const span = (a, b) => {
  const s = Math.sign(b - a) || 1, out = [];
  for (let v = a; ; v += s) { out.push(v); if (v === b) break; }
  return out;
};
/** Octagon of radius r (a square of side 2r+1 with the corners cut by one step): offsets [dx, dz]. */
const inOct = (r, dx, dz) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= r + 1;
const octCells = (r) => {
  const out = [];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (inOct(r, dx, dz)) out.push([dx, dz]);
  return out;
};
const octEdge = (r) => octCells(r).filter(([dx, dz]) => NB.some(([a, b]) => !inOct(r, dx + a, dz + b)));
/** Facing of a roof stair on an octagon ring: its full back toward the centre, so the slope falls outward. */
const inward = (dx, dz) => (Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? "north" : "south") : dx > 0 ? "west" : "east");

/** A writer for one helper's footprint. Air only unless overwrite; refusals are recorded, never thrown. */
function ctx(g, box, overwrite) { return { g, box, overwrite, placed: 0, skipped: [] }; }
function put(c, x, y, z, entry) {
  const [x0, y0, z0, x1, y1, z1] = c.box;
  const gy = y + SITE_Y;
  const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
  if (!inside || !c.g.inBounds(x, gy, z) || (!c.overwrite && !c.g.isAir(x, gy, z))) { c.skipped.push([x, y, z]); return; }
  const [block, state, nbt] = entry;
  c.g.set(x, gy, z, block, state, nbt);
  c.placed++;
}
const done = (c) => ({ box: c.box, placed: c.placed, skipped: c.skipped });

/**
 * The arched vent in the brick plinth: iron_bars in the opening at (x, y, z), a three-cell upside-down brick_stairs
 * lintel across it at y+1. face = the way the wall looks; the wall runs across that face (x for north/south).
 */
export function ventArch(g, x, z, { face = "north", y = 1, overwrite = false } = {}) {
  const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const box = [Math.min(x - ax, x + ax), y, Math.min(z - az, z + az), Math.max(x - ax, x + ax), y + 1, Math.max(z - az, z + az)];
  const c = ctx(g, box, overwrite);
  const run = ax ? { east: "true", west: "true" } : { north: "true", south: "true" };
  put(c, x, y, z, ["iron_bars", { north: "false", east: "false", south: "false", west: "false", ...run }]);
  for (const d of [-1, 0, 1]) put(c, x + d * ax, y + 1, z + d * az, B.stairs("brick", OPP[face], "top"));
  return done(c);
}

/**
 * A 2x2 interior brick stack from y (default 0, site) up to y+27: deepslate_bricks band at y+26 with a hay_block under
 * the flue; a lit campfire in the top cell (the flue); an upside-down brick_stairs cap ring at y+27 stepping out.
 * (plan.md's SITE row says the cap sits at y28; VOCABULARY says y27, which is followed here.)
 */
export function chimneyStack(g, x, z, { y: y0 = 0, overwrite = false } = {}) {
  const top = y0 + 27;
  const c = ctx(g, [x - 1, y0, z - 1, x + 2, top, z + 2], overwrite);
  for (let y = y0; y <= top; y++) for (const dx of [0, 1]) for (const dz of [0, 1]) {
    const flue = dx === 0 && dz === 0;
    let entry = ["bricks"];
    if (y === y0 + 26) entry = flue ? ["hay_block", { axis: "y" }] : ["deepslate_bricks"];
    if (y === top && flue) entry = ["campfire", { facing: "north", lit: "true" }];
    put(c, x + dx, y, z + dz, entry);
  }
  // cap ring: the 12 cells round the 2x2, each lip stepping out, its full back toward the stack
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
    if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue;
    const into = dz < 0 ? "south" : dz > 1 ? "north" : dx < 0 ? "east" : "west";
    put(c, x + dx, top, z + dz, B.stairs("brick", into, "top"));
  }
  return done(c);
}

/**
 * The one-storey rear porch against the wing wall at zWall, running to zFront (dir = the sign of zFront - zWall;
 * plan: zWall 75, zFront 79, south). Floor y0 (default 3) smooth_quartz over x0..x1; `posts` slim quartz_pillar posts
 * at zFront, y0+1..y0+4, spread evenly over x0..x1; beam y0+5; a shed roof of deepslate_tile_stairs, high at the wall
 * (y0+7) and low at the eave (y0+6) over zFront..zFront+dir, with a slab fascia under the one-cell overhang; three
 * smooth_quartz_stairs steps down to the lawn, 6 wide and centred on the porch, each with bricks under.
 */
export function rearPorch(g, x0, x1, zWall, zFront, { y0 = 3, posts = 6, overwrite = false } = {}) {
  const d = Math.sign(zFront - zWall);
  const toHouse = d > 0 ? "north" : "south";      // stairs and roof rise toward the wall
  const sx0 = Math.round((x0 + x1) / 2 - 2.5), sx1 = sx0 + 5;
  const zs = [zWall + d, zFront + 3 * d];
  const box = [Math.min(x0, sx0), y0 - 2, Math.min(...zs), Math.max(x1, sx1), y0 + 7, Math.max(...zs)];
  const c = ctx(g, box, overwrite);
  for (const x of span(x0, x1)) {
    for (const z of span(zWall + d, zFront)) put(c, x, y0, z, ["smooth_quartz"]);
    put(c, x, y0 + 5, zFront, ["smooth_quartz"]);
    put(c, x, y0 + 5, zFront + d, B.slab("smooth_quartz", "top"));
    for (const z of span(zWall + d, zWall + 3 * d)) put(c, x, y0 + 7, z, B.stairs("deepslate_tile", toHouse, "bottom"));
    for (const z of span(zFront, zFront + d)) put(c, x, y0 + 6, z, B.stairs("deepslate_tile", toHouse, "bottom"));
  }
  for (let i = 0; i < posts; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / (posts - 1));
    for (let y = y0 + 1; y <= y0 + 4; y++) put(c, x, y, zFront, B.pillar("quartz_pillar", "y"));
  }
  for (const k of [1, 2, 3]) {
    const z = zFront + k * d, y = y0 - (k - 1);
    for (const x of span(sx0, sx1)) {
      put(c, x, y, z, B.stairs("smooth_quartz", toHouse, "bottom"));
      for (let yy = 1; yy < y; yy++) put(c, x, yy, z, ["bricks"]);
    }
  }
  return done(c);
}

/**
 * A flowering magnolia on (x, z): oak_log trunk of `height` cells from y (default 1, on the grass), and a sphere of
 * flowering_azalea_leaves (radius 3, persistent) centred on the trunk top.
 */
export function magnolia(g, x, z, { y = 1, height = 5, overwrite = false } = {}) {
  const cy = y + height;
  const c = ctx(g, [x - 3, y, z - 3, x + 3, cy + 2, z + 3], overwrite);
  for (let dy = 0; dy < height; dy++) put(c, x, y + dy, z, B.log("oak", "y"));
  for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const inTrunk = dx === 0 && dz === 0 && cy + dy < y + height;   // the crown starts round the trunk top
    if (dx * dx + dy * dy + dz * dz <= 10 && !inTrunk) put(c, x + dx, cy + dy, z + dz, ["flowering_azalea_leaves", LEAF]);
  }
  return done(c);
}

/**
 * A gate pier with its 2x2 base on (x, z): bricks from y (default 1, on the grass) for 4 courses, smooth_quartz cap at
 * y+4, a standing lantern on the cap at y+5. (plan.md's absolute y0 would replace the grass; the default stands on it.)
 */
export function gatePier(g, x, z, { y = 1, overwrite = false } = {}) {
  const c = ctx(g, [x, y, z, x + 1, y + 5, z + 1], overwrite);
  for (const dx of [0, 1]) for (const dz of [0, 1]) {
    for (let dy = 0; dy < 4; dy++) put(c, x + dx, y + dy, z + dz, ["bricks"]);
    put(c, x + dx, y + 4, z + dz, ["smooth_quartz"]);
  }
  put(c, x, y + 5, z, B.lantern(false));
  return done(c);
}

/**
 * The garden pavilion centred on (cx, cz), per plan.md's gazebo row and R-gazebo. Octagon floor of smooth_quartz at y
 * (default 1); a smooth_quartz_stairs step on the `face` side (default north), open there; 8 quartz_pillar columns at
 * the octagon corners, y+1..y+4; birch_fence balustrade at y+1 round the rest; smooth_quartz frieze at y+5 with a
 * smooth_quartz_slab eave ring at radius 4; then three courses of deepslate_tile_stairs stepping in from radius 4 to 2
 * (solid fill inside), a chiseled_quartz_block apex at y+8 and a lightning_rod at y+9.
 */
export function gazebo(g, cx, cz, { y = 1, face = "north", overwrite = false } = {}) {
  const c = ctx(g, [cx - 4, y, cz - 4, cx + 4, y + 9, cz + 4], overwrite);
  const [nx, nz] = DIR[face];
  const corner = (dx, dz) => Math.abs(dx) + Math.abs(dz) === 4 && Math.max(Math.abs(dx), Math.abs(dz)) === 3;
  const opening = (dx, dz) => dx * nx + dz * nz === 3 && Math.abs(dx * Math.abs(nz) + dz * Math.abs(nx)) <= 1;

  for (const [dx, dz] of octCells(3)) put(c, cx + dx, y, cz + dz, ["smooth_quartz"]);
  put(c, cx + 4 * nx, y, cz + 4 * nz, B.stairs("smooth_quartz", OPP[face], "bottom"));

  const cols = octEdge(3).filter(([dx, dz]) => corner(dx, dz));
  for (const [dx, dz] of cols) for (let dy = 1; dy <= 4; dy++) put(c, cx + dx, y + dy, cz + dz, B.pillar("quartz_pillar", "y"));

  const rails = octEdge(3).filter(([dx, dz]) => !corner(dx, dz) && !opening(dx, dz));
  const railAt = new Set(rails.map(([dx, dz]) => `${dx},${dz}`));
  const joins = (dx, dz, a, b) => railAt.has(`${dx + a},${dz + b}`) || cols.some(([kx, kz]) => kx === dx + a && kz === dz + b);
  for (const [dx, dz] of rails) {
    const sides = Object.fromEntries(Object.entries(DIR).map(([name, [a, b]]) => [name, joins(dx, dz, a, b) ? "true" : "false"]));
    put(c, cx + dx, y + 1, cz + dz, ["birch_fence", sides]);
  }

  for (const [dx, dz] of octEdge(3)) put(c, cx + dx, y + 5, cz + dz, ["smooth_quartz"]);
  for (const [dx, dz] of octEdge(4)) put(c, cx + dx, y + 5, cz + dz, B.slab("smooth_quartz", "top"));

  for (let i = 0; i < 3; i++) {
    const R = 4 - i, yy = y + 6 + i;
    for (const [dx, dz] of octCells(R - 1)) {
      const apex = i === 2 && dx === 0 && dz === 0;
      put(c, cx + dx, yy, cz + dz, apex ? ["chiseled_quartz_block"] : i < 2 ? ["deepslate_tiles"] : ["polished_deepslate"]);
    }
    for (const [dx, dz] of octEdge(R)) put(c, cx + dx, yy, cz + dz, B.stairs("deepslate_tile", inward(dx, dz), "bottom"));
  }
  put(c, cx, y + 9, cz, ["lightning_rod", { facing: "up", powered: "false" }]);
  return done(c);
}

/**
 * The river edge from plan.md's SITE rows. Bank: sand at y0 on row zBank, sand at y-1 on zBank+1 with air above. River:
 * from zBank+2 to zEnd, air at y0, water at y-3..-1 (surface y-1), sand bed at y-4, x0..x1. Air only: carve the bank
 * and river first, or pass { overwrite: true }.
 */
export function riverBand(g, x0, x1, zBank, zEnd, { overwrite = false } = {}) {
  const c = ctx(g, [x0, -4, zBank, x1, 0, zEnd], overwrite);
  for (const x of span(x0, x1)) {
    put(c, x, 0, zBank, ["sand"]);
    put(c, x, -1, zBank + 1, ["sand"]);
    put(c, x, 0, zBank + 1, ["air"]);
    for (const z of span(zBank + 2, zEnd)) {
      put(c, x, 0, z, ["air"]);
      put(c, x, -4, z, ["sand"]);
      for (let y = -3; y <= -1; y++) put(c, x, y, z, ["water"]);
    }
  }
  return done(c);
}
