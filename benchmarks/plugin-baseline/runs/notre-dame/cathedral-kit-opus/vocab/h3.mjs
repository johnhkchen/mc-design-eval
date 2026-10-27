// plan.md VOCABULARY helpers 3, 7, 11, 15, 19, 23, 27, 31, 35: lancet, polygonWall, leanTo, leadDeck, pinnacle,
// gargoyle, kingNiche, crocket, glowBehind. Every one takes the grid `g` first and its position (and face) in an
// options object; it writes only its own footprint and only into air unless { overwrite: true }. Each returns
// { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for a write onto a non-air cell, off the grid,
// or refused by a guard. Block ids are literals from plan.md's PALETTE.
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

// Unit vector along a wall whose outward face is `face`: +x for north/south walls, +z for east/west ones.
const alongOf = (face) => (face === "east" || face === "west" ? DIRS.south : DIRS.east);
const facingTo = ([dx, dz]) => (Math.abs(dx) >= Math.abs(dz) ? (dx >= 0 ? "east" : "west") : (dz >= 0 ? "south" : "north"));

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

/**
 * 3. Pointed lancet opening, left as AIR. (x, z) = the opening's first cell in the OUTER face plane (its lowest x on a
 * north/south wall, lowest z on an east/west one); the opening runs w cells along the wall from there, rows y0..y0+h-1
 * (head included). Jambs `cut_sandstone` both sides and a top `smooth_sandstone_slab` sill at y0-1, through the reveal
 * (d 0..depth-1) and the glass plane (d = depth, `depth` behind the outer face). Head: w >= 3 narrows the top two rows by
 * 1 each side under upside-down `smooth_sandstone_stairs`, their back against the jamb so the soffit slopes up to a point;
 * w = 2 one row; w = 1 one upside-down cap (back into the wall). Footprint: along -1..w, y y0-1..y0+h-1, d 0..depth.
 * With { overwrite: true } it cuts the opening through an existing wall (opening cells set to air). Returns `opening`:
 * the air cells per layer (the glass plane's are the glazier's cells).
 */
export function lancet(g, { x, z, y0, w, h, face, depth = 1, overwrite = false }) {
  if (w < 1 || h < 3) throw new Error(`lancet: needs w >= 1 and h >= 3 (got ${w} x ${h})`);
  const out = writer(g, overwrite);
  const into = DIRS[OPPOSITE[face]], along = alongOf(face);
  const at = (u, d) => [x + u * along[0] + d * into[0], z + u * along[2] + d * into[2]];
  const [toLow, toHigh] = [facingTo([-along[0], -along[2]]), facingTo([along[0], along[2]])];
  const top = y0 + h - 1;
  // head[y][u] = block for that cell, or undefined = the opening
  const head = new Map();
  const cell = (y, u, b) => { if (!head.has(y)) head.set(y, new Map()); head.get(y).set(u, b); };
  if (w === 1) cell(top, 0, stairs("smooth_sandstone", OPPOSITE[face], "top"));
  else if (w === 2) { cell(top, 0, stairs("smooth_sandstone", toLow, "top")); cell(top, 1, stairs("smooth_sandstone", toHigh, "top")); }
  else {
    cell(top - 1, 0, stairs("smooth_sandstone", toLow, "top")); cell(top - 1, w - 1, stairs("smooth_sandstone", toHigh, "top"));
    cell(top, 0, ["cut_sandstone", {}]); cell(top, w - 1, ["cut_sandstone", {}]);
    if (w > 3) { cell(top, 1, stairs("smooth_sandstone", toLow, "top")); cell(top, w - 2, stairs("smooth_sandstone", toHigh, "top")); }
  }
  const opening = [];
  for (let d = 0; d <= depth; d++) {
    for (let y = y0 - 1; y <= top; y++) {
      for (const u of [-1, w]) { const [cx, cz] = at(u, d); out.put(cx, y, cz, "cut_sandstone"); }
    }
    for (let u = 0; u < w; u++) {
      const [cx, cz] = at(u, d);
      if (d < depth || depth === 0) out.put(cx, y0 - 1, cz, ...slab("smooth_sandstone", "top"));
      else out.put(cx, y0 - 1, cz, "smooth_sandstone");
      for (let y = y0; y <= top; y++) {
        const b = head.get(y)?.get(u);
        if (b) out.put(cx, y, cz, ...b);
        else {
          opening.push([cx, y, cz, d]);
          if (overwrite && g.inBounds(cx, y, cz)) g.set(cx, y, cz, "air");
        }
      }
    }
  }
  return done(out, { opening });
}

/**
 * 7. Straight-segment wall along `verts` ([[x, z], ...], an open polyline such as the apse half-decagon): each segment
 * rasterised (Bresenham) and thickened `thick` cells inward, toward `centre` (default C = (152, 38)), y0..y1, in `block`.
 * `skip(x, y, z)` returning true leaves that cell air (the caller's openings: recess by exclusion).
 */
export function polygonWall(g, { verts, y0, y1, thick = 2, centre = [152, 38], block = "smooth_sandstone", skip = () => false, overwrite = false }) {
  const out = writer(g, overwrite);
  const cols = new Map();
  const add = (x, z) => cols.set(`${x},${z}`, [x, z]);
  for (let i = 0; i + 1 < verts.length; i++) {
    const [[ax, az], [bx, bz]] = [verts[i], verts[i + 1]];
    // Bresenham centre line
    let [x, z] = [ax, az];
    const [dx, dz] = [Math.abs(bx - ax), -Math.abs(bz - az)], [sx, sz] = [ax < bx ? 1 : -1, az < bz ? 1 : -1];
    for (let err = dx + dz; ; ) {
      add(x, z);
      if (x === bx && z === bz) break;
      const e2 = 2 * err;
      if (e2 >= dz) { err += dz; x += sx; }
      if (e2 <= dx) { err += dx; z += sz; }
    }
    // the inward band: cells whose centre projects onto the segment and lies 0..thick-1 inside it
    const len = Math.hypot(bx - ax, bz - az) || 1, [ux, uz] = [(bx - ax) / len, (bz - az) / len];
    let [nx, nz] = [-uz, ux];
    if ((centre[0] - ax) * nx + (centre[1] - az) * nz < 0) [nx, nz] = [-nx, -nz];
    for (let cx = Math.min(ax, bx) - thick; cx <= Math.max(ax, bx) + thick; cx++)
      for (let cz = Math.min(az, bz) - thick; cz <= Math.max(az, bz) + thick; cz++) {
        const t = (cx - ax) * ux + (cz - az) * uz, s = (cx - ax) * nx + (cz - az) * nz;
        if (t >= -0.5 && t <= len + 0.5 && s >= -0.5 && s < thick - 0.5) add(cx, cz);
      }
  }
  for (const [x, z] of cols.values()) for (let y = y0; y <= y1; y++) if (!skip(x, y, z)) out.put(x, y, z, block);
  return done(out);
}

/**
 * 11. Shed roof over x0..x1, rising 1 per row from zLow (eave, y yLow) toward zHigh (y capped at yHigh):
 * `deepslate_tile_stairs` 70% / `polished_deepslate_stairs` 30% (hash) facing up-slope, a `deepslate_tiles` course
 * under each stair course; the eave row is the gutter, `smooth_sandstone_slab`. `keep` = boxes [x0, y0, z0, x1, y1, z1]
 * left untouched (the flyer zones x p, y 33..46: the roof runs on under them).
 */
export function leanTo(g, { x0, x1, zLow, zHigh, yLow, yHigh, keep = [], overwrite = false }) {
  const out = writer(g, overwrite);
  const dz = zHigh >= zLow ? 1 : -1, up = dz > 0 ? "south" : "north";
  const kept = (x, y, z) => keep.some((b) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5]);
  const put = (x, y, z, ...b) => { if (!kept(x, y, z)) out.put(x, y, z, ...b); };
  for (let i = 0, z = zLow; i <= Math.abs(zHigh - zLow); i++, z += dz) {
    const y = Math.min(yLow + i, yHigh);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      if (i === 0) put(x, y, z, ...slab("smooth_sandstone"));
      else put(x, y, z, ...stairs(hash(x, y, z) < 0.7 ? "deepslate_tile" : "polished_deepslate", up));
      if (i > 0) put(x, y - 1, z, "deepslate_tiles");
    }
  }
  return done(out);
}

/** 15. Flat lead deck at y over box [x0, z0, x1, z1] (or a 6-number box, y ignored): `polished_deepslate`, a `deepslate_tiles` border course. */
export function leadDeck(g, box, y = 95, { overwrite = false } = {}) {
  const out = writer(g, overwrite);
  const [x0, z0, x1, z1] = box.length === 6 ? [box[0], box[2], box[3], box[5]] : box;
  const [xa, xb, za, zb] = [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)];
  for (let x = xa; x <= xb; x++)
    for (let z = za; z <= zb; z++) out.put(x, y, z, x === xa || x === xb || z === za || z === zb ? "deepslate_tiles" : "polished_deepslate");
  return done(out);
}

/**
 * 19. Pier pinnacle on the cells x..x+1, z..z+1 from y0 (size 2): `smooth_sandstone` shaft y0..y0+2, four
 * `smooth_sandstone_stairs` gablets (bottom, outer corners, backs toward the centre: a little pyramid) at y0+3,
 * `sandstone_wall` y0+4..y0+7 on (x, z), finial `end_stone_brick_wall` y0+8 (47 for y0 39).
 * size 1: one cell, `sandstone_wall` y0..y0+h-1 (h 5) and an `end_stone_brick_wall` tip on top.
 */
export function pinnacle(g, { x, z, y0 = 39, size = 2, h = 5, overwrite = false }) {
  const out = writer(g, overwrite);
  if (size === 1) {
    for (let y = y0; y < y0 + h; y++) out.put(x, y, z, "sandstone_wall");
    out.put(x, y0 + h, z, "end_stone_brick_wall");
    return done(out);
  }
  for (let y = y0; y <= y0 + 2; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) out.put(x + dx, y, z + dz, "smooth_sandstone");
  out.put(x, y0 + 3, z, ...stairs("smooth_sandstone", "south", "bottom", "outer_left"));
  out.put(x + 1, y0 + 3, z, ...stairs("smooth_sandstone", "south", "bottom", "outer_right"));
  out.put(x, y0 + 3, z + 1, ...stairs("smooth_sandstone", "north", "bottom", "outer_right"));
  out.put(x + 1, y0 + 3, z + 1, ...stairs("smooth_sandstone", "north", "bottom", "outer_left"));
  for (let y = y0 + 4; y <= y0 + 7; y++) out.put(x, y, z, "sandstone_wall");
  out.put(x, y0 + 8, z, "end_stone_brick_wall");
  return done(out);
}

/**
 * 23. Gargoyle out of the wall buttress cell (x, y, z) toward `face`: `chiseled_sandstone` 1 out, the snout
 * `sandstone_stairs` upside-down 2 out, its back toward the wall. The buttress cell itself is not written.
 */
export function gargoyle(g, { x, z, y = 47, face, overwrite = false }) {
  const out = writer(g, overwrite);
  const [dx, , dz] = DIRS[face];
  out.put(x + dx, y, z + dz, "chiseled_sandstone");
  out.put(x + 2 * dx, y, z + 2 * dz, ...stairs("sandstone", OPPOSITE[face], "top"));
  return done(out);
}

/**
 * 27. Gallery of Kings niche at z, front plane x (2), face west: the statue `chiseled_sandstone` y0..y0+2 and its head
 * `sandstone_wall` y0+3 one cell in (x 3: niche -1); the trefoil hood, upside-down `smooth_sandstone_stairs` facing
 * into the wall, at y0+4 in the front plane. The front cells beside the statue below the hood stay air.
 */
export function kingNiche(g, { z, y0 = 23, x = 2, face = "west", overwrite = false }) {
  const out = writer(g, overwrite);
  const [ix, , iz] = DIRS[OPPOSITE[face]];
  for (let y = y0; y <= y0 + 2; y++) out.put(x + ix, y, z + iz, "chiseled_sandstone");
  out.put(x + ix, y0 + 3, z + iz, "sandstone_wall");
  out.put(x, y0 + 4, z, ...stairs("smooth_sandstone", OPPOSITE[face], "top"));
  return done(out);
}

/**
 * 31. Crockets on the 8 arrises of an octagon w wide about (cx, cz) at course y (corners cut `cut`, as octagonRing):
 * one `deepslate_tile_stairs` (bottom) 1 out from each vertex cell along its nearest axis, back toward the spire.
 */
export function crocket(g, { cx, cz, y, w, cut = Math.max(1, Math.floor(w / 4)), overwrite = false }) {
  const out = writer(g, overwrite);
  const lo = -Math.floor((w - 1) / 2), hi = lo + w - 1;
  const spots = new Map();
  for (const t of [lo + cut, hi - cut]) {
    spots.set(`e${t}`, [cx + hi + 1, cz + t, "west"]);
    spots.set(`w${t}`, [cx + lo - 1, cz + t, "east"]);
    spots.set(`s${t}`, [cx + t, cz + hi + 1, "north"]);
    spots.set(`n${t}`, [cx + t, cz + lo - 1, "south"]);
  }
  for (const [x, z, facing] of spots.values()) out.put(x, y, z, ...stairs("deepslate_tile", facing));
  return done(out);
}

/**
 * 35. Glow behind one window: `cells` = its glass-plane cells ([[x, y, z], ...] or a box [x0, y0, z0, x1, y1, z1]),
 * `inward` = the face pointing into the building. One `shroomlight` d cells in from the glass per 2 cells of window
 * width, at mid-height; where the cell under it is air a `smooth_sandstone` bracket goes under it (bracket: false skips).
 */
export function glowBehind(g, { cells, inward, d = 2, bracket = true, overwrite = false }) {
  const out = writer(g, overwrite);
  const list = typeof cells[0] === "number" ? boxCells(cells) : cells;
  const [ix, , iz] = DIRS[inward], along = alongOf(inward);
  const u = ([x, , z]) => x * along[0] + z * along[2];
  const us = [...new Set(list.map(u))].sort((a, b) => a - b);
  const ys = list.map((c) => c[1]), yMid = Math.floor((Math.min(...ys) + Math.max(...ys)) / 2);
  const n = Math.max(1, Math.floor(us.length / 2));
  for (let k = 0; k < n; k++) {
    const uk = us[Math.floor(((k + 0.5) * us.length) / n)];
    const [x, , z] = list.find((c) => u(c) === uk);
    const [lx, lz] = [x + d * ix, z + d * iz];
    if (out.put(lx, yMid, lz, "shroomlight") && bracket && g.inBounds(lx, yMid - 1, lz) && g.isAir(lx, yMid - 1, lz))
      out.put(lx, yMid - 1, lz, "smooth_sandstone");
  }
  return done(out);
}

function boxCells([x0, y0, z0, x1, y1, z1]) {
  const c = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) c.push([x, y, z]);
  return c;
}
