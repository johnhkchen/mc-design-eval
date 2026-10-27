// plan.md VOCABULARY helpers 4, 8, 12, 16, 20, 24, 28, 32, 36: setoffPier, radialChapel, leanToPolar, balustrade,
// flyer, roseWindow, colonnade, spireTip, floodlight. Every one takes the grid `g` first and its position (and face) in
// an options object; it writes only its own footprint and only into air unless { overwrite: true } (floodlight replaces
// the ground cell by definition). Each returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for
// a write onto a non-air cell, off the grid, or refused by a guard. Block ids are literals from plan.md's PALETTE.
// Polar helpers work about C = (152, 38); angle 0 points east (+x), +90 south (+z), -90 north.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Deterministic per-cell hash in [0, 1): the 70/30 and 1-in-n mixes never change between runs.
const hash = (x, y, z) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};

// Stairs without `waterlogged`: `$MCD states` lists none for these blocks in 1.21.1.
const stairs = (mat, facing, half = "bottom", shape = "straight") => [`${mat}_stairs`, { facing, half, shape }];
const slab = (mat, type = "bottom") => [`${mat}_slab`, { type }];
const facingTo = ([dx, dz]) => (Math.abs(dx) >= Math.abs(dz) ? (dx >= 0 ? "east" : "west") : (dz >= 0 ? "south" : "north"));
const C = [152, 38];
const rad = (deg) => (deg * Math.PI) / 180;

function writer(g, overwrite = false) {
  const out = { cells: 0, refused: [] };
  out.put = (x, y, z, block, state) => {
    if (!g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) { out.refused.push([x, y, z, block]); return false; }
    g.set(x, y, z, block, state);
    if (g.blockAt(x, y, z) !== `minecraft:${block}`) { out.refused.push([x, y, z, block]); return false; } // a guard said no
    out.cells++;
    return true;
  };
  return out;
}
const done = ({ cells, refused }, extra = {}) => ({ cells, refused, ...extra });

// Wall-block state joined to the wall blocks beside it (balustrades, spokes): low arms, a post unless a straight run.
const WALLISH = /_wall$|iron_bars$|_pane$/;
function joinWalls(g, cells) {
  for (const [x, y, z] of cells) {
    const b = g.blockAt(x, y, z);
    if (!/_wall$/.test(b)) continue;
    const st = {};
    for (const [d, [dx, , dz]] of Object.entries(DIRS)) st[d] = g.inBounds(x + dx, y, z + dz) && WALLISH.test(g.blockAt(x + dx, y, z + dz)) ? "low" : "none";
    const arms = Object.keys(DIRS).filter((d) => st[d] === "low");
    st.up = arms.length === 2 && OPPOSITE[arms[0]] === arms[1] && !WALLISH.test(g.blockAt(x, y + 1, z)) ? "false" : "true";
    g.set(x, y, z, b.replace(/^minecraft:/, ""), st);
  }
}

/**
 * 4. A buttress pier `width` (2) wide, stepping back in set-offs. North/south face: the pier is x..x+1 and runs z0..z1
 * (wall end to the outer face); east/west face: pass { z, x0, x1 } and it is z..z+1 running x0..x1. setoffs [[face,
 * yTop], ...] = the outer face plane of each stage and its top, outermost first (south flank [[69,20],[68,30],[67,38]],
 * north [[7,20],[8,30],[9,38]]). `smooth_sandstone`, `sandstone` on ~1/8 of the cells; each set-off but the topmost (the
 * pinnacle stands there) gets a weathering at yTop+1 on its stepped-back row: `smooth_sandstone_stairs` (bottom, facing
 * back to the wall). The floodlight cell 1 out at the foot is not touched. Footprint: width x (z0..z1), y0..max yTop+1.
 */
export function setoffPier(g, { x, z, z0, z1, x0, x1, y0 = 3, setoffs, face, width = 2, capTop = false, overwrite = false }) {
  const out = writer(g, overwrite);
  const ns = face === "north" || face === "south";
  const [d0, d1] = ns ? [Math.min(z0, z1), Math.max(z0, z1)] : [Math.min(x0, x1), Math.max(x0, x1)];
  const w0 = ns ? x : z;
  const sgn = DIRS[face][0] + DIRS[face][2]; // +1 when the face looks toward +x/+z
  const back = OPPOSITE[face];
  const at = (w, d, y, ...b) => (ns ? out.put(w, y, d, ...b) : out.put(d, y, w, ...b));
  // the column top at depth d: the highest stage whose face plane is at or beyond d (outward)
  const topAt = (d) => Math.max(-Infinity, ...setoffs.filter(([f]) => (f - d) * sgn >= 0).map(([, t]) => t));
  for (let w = w0; w < w0 + width; w++) {
    for (let d = d0; d <= d1; d++) {
      const top = topAt(d);
      for (let y = y0; y <= top; y++) at(w, d, y, hash(w, y, d) < 0.125 ? "sandstone" : "smooth_sandstone");
    }
    const steps = [...setoffs].sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < steps.length; i++) {
      if (i === steps.length - 1 && !capTop) break;
      const [f, t] = steps[i];
      at(w, f, t + 1, ...stairs("smooth_sandstone", back));
    }
  }
  return done(out);
}

/**
 * 8. A radiating chapel at `angle` about C: a box `width` (7) wide tangentially from rIn to rOut, walls 1 thick (its
 * inner end left open to the ambulatory), y0..19; its outer face pierced by one lancet 3 x 12 (y 5..16: air with
 * `cut_sandstone` jambs, a top `smooth_sandstone_slab` sill at y 4, the top row narrowed to 1 under upside-down stairs).
 * Roof R6 (y 20..24): a little gable of `deepslate_tile_stairs` rising to a ridge that points out radially, `deepslate_tiles`
 * under it, `deepslate_tile_slab` ridge at 24, the outer gable triangle in `smooth_sandstone`. Corner pinnacles (small) at
 * the two outer corners: `sandstone_wall` y 21..25, `end_stone_brick_wall` 26. { walls, roof, pinnacles } pick the halves
 * (P1 walls; P2 roof + pinnacles). Footprint: the cells within rIn-0.5..rOut+0.5 radially and |v| <= width/2, y y0..26.
 */
export function radialChapel(g, { angle, rIn = 26, rOut = 29, width = 7, y0 = 3, centre = C, walls = true, roof = true, pinnacles = roof, overwrite = false }) {
  const out = writer(g, overwrite);
  const [cx, cz] = centre, [ca, sa] = [Math.cos(rad(angle)), Math.sin(rad(angle))];
  const uv = (x, z) => [(x - cx) * ca + (z - cz) * sa, -(x - cx) * sa + (z - cz) * ca];
  const half = width / 2;
  const inside = (x, z) => { const [u, v] = uv(x, z); return u >= rIn - 0.5 && u <= rOut + 0.5 && Math.abs(v) <= half; };
  const cols = [];
  const R = rOut + width + 2;
  for (let x = Math.floor(cx + Math.min(0, rOut * ca) - R); x <= cx + Math.max(0, rOut * ca) + R; x++)
    for (let z = Math.floor(cz + Math.min(0, rOut * sa) - R); z <= cz + Math.max(0, rOut * sa) + R; z++) {
      if (!inside(x, z)) continue;
      const [u, v] = uv(x, z);
      // a wall cell has a 4-neighbour outside the chapel (the inner end, below rIn, does not count: it stays open)
      const open = (a, b) => { const [nu, nv] = uv(a, b); return nu < rIn - 0.5 && Math.abs(nv) <= half - 1; };
      const shell = Object.values(DIRS).some(([dx, , dz]) => !inside(x + dx, z + dz) && !open(x + dx, z + dz));
      cols.push({ x, z, u, v, shell, outer: shell && u > rOut - 1 });
    }
  const tanFace = (v) => facingTo(v >= 0 ? [-sa, ca] : [sa, -ca]); // tangential, away from the chapel axis
  if (walls) {
    for (const c of cols) {
      if (!c.shell) continue;
      const av = Math.abs(c.v);
      for (let y = y0; y <= 19; y++) {
        if (c.outer && av <= 1.5 && y >= 5 && y <= 16) {
          if (y === 16 && av > 0.5) out.put(c.x, y, c.z, ...stairs("smooth_sandstone", tanFace(c.v), "top"));
          continue; // the opening: air
        }
        if (c.outer && av <= 1.5 && y === 4) { out.put(c.x, y, c.z, ...slab("smooth_sandstone", "top")); continue; }
        if (c.outer && av <= 2.5 && y >= 4 && y <= 16) { out.put(c.x, y, c.z, "cut_sandstone"); continue; }
        out.put(c.x, y, c.z, "smooth_sandstone");
      }
    }
  }
  const corners = [half - 0.5, -(half - 0.5)].map((v) => {
    const u = rOut;
    return [Math.round(cx + u * ca - v * sa), Math.round(cz + u * sa + v * ca)];
  });
  const isCorner = (x, z) => corners.some(([a, b]) => a === x && b === z);
  if (roof) {
    for (const c of cols) {
      const t = Math.abs(c.v), k = 3 - Math.min(3, Math.floor(t + 0.5)); // 0 at the eave .. 3 at the ridge
      const fill = c.outer ? "smooth_sandstone" : "deepslate_tiles";
      if (isCorner(c.x, c.z) && pinnacles) { out.put(c.x, 20, c.z, "smooth_sandstone"); continue; }
      for (let y = 20; y < 20 + k; y++) out.put(c.x, y, c.z, fill);
      if (k === 3) { out.put(c.x, 23, c.z, fill); out.put(c.x, 24, c.z, ...slab("deepslate_tile")); }
      else out.put(c.x, 20 + k, c.z, ...stairs("deepslate_tile", OPPOSITE[tanFace(c.v)]));
    }
  }
  if (pinnacles) {
    for (const [x, z] of corners) {
      for (let y = 21; y <= 25; y++) out.put(x, y, z, "sandstone_wall");
      out.put(x, 26, z, "end_stone_brick_wall");
    }
  }
  return done(out);
}

/**
 * 12. The lean-to round the apse: every cell x >= C.x (and angle a0..a1) whose distance from C (cell centre) is in
 * [r0, r1] gets a roof cell whose height falls from yHigh at r0 to yLow at r1: a stair facing C (nearest of the 4
 * facings), `deepslate_tile_stairs` 70% / `polished_deepslate_stairs` 30% by hash, a full `deepslate_tiles` course under
 * it; the outermost ring (r > r1 - 1) a `smooth_sandstone_slab` gutter at yLow. `keep(x, y, z)` returning true (the
 * radial flyer zones) leaves a cell untouched. Footprint: that ring, y yLow-1..yHigh.
 */
export function leanToPolar(g, { r0, r1, yLow, yHigh, a0 = -90, a1 = 90, centre = C, keep = () => false, overwrite = false }) {
  const out = writer(g, overwrite);
  const [cx, cz] = centre;
  const put = (x, y, z, ...b) => { if (!keep(x, y, z)) out.put(x, y, z, ...b); };
  for (let x = cx; x <= cx + r1 + 1; x++)
    for (let z = Math.floor(cz - r1 - 1); z <= cz + r1 + 1; z++) {
      const r = Math.hypot(x - cx, z - cz), a = (Math.atan2(z - cz, x - cx) * 180) / Math.PI;
      if (r < r0 || r > r1 || a < a0 || a > a1) continue;
      const y = yLow + Math.round(((r1 - r) * (yHigh - yLow)) / Math.max(1e-9, r1 - r0));
      if (r > r1 - 1) { put(x, yLow, z, ...slab("smooth_sandstone")); continue; }
      put(x, y - 1, z, "deepslate_tiles");
      put(x, y, z, ...stairs(hash(x, y, z) < 0.7 ? "deepslate_tile" : "polished_deepslate", facingTo([cx - x, cz - z])));
    }
  return done(out);
}

/**
 * 16. A pierced parapet: `sandstone_wall` along `cells` ([x, z] at y, or [x, y, z]), every `posts`-th one (from the first)
 * an `end_stone_brick_wall` post; neighbours joined by low arms. Footprint: exactly those cells.
 */
export function balustrade(g, { cells, y, posts = 4, overwrite = false }) {
  const out = writer(g, overwrite);
  const placed = [];
  cells.forEach((c, i) => {
    const [x, cy, z] = c.length === 3 ? c : [c[0], y, c[1]];
    if (out.put(x, cy, z, i % posts === 0 ? "end_stone_brick_wall" : "sandstone_wall")) placed.push([x, cy, z]);
  });
  joinWalls(g, placed);
  return done(out);
}

// plan.md's south flyer profile: z -> coping top y.
const FLYER_S = [[64, 36], [63, 37], [62, 37], [61, 38], [60, 39], [59, 39], [58, 40], [57, 41], [56, 42], [55, 42], [54, 43], [53, 44], [52, 44], [51, 45]];

/**
 * 20. A nave/choir flying buttress at x p, one block thick. side "S": z 64 -> 51 (plan.md's profile); "N": z' = 76 - z.
 * Each column: the coping at the profile's y (`smooth_sandstone_stairs` bottom facing the clerestory where the next
 * column is 1 higher, else a bottom `smooth_sandstone_slab`), one `smooth_sandstone` body under it (two at both ends: z
 * 64, 63, 52, 51), then an upside-down `smooth_sandstone_stairs` soffit facing outward. Air below. Footprint: x p, those
 * z, y from 2-4 below each top up to it.
 */
export function flyer(g, { p, side = "S", profile = FLYER_S, overwrite = false }) {
  const out = writer(g, overwrite);
  const N = side === "N";
  const zz = (z) => (N ? 76 - z : z);
  const inward = N ? "south" : "north", outward = OPPOSITE[inward];
  const ends = new Set([profile[0][0], profile[1][0], profile.at(-2)[0], profile.at(-1)[0]]);
  profile.forEach(([z, top], i) => {
    const next = profile[i + 1]?.[1] ?? top;
    const z1 = zz(z);
    out.put(p, top, z1, ...(next > top ? stairs("smooth_sandstone", inward) : slab("smooth_sandstone")));
    const body = ends.has(z) ? 2 : 1;
    for (let k = 1; k <= body; k++) out.put(p, top - k, z1, "smooth_sandstone");
    out.put(p, top - body - 1, z1, ...stairs("smooth_sandstone", outward, "top"));
  });
  return done(out);
}

/**
 * 24. A rose window in a wall plane. center [x, y, z] (world); plane "x" = the disc lies in x = center[0] (west front),
 * "z" = in z = center[2] (transepts). d = distance from the centre cell: d <= 1 eye `yellow_stained_glass`; d <= r
 * field `blue_stained_glass`, ring r-1 < d <= r `red_stained_glass` (every 3rd `magenta_stained_glass`); 12 spokes (out from
 * the circle) and the circle d ~ 3 `end_stone_brick_wall` (r >= 3); outer ring r < d <= r+1 `chiseled_sandstone`; the square frame
 * (half side `frame`, default r+1; r 1 = the 3 x 3 gable rose) `cut_sandstone` on its border, `sandstone_wall` spandrels inside it. glass: false
 * leaves the disc (and its tracery) air: the shell's frame-only pass. Footprint: the square, one cell thick.
 */
export function roseWindow(g, { center, plane, r = 6, glass = true, frame = r <= 1 ? r : r + 1, overwrite = false }) {
  const out = writer(g, overwrite);
  const [ax, ay, az] = center;
  const at = (u, v) => (plane === "x" ? [ax, ay + v, az + u] : [ax + u, ay + v, az]);
  const walls = [];
  const put = (u, v, ...b) => { const [x, y, z] = at(u, v); if (out.put(x, y, z, ...b) && /_wall$/.test(b[0])) walls.push([x, y, z]); };
  const spoke = (u, v) => {
    for (let k = 0; k < 12; k++) {
      const [c, s] = [Math.cos(rad(30 * k)), Math.sin(rad(30 * k))];
      if (u * c + v * s > 1 && Math.abs(-u * s + v * c) < 0.5) return true;
    }
    return false;
  };
  let ringN = 0;
  for (let v = -frame; v <= frame; v++)
    for (let u = -frame; u <= frame; u++) {
      const d = Math.hypot(u, v);
      if (d <= r) {
        if (!glass) continue;
        if (d <= 1) put(u, v, "yellow_stained_glass");
        else if (r >= 3 && ((d > 3 && spoke(u, v)) || Math.abs(d - 3) < 0.5)) put(u, v, "end_stone_brick_wall");
        else if (d > r - 1) put(u, v, ringN++ % 3 === 2 ? "magenta_stained_glass" : "red_stained_glass");
        else put(u, v, "blue_stained_glass");
      } else if (d <= r + 1) put(u, v, "chiseled_sandstone");
      else if (Math.abs(u) === frame || Math.abs(v) === frame) put(u, v, "cut_sandstone");
      else put(u, v, "sandstone_wall");
    }
  joinWalls(g, walls);
  return done(out);
}

/**
 * 28. The Grand Gallery: an open colonnade in the plane x along z0..z1. `sandstone_wall` colonnettes every `step` z
 * (from z0) y0..y1; between them at y1 an upside-down `smooth_sandstone_stairs` head (back into the facade) for the
 * little arches; cornices `cut_sandstone_slab` bottom at y0-1 and top at y1+1 the whole run. face = the way it looks
 * out (west). Footprint: x, z0..z1, y0-1..y1+1.
 */
export function colonnade(g, { x = 2, z0 = 10, z1 = 66, y0 = 48, y1 = 56, step = 2, face = "west", overwrite = false }) {
  const out = writer(g, overwrite);
  const walls = [];
  for (let z = z0; z <= z1; z++) {
    out.put(x, y0 - 1, z, ...slab("cut_sandstone"));
    out.put(x, y1 + 1, z, ...slab("cut_sandstone", "top"));
    if ((z - z0) % step === 0) { for (let y = y0; y <= y1; y++) if (out.put(x, y, z, "sandstone_wall")) walls.push([x, y, z]); }
    else out.put(x, y1, z, ...stairs("smooth_sandstone", OPPOSITE[face], "top"));
  }
  joinWalls(g, walls);
  return done(out);
}

/**
 * 32. The spire tip at (x, z) (default (94, 38)): `polished_deepslate_wall` y0..y0+8 (125..133); at y0+6 (131) cross arms
 * `end_rod` at x-1 / x+1 (pointing along x) and z-1 / z+1 (along z); mast `end_rod` facing up y0+9..y0+11 (134..136);
 * the rooster `lightning_rod` facing up at y0+12 (137), nothing above. Footprint: x-1..x+1, z-1..z+1, y0..y0+12.
 */
export function spireTip(g, { x = 94, z = 38, y0 = 125, overwrite = false } = {}) {
  const out = writer(g, overwrite);
  for (let y = y0; y <= y0 + 8; y++) out.put(x, y, z, "polished_deepslate_wall", { up: "true", north: "none", south: "none", east: "none", west: "none" });
  out.put(x - 1, y0 + 6, z, "end_rod", { facing: "west" });
  out.put(x + 1, y0 + 6, z, "end_rod", { facing: "east" });
  out.put(x, y0 + 6, z - 1, "end_rod", { facing: "north" });
  out.put(x, y0 + 6, z + 1, "end_rod", { facing: "south" });
  for (let y = y0 + 9; y <= y0 + 11; y++) out.put(x, y, z, "end_rod", { facing: "up" });
  out.put(x, y0 + 12, z, "lightning_rod", { facing: "up", powered: "false" });
  return done(out);
}

/**
 * 36. A floodlight: `ochre_froglight` replacing the ground / paving block at (x, z), flush (its top face at the ground
 * level). y = that ground cell; without it, the topmost non-air cell of the column. Footprint: that one cell.
 */
export function floodlight(g, { x, z, y }) {
  const out = writer(g, true);
  if (y === undefined) {
    for (let k = g.size[1] - 1; k >= 0; k--) if (!g.isAir(x, k, z)) { y = k; break; }
    if (y === undefined) { out.refused.push([x, -1, z, "ochre_froglight"]); return done(out); }
  }
  out.put(x, y, z, "ochre_froglight", { axis: "y" });
  return done(out);
}
