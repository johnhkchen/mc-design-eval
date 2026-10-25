// Vocabulary helpers from plan.md VOCABULARY (first batch): footing, lancet, parapet, crocket, flyer, dormer,
// machicolation, chapel_cap. Built on the build library (tools/src/build.mjs).
// Each takes the grid first, then its position (and facing) as arguments, and returns { box, placed, refused }.
// Writes stay inside the helper's own footprint (`box`, inclusive corners) and only go into air, unless opts.overwrite
// is set; anything refused is listed in `refused` (never thrown, except for arguments that cannot be built). Nothing is
// written below the footprint: ground, sand and floor under a helper belong to an earlier part.
// Facing follows the toolkit: a stair's facing is the side of its full-height back (B.stairs).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FACES = ["north", "south", "east", "west"];
const WALL = { up: "true", north: "none", east: "none", south: "none", west: "none" };

const checkFace = (face) => {
  if (!FACES.includes(face)) throw new Error(`face must be one of ${FACES.join(", ")}, got ${face}`);
};
// Pane joined to the wall on both sides of its plane: a wall running along x (face north/south) joins east and west.
const glazing = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

/** Paint through `put`, which writes only inside `box`, only into air (unless overwrite), and counts refusals. */
function paint(g, box, { overwrite = false } = {}, fn) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const refused = [];
  let placed = 0;
  const put = (x, y, z, block, state) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (!inside || !g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) {
      refused.push([x, y, z]);
      return;
    }
    g.set(x, y, z, block, state);
    placed++;
  };
  fn(put);
  return { box, placed, refused };
}

/** footing(x,z,y): a granite footing column under the wall base at y (that base cell is not written). It fills air
 *  down from the base to the first solid cell (the rock); the bottom course, by the rock, is mossy. */
export function footing(g, x, z, y, opts = {}) {
  let bottom = y;
  while (bottom > 0 && g.isAir(x, bottom - 1, z)) bottom--;
  return paint(g, [x, bottom, z, x, y - 1, z], opts, (put) => {
    for (let cy = bottom; cy < y; cy++) put(x, cy, z, cy === bottom ? "mossy_cobblestone" : "cobblestone");
  });
}

/** lancet(x,y,z,face,h): a 1 x h glazed opening in a wall whose outer face is `face`, bottom cell (x,y,z), h >= 3.
 *  The top two cells are the pointed head: two upside-down stone_brick stairs, the lower facing out and the upper
 *  facing in, so their slopes meet in a point. The cells below are gray glass pane, joined to the wall. */
export function lancet(g, x, y, z, face, h, opts = {}) {
  checkFace(face);
  if (!Number.isInteger(h) || h < 3) throw new Error(`lancet: h must be an integer of at least 3, got ${h}`);
  return paint(g, [x, y, z, x, y + h - 1, z], opts, (put) => {
    for (let cy = y; cy < y + h - 2; cy++) put(x, cy, z, "gray_stained_glass_pane", glazing(face));
    put(x, y + h - 2, z, ...B.stairs("stone_brick", face, "top"));
    put(x, y + h - 1, z, ...B.stairs("stone_brick", OPPOSITE[face], "top"));
  });
}

/** parapet(from, to): a stone_brick_wall line at the height of from = [x, y, z], running straight to to = [x, y, z]
 *  (the two ends share one x or z). Crenellated: a merlon on every other cell, the gaps stay air. crenels: false makes
 *  a solid balustrade. Each wall's connections are written only toward its neighbouring merlons or wall cells. */
export function parapet(g, from, to, { crenels = true, overwrite = false } = {}) {
  const [x0, y, z0] = from, [x1, , z1] = to;
  if (x0 !== x1 && z0 !== z1) throw new Error(`parapet: from ${from} to ${to} is not a straight line`);
  const lo = [Math.min(x0, x1), Math.min(z0, z1)], hi = [Math.max(x0, x1), Math.max(z0, z1)];
  const alongX = lo[0] !== hi[0] || lo[1] === hi[1];
  const n = alongX ? hi[0] - lo[0] : hi[1] - lo[1];
  const cell = (i) => (alongX ? [lo[0] + i, lo[1]] : [lo[0], lo[1] + i]);
  const [back, fwd] = alongX ? ["west", "east"] : ["north", "south"];
  const merlon = (i) => i >= 0 && i <= n && (!crenels || i % 2 === 0);
  return paint(g, [lo[0], y, lo[1], hi[0], y, hi[1]], { overwrite }, (put) => {
    for (let i = 0; i <= n; i++) {
      if (!merlon(i)) continue;
      const st = { ...WALL, [back]: merlon(i - 1) ? "low" : "none", [fwd]: merlon(i + 1) ? "low" : "none" };
      const [x, z] = cell(i);
      put(x, y, z, "stone_brick_wall", st);
    }
  });
}

/** crocket(x,y,z,face): one deepslate_tile stair on an edge, facing out along `face`. */
export function crocket(g, x, y, z, face, opts = {}) {
  checkFace(face);
  return paint(g, [x, y, z, x, y, z], opts, (put) => put(x, y, z, ...B.stairs("deepslate_tile", face, "bottom")));
}

/** flyer(x,y,z,side,run): one flying-buttress arc of upside-down stone_brick stairs, one column wide at x. It springs
 *  from the culee's inner face at z, at height y, and rises 3 to the pier at y+3 after `run` cells (run >= 2). side is
 *  the side the culee is on: "north" runs the arc toward +z, "south" toward -z. Each stair faces back to the culee. */
export function flyer(g, x, y, z, side, run = 6, opts = {}) {
  if (side !== "north" && side !== "south") throw new Error(`flyer: side must be north or south, got ${side}`);
  if (!Number.isInteger(run) || run < 2) throw new Error(`flyer: run must be an integer of at least 2, got ${run}`);
  const step = side === "north" ? 1 : -1;
  const cells = [];
  for (let i = 1; i <= run; i++) cells.push([z + step * i, y + Math.round((3 * (i - 1)) / (run - 1))]);
  const zs = cells.map(([cz]) => cz);
  return paint(g, [x, y, Math.min(...zs), x, y + 3, Math.max(...zs)], opts, (put) => {
    for (const [cz, cy] of cells) put(x, cy, cz, ...B.stairs("stone_brick", side, "top"));
  });
}

/** dormer(x,y,z,face,depth): a small gabled dormer in a roof slope, its front on the plane of z looking out of `face`,
 *  centred on x (or on z for an east or west face). A 1-wide glazed window in the front (y, y+1), stone_brick cheeks
 *  and back, a stone gablet of upside-down stone_brick stairs over the front at y+2, and a flat deepslate_tile_slab cap
 *  at y+3. The footprint is 3 wide, 4 high and `depth` deep back from the front (default 2). */
export function dormer(g, x, y, z, face, depth = 2, opts = {}) {
  checkFace(face);
  if (!Number.isInteger(depth) || depth < 1) throw new Error(`dormer: depth must be an integer of at least 1, got ${depth}`);
  const [bx, , bz] = DIRS[OPPOSITE[face]];
  const across = face === "north" || face === "south" ? [1, 0] : [0, 1];
  // the cell at lateral offset l (-1..1) and depth k (0 = the front)
  const at = (l, k) => [x + across[0] * l + bx * k, z + across[1] * l + bz * k];
  const corners = [at(-1, 0), at(1, 0), at(-1, depth - 1), at(1, depth - 1)];
  const xs = corners.map(([cx]) => cx), zs = corners.map(([, cz]) => cz);
  return paint(g, [Math.min(...xs), y, Math.min(...zs), Math.max(...xs), y + 3, Math.max(...zs)], opts, (put) => {
    for (let k = 0; k < depth; k++) for (let l = -1; l <= 1; l++) {
      const [cx, cz] = at(l, k);
      if (k === 0 && l === 0) {
        put(cx, y, cz, "gray_stained_glass_pane", glazing(face));
        put(cx, y + 1, cz, "gray_stained_glass_pane", glazing(face));
      } else {
        put(cx, y, cz, "stone_bricks");
        put(cx, y + 1, cz, "stone_bricks");
      }
      if (k === 0) put(cx, y + 2, cz, ...B.stairs("stone_brick", face, "top"));
      else put(cx, y + 2, cz, "stone_bricks");
      put(cx, y + 3, cz, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
    }
  });
}

/** machicolation(x,y,z,face,len): a run of `len` corbels (upside-down stone_brick stairs, proud 1 of the wall) in the
 *  air just outside a wall whose outer face is `face`. (x,y,z) is the first corbel's cell, outside the wall; the run
 *  goes along the wall. Each corbel's back is to the wall (facing into it). */
export function machicolation(g, x, y, z, face, len, opts = {}) {
  checkFace(face);
  if (!Number.isInteger(len) || len < 1) throw new Error(`machicolation: len must be an integer of at least 1, got ${len}`);
  const [dx, dz] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  return paint(g, [x, y, z, x + dx * (len - 1), y, z + dz * (len - 1)], opts, (put) => {
    for (let i = 0; i < len; i++) put(x + dx * i, y, z + dz * i, ...B.stairs("stone_brick", OPPOSITE[face], "top"));
  });
}

/** chapel_cap(cx,y,cz,r,height): a stepped pyramid cap over a square chapel whose walls stand on the ring at distance
 *  r from the centre (cx,cz), starting at y. Course k (at y+k) is the deepslate_tile stair ring at distance r-k, each
 *  stair facing in toward the centre so the cap rises to a point; the solid tiles inside each ring hold it up. Once the
 *  ring is used up (distance 0) the centre cell continues as a solid finial column to `height` (default r). */
export function chapel_cap(g, cx, y, cz, r, height = r, opts = {}) {
  if (!Number.isInteger(r) || r < 1) throw new Error(`chapel_cap: r must be an integer of at least 1, got ${r}`);
  if (!Number.isInteger(height) || height < 1) throw new Error(`chapel_cap: height must be an integer of at least 1, got ${height}`);
  return paint(g, [cx - r, y, cz - r, cx + r, y + height - 1, cz + r], opts, (put) => {
    for (let k = 0; k < height; k++) {
      const d = r - k;
      if (d < 1) {
        put(cx, y + k, cz, "deepslate_tiles");
        continue;
      }
      for (let dx = -d; dx <= d; dx++) for (let dz = -d; dz <= d; dz++) {
        const ring = Math.max(Math.abs(dx), Math.abs(dz));
        if (ring < d) put(cx + dx, y + k, cz + dz, "deepslate_tiles");
        else if (ring === d) {
          const facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : dz > 0 ? "north" : "south";
          put(cx + dx, y + k, cz + dz, ...B.stairs("deepslate_tile", facing, "bottom"));
        }
      }
    }
  });
}
