// Capitol vocabulary, part h2 (plan.md VOCABULARY): wingBody, pediment, windowBay, westSteps, ringPost, attic,
// tholos, baseGlow. Each takes the grid first, then its position and facing as arguments, and returns
// { placed, refused }. Writes go into air only, so an earlier part's cells are never overwritten; the two opening
// helpers (windowBay, westSteps) cut their own named footprint out of the shell and nothing else.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = "minecraft:air";
const STEP = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] }; // (x, z) per facing
const OPPOSITE = { east: "west", west: "east", north: "south", south: "north" };
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const result = () => ({ placed: 0, refused: [] });

// One write. Air-only unless cut. A refused write (not air, or a cell guard() protects) is reported, never forced.
function put(out, g, [x, y, z], block, state, cut = false) {
  if (!cut && !g.isAir(x, y, z)) {
    out.refused.push([x, y, z, block]);
    return;
  }
  const before = g.refused?.length ?? 0;
  g.set(x, y, z, block, state);
  if ((g.refused?.length ?? 0) > before) out.refused.push([x, y, z, block]);
  else out.placed++;
}

function merge(out, part) {
  out.placed += part.placed;
  out.refused.push(...part.refused);
  return out;
}

// Kept cells of the disc of even diameter d on the dome axis (cx, cz): x cx-d/2 .. cx+d/2-1, kept where
// (x+.5-cx)^2 + (z+.5-cz)^2 <= (d/2)^2.
function disc(d, cx, cz) {
  const r2 = (d / 2) ** 2, cells = [];
  for (let x = cx - d / 2; x < cx + d / 2; x++)
    for (let z = cz - d / 2; z < cz + d / 2; z++)
      if ((x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= r2) cells.push([x, z]);
  return cells;
}

// Outer ring of a disc: kept cells with a non-kept 4-neighbour, in angular order (so "every other" is even spacing).
function ring(d, cx, cz) {
  const cells = disc(d, cx, cz), kept = new Set(cells.map(([x, z]) => `${x},${z}`));
  const angle = ([x, z]) => Math.atan2(z + 0.5 - cz, x + 0.5 - cx);
  return cells
    .filter(([x, z]) => NEIGHBOURS.some(([dx, dz]) => !kept.has(`${x + dx},${z + dz}`)))
    .sort((a, b) => angle(a) - angle(b));
}

// Stair facing for a lip pointing out of a ring cell: the stair's back (its facing) points at the axis.
function inwardFrom(cx, cz, [x, z]) {
  const dx = x + 0.5 - cx, dz = z + 0.5 - cz;
  if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? "west" : "east";
  return dz > 0 ? "north" : "south";
}

// diorite_wall state for a post: up, plus a low arm toward each neighbouring post in the same course.
function wallState(keys, x, y, z) {
  const s = { up: "true" };
  for (const [side, [dx, dz]] of [["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]])
    if (keys.has(`${x + dx},${y},${z + dz}`)) s[side] = "low";
  return s;
}

/**
 * Wing body: a 2-thick smooth_quartz wall ring on the box's outer line, y5..11, smooth_stone core behind it, and a
 * smooth_stone_slab deck (bottom) at y12 inside the balustrade line. box = the wall box (x0..x1, z0..z1).
 * ground: the lowest course (default 5); cells under the floor are core only where the podium left air.
 */
export function wingBody(g, { x0, x1, z0, z1 }, { ground = 5 } = {}) {
  const out = result();
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const wall = x - x0 < 2 || x1 - x < 2 || z - z0 < 2 || z1 - z < 2;
      for (let y = ground; y <= 11; y++) put(out, g, [x, y, z], wall && y >= 5 ? "smooth_quartz" : "smooth_stone");
    }
  const [slab, slabState] = B.slab("smooth_stone", "bottom");
  for (let x = x0 + 1; x <= x1 - 1; x++)
    for (let z = z0 + 1; z <= z1 - 1; z++) put(out, g, [x, 12, z], slab, slabState);
  return out;
}

/**
 * Pediment: a low temple gable. The triangle stands in the plane across the ridge; the ridge runs along `ridge`
 * (x: the triangle faces east/west, z: north/south). Base = box width on the other axis, at course y0+1 (the
 * cornice is smooth_quartz at y0). Each course is 2 cells in from each side of the one below (1 up per 2 across).
 * Raking end cells are smooth_quartz_stairs rising to the centre; the outer face carries a chiseled centre at course 1.
 * face: outward side of the triangle (default east for ridge x, south for ridge z). steps: optional course cap.
 */
export function pediment(g, { x0, x1, z0, z1, y0 = 11, ridge = "x", face, chiseled = true, steps = Infinity }) {
  const out = result();
  const alongX = ridge === "x";
  const [t0, t1, b0, b1] = alongX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
  const at = (t, b, y) => (alongX ? [t, y, b] : [b, y, t]);
  const outward = face ?? (alongX ? "east" : "south");
  const outerT = outward === "east" || outward === "south" ? t1 : t0;
  const plusB = alongX ? "south" : "east", minusB = OPPOSITE[plusB];
  for (let t = t0; t <= t1; t++) for (let b = b0; b <= b1; b++) put(out, g, at(t, b, y0), "smooth_quartz");
  for (let k = 0; b0 + 2 * k <= b1 - 2 * k && k < steps; k++) {
    const y = y0 + 1 + k, lo = b0 + 2 * k, hi = b1 - 2 * k, width = hi - lo + 1;
    for (let t = t0; t <= t1; t++)
      for (let b = lo; b <= hi; b++) {
        if (width > 2 && (b === lo || b === hi)) {
          const [block, state] = B.stairs("smooth_quartz", b === lo ? plusB : minusB, "bottom");
          put(out, g, at(t, b, y), block, state);
        } else if (chiseled && k === 1 && t === outerT && Math.abs(b - (b0 + b1) / 2) < 1)
          put(out, g, at(t, b, y), "chiseled_quartz_block");
        else put(out, g, at(t, b, y), "smooth_quartz");
      }
  }
  return out;
}

/**
 * Window in an outer wall: face = outward side of the wall (west/east/north/south), wall = the outer wall cell's
 * coordinate (x for east/west faces, z for north/south), pos = the window's coordinate along the face. The outer
 * cell is a 1-deep recess (air), a gray_stained_glass_pane in the second cell, glowstone behind it in the third if
 * lit. tall: an upside-down polished_diorite_stairs lintel in the outer cell above. Cuts its own cells only.
 */
export function windowBay(g, { face, wall, pos, y0, y1, tall = false, lit = false }) {
  const out = result();
  const alongX = face === "east" || face === "west";
  const inward = OPPOSITE[face], [ix, iz] = STEP[inward];
  const cell = (k, y) => (alongX ? [wall + k * ix, y, pos] : [pos, y, wall + k * iz]);
  const panes = { north: "true", south: "true", east: "true", west: "true" };
  panes[face] = "false"; // the outer side is open air; every other side meets wall, pane or core
  for (let y = y0; y <= y1; y++) {
    put(out, g, cell(0, y), AIR, undefined, true);
    put(out, g, cell(1, y), "gray_stained_glass_pane", panes, true);
    if (lit) put(out, g, cell(2, y), "glowstone", undefined, true);
  }
  if (tall) {
    const [block, state] = B.stairs("polished_diorite", inward, "top");
    put(out, g, cell(0, y1 + 1), block, state, true);
  }
  return out;
}

/**
 * Inaugural west steps for the flight z0..z1 (4 wide), x1..x9. Stair columns x1,2,3,6,7 rise east (facing east) from
 * the solid fill down to ground; landings x4..5 (solid to y2, bottom slab y3) and x8..9 (solid to y4, bottom slab y5
 * as the loggia floor). Above each step the podium is carved to a clear lane, and diorite_wall cheeks stand on the
 * flight edges over the stair columns. Cuts its own flight only.
 */
export function westSteps(g, { z0, z1, ground = 0 }) {
  const out = result();
  const stepY = { 1: 0, 2: 1, 3: 2, 6: 3, 7: 4 };
  const [slab, slabState] = B.slab("smooth_stone", "bottom");
  for (let x = 1; x <= 9; x++)
    for (let z = z0; z <= z1; z++)
      for (let y = ground; y <= 5; y++) {
        let block = AIR, state;
        if (x in stepY) {
          if (y < stepY[x]) block = "smooth_quartz";
          else if (y === stepY[x]) [block, state] = B.stairs("smooth_quartz", "east", "bottom");
        } else if (x <= 5) {
          if (y <= 2) block = "smooth_quartz";
          else if (y === 3) [block, state] = [slab, slabState];
        } else if (y <= 4) block = "smooth_quartz";
        else if (y === 5) [block, state] = [slab, slabState];
        put(out, g, [x, y, z], block, state, true);
      }
  for (const x of Object.keys(stepY).map(Number))
    for (const z of [z0, z1]) put(out, g, [x, stepY[x] + 1, z], "diorite_wall", undefined, true);
  return out;
}

/**
 * Posts on every `every`-th cell of the outer ring of disc d on the axis (cx, cz), from y0 to y1, air-only.
 * Walls get up + low arms to neighbouring posts; quartz_pillar gets axis y; other blocks take `state` as given.
 */
export function ringPost(g, { cx, cz, d, y0, y1, block, state, every = 1 }) {
  const out = result();
  const posts = ring(d, cx, cz).filter((_, i) => i % every === 0);
  const keys = new Set();
  for (const [x, z] of posts) for (let y = y0; y <= y1; y++) keys.add(`${x},${y},${z}`);
  for (const [x, z] of posts)
    for (let y = y0; y <= y1; y++) {
      const s = state ?? (block.endsWith("_wall") ? wallState(keys, x, y, z) : block === "quartz_pillar" ? { axis: "y" } : undefined);
      put(out, g, [x, y, z], block, s);
    }
  return out;
}

/**
 * Attic over the dome base: a d14 ring wall y22..24 (smooth_quartz, a pane at y23 in every third ring cell), a solid
 * smooth_stone core inside it so no hollow spawns mobs, and a cornice disc at y25 whose outer ring is upside-down
 * smooth_quartz_stairs with the lip out.
 */
export function attic(g, { cx, cz, d = 14, y0 = 22, y1 = 24, cornice = 25 }) {
  const out = result();
  const kept = new Set(disc(d, cx, cz).map(([x, z]) => `${x},${z}`));
  const outer = ring(d, cx, cz), outerKeys = new Set(outer.map(([x, z]) => `${x},${z}`));
  const windowed = new Set(outer.filter((_, i) => i % 3 === 0).map(([x, z]) => `${x},${z}`));
  for (const [x, z] of disc(d, cx, cz)) {
    const isRing = outerKeys.has(`${x},${z}`);
    for (let y = y0; y <= y1; y++) {
      if (!isRing) put(out, g, [x, y, z], "smooth_stone");
      else if (y === 23 && windowed.has(`${x},${z}`)) {
        const panes = {};
        for (const [side, [dx, dz]] of [["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]])
          panes[side] = kept.has(`${x + dx},${z + dz}`) ? "true" : "false";
        put(out, g, [x, y, z], "gray_stained_glass_pane", panes);
      } else put(out, g, [x, y, z], "smooth_quartz");
    }
    if (isRing) {
      const [block, state] = B.stairs("smooth_quartz", inwardFrom(cx, cz, [x, z]), "top");
      put(out, g, [x, cornice, z], block, state);
    } else put(out, g, [x, cornice, z], "smooth_quartz");
  }
  return out;
}

/**
 * Lantern (tholos) on the dome axis: diorite_wall posts on the d4 ring y34..35, a glowstone core (d2) y34..35,
 * a d4 cap at y36 (outer ring of smooth_quartz_stairs with the lip out, smooth_quartz core), and a d2 smooth_quartz
 * top at y37.
 */
export function tholos(g, { cx, cz }) {
  const out = result();
  merge(out, ringPost(g, { cx, cz, d: 4, y0: 34, y1: 35, block: "diorite_wall" }));
  for (const [x, z] of disc(2, cx, cz)) for (let y = 34; y <= 35; y++) put(out, g, [x, y, z], "glowstone");
  const outer = new Set(ring(4, cx, cz).map(([x, z]) => `${x},${z}`));
  for (const [x, z] of disc(4, cx, cz)) {
    if (outer.has(`${x},${z}`)) {
      const [block, state] = B.stairs("smooth_quartz", inwardFrom(cx, cz, [x, z]), "bottom");
      put(out, g, [x, 36, z], block, state);
    } else put(out, g, [x, 36, z], "smooth_quartz");
  }
  for (const [x, z] of disc(2, cx, cz)) put(out, g, [x, 37, z], "smooth_quartz");
  return out;
}

/**
 * Standing lanterns at the given [x, y, z] points (e.g. podium ledges at y5, either side of the west-steps landing).
 * A lantern needs a support: refused over air or over a bottom slab or bottom stair (never on a bottom slab).
 */
export function baseGlow(g, points) {
  const out = result();
  for (const [x, y, z] of points) {
    const below = g.get(x, y - 1, z);
    const halfBlock = below && ((/_slab$/.test(below.block) && below.state?.type === "bottom") ||
      (/_stairs$/.test(below.block) && below.state?.half === "bottom"));
    if (g.isAir(x, y - 1, z) || halfBlock) out.refused.push([x, y, z, "lantern"]);
    else put(out, g, [x, y, z], "lantern", { hanging: "false", waterlogged: "false" });
  }
  return out;
}
