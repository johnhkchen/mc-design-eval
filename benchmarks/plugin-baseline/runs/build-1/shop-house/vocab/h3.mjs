// SPDX-License-Identifier: AGPL-3.0-or-later
// Vocabulary, batch 3: cornice, awning, sashWindow, setDisplay, hearth, hangLantern, fenceRun, fruitTree, bench.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint. Writes go
// into air only unless the call passes { over: true }. Every call returns { placed, skipped }: placed is the cells it
// wrote, skipped is what it refused and why. Nothing here imports vocab.mjs or the other vocab/ files.
import { readFileSync, writeFileSync } from "node:fs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

const result = () => ({ placed: [], skipped: [] });

/** Write one block at [x, y, z] if the cell is air (or opts.over). Records the outcome in res. */
function put(g, res, [x, y, z], [block, state, nbt], { over = false } = {}) {
  if (!g.inBounds(x, y, z)) {
    res.skipped.push({ at: [x, y, z], block, reason: "outside the grid" });
    return false;
  }
  const cur = g.blockAt(x, y, z);
  if (!over && !AIR.has(cur)) {
    res.skipped.push({ at: [x, y, z], block, reason: `${cur} already there` });
    return false;
  }
  g.set(x, y, z, block, state, nbt);
  res.placed.push([x, y, z]);
  return true;
}

/**
 * Cornice: upside-down smooth_quartz_stairs along x0..x1 at (z, y). `into` is the way the stairs' back faces (into the
 * wall; south for the street front). Plan: x 4..19 at z 4, y 13.
 */
export function cornice(g, x0, x1, z, y, into = "south", opts = {}) {
  const res = result();
  if (!DIRS[into]) throw new Error(`cornice: into must be a compass direction, got ${into}`);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, res, [x, y, z], B.stairs("smooth_quartz", into, "top"), opts);
  return res;
}

/**
 * Striped awning along x0..x1 at (z, y), on the street front: wool alternates colA / colB by column (colour names
 * such as "red" become "red_wool"), with an open dark_oak_trapdoor valance one cell out, at z - 1, same height.
 * Plan: x 10..18, z 4, y 9, colours red / white.
 */
export function awning(g, x0, x1, z, y, colA, colB, opts = {}) {
  const res = result();
  const wool = (c) => (c.endsWith("_wool") ? c : `${c}_wool`);
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  for (let x = lo; x <= hi; x++) {
    const colour = (x - lo) % 2 === 0 ? colA : colB;
    put(g, res, [x, y, z], [wool(colour)], opts);
    put(g, res, [x, y, z - 1], B.trapdoor("dark_oak", "north", "top", true), opts);
  }
  return res;
}

/**
 * Sash window in an outer wall, looking out to `face` (north = the street). The opening's first cell is (x, z) on the
 * outer plane, seen from outside: z is the outer plane for a north or south face, x for an east or west face; the run
 * goes along x (north/south faces) or z (east/west faces). Glass sits one cell in from the outer plane, joined to its
 * neighbours. Lintel: smooth_quartz on the outer plane, one wider each side, above. Sill: smooth_quartz_slab top,
 * one cell out, below (opts.sill: false to leave it out). The shell leaves the opening itself as air; the lintel
 * needs the wall cells it sits in, so pass { over: true } once the wall stands. Plan: front windows at z 5, w 2, h 3.
 */
export function sashWindow(g, face, x, y, z, w, h, opts = {}) {
  const res = result();
  if (!DIRS[face]) throw new Error(`sashWindow: face must be a compass direction, got ${face}`);
  const along = face === "north" || face === "south";
  const inward = DIRS[OPPOSITE[face]];
  // depth 0 = outer plane, 1 = glass plane (one in), -1 = one out (the sill); i = offset along the run; j = height
  const cell = (i, j, depth) => (along ? [x + i, y + j, z + depth * inward[2]] : [x + depth * inward[0], y + j, z + i]);
  const along2 = along ? ["east", "west"] : ["south", "north"];

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      const [px, py, pz] = cell(i, j, 1);
      const state = { north: "false", east: "false", south: "false", west: "false" };
      const sides = { [along2[0]]: cell(i + 1, j, 1), [along2[1]]: cell(i - 1, j, 1) };
      for (const [dir, [nx, ny, nz]] of Object.entries(sides)) {
        const inWindow = dir === along2[0] ? i + 1 < w : i - 1 >= 0;
        state[dir] = inWindow || !AIR.has(g.blockAt(nx, ny, nz)) ? "true" : "false";
      }
      put(g, res, [px, py, pz], ["glass_pane", state], opts);
    }
  }
  for (let i = -1; i <= w; i++) put(g, res, cell(i, h, 0), ["smooth_quartz"], opts);
  if (opts.sill !== false) {
    for (let i = 0; i < w; i++) put(g, res, cell(i, -1, -1), B.slab("smooth_quartz", "top"), opts);
  }
  return res;
}

/**
 * sockets.json "display" for one socket: the inert blocks the shop shows, as an array or a "a,b,c" string. Rewrites the
 * file in place (1-space indent, as sockets.mjs writes it) and touches no other key. The socket must exist.
 * Returns the stored display string.
 */
export function setDisplay(socket, blocks, file = "sockets.json") {
  const layout = JSON.parse(readFileSync(file, "utf8"));
  if (!layout.sockets?.some((s) => s.id === socket)) throw new Error(`setDisplay: no socket ${socket} in ${file}`);
  const list = Array.isArray(blocks) ? blocks : String(blocks).split(",");
  layout.display = { ...(layout.display ?? {}), [socket]: list.join(",") };
  writeFileSync(file, JSON.stringify(layout, null, 1));
  return layout.display[socket];
}

/**
 * First-floor hearth on a wall. Firebox: two cells wide, two high, one deep, in the room's edge column. (x, z) is the
 * first column (lower x, or lower z for a north/south-running wall); facing is the way the fire opens into the room
 * (west for the east wall). Stone floor at row y, a lit campfire on it at row y+1, a stone hob beside the fire, and an
 * upside-down brick_stairs lintel at y+2 whose back is on the wall. The flue belongs to the chimney part. The two cells
 * in front of the firebox (rows y and y+1) are the lane and are never written. opts.room = [x0, y0, z0, x1, y1, z1]:
 * when given, the firebox and lane must sit inside it and the lane must be clear, or nothing is written.
 * Plan: x 18, z 13..14, y 14 (living room).
 */
export function hearth(g, x, y, z, facing, opts = {}) {
  const res = result();
  if (!DIRS[facing]) throw new Error(`hearth: facing must be a compass direction, got ${facing}`);
  const side = facing === "east" || facing === "west" ? [0, 0, 1] : [1, 0, 0];
  const cols = [[x, z], [x + side[0], z + side[2]]];
  const front = DIRS[facing];
  const back = DIRS[OPPOSITE[facing]];
  const inRoom = (c) => {
    const [x0, y0, z0, x1, y1, z1] = opts.room;
    return c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1 && c[2] >= z0 && c[2] <= z1;
  };

  if (opts.room) {
    const body = cols.flatMap(([cx, cz]) => [0, 1, 2].map((dy) => [cx, y + dy, cz]));
    const lane = cols.flatMap(([cx, cz]) => [0, 1].map((dy) => [cx + front[0], y + dy, cz + front[2]]));
    if (!body.every(inRoom) || !lane.every(inRoom)) {
      res.skipped.push({ at: [x, y, z], block: "hearth", reason: "firebox or lane outside the room" });
      return res;
    }
    const blocked = lane.find((c) => !AIR.has(g.blockAt(...c)));
    if (blocked) {
      res.skipped.push({ at: blocked, block: "hearth", reason: "lane not clear" });
      return res;
    }
  }

  const [[x0, z0], [x1, z1]] = cols;
  for (const [cx, cz] of cols) put(g, res, [cx, y, cz], ["stone_bricks"], opts);
  put(g, res, [x0, y + 1, z0], ["campfire", { lit: "true", facing }], opts);
  put(g, res, [x1, y + 1, z1], ["stone_bricks"], opts);
  for (const [cx, cz] of cols) put(g, res, [cx, y + 2, cz], B.stairs("brick", back, "top"), opts);
  return res;
}

/**
 * Hanging lantern at (x, y, z), hung from the block above it (a floor, or an iron_chain): refused, with a reason, when
 * nothing is above. Plan: aisle lanterns at y 12 under the y 13 floor.
 */
export function hangLantern(g, x, y, z, opts = {}) {
  const res = result();
  if (AIR.has(g.blockAt(x, y + 1, z))) {
    res.skipped.push({ at: [x, y, z], block: "lantern", reason: "nothing above to hang from" });
    return res;
  }
  put(g, res, [x, y, z], B.lantern(true), opts);
  return res;
}

/**
 * Fence along a polyline of [x, z] points at height y. Segments must be axis-aligned. Each post's arms join its
 * neighbours in the run and any solid block beside it at y, so the fence reads as one line. opts.material: spruce by
 * default ("oak" gives oak_fence). Plan: garden fence at y 6.
 */
export function fenceRun(g, pts, y, opts = {}) {
  const res = result();
  const material = opts.material ?? "spruce";
  const cells = new Map();
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
    if (ax !== bx && az !== bz) throw new Error(`fenceRun: segment ${k} is not axis-aligned`);
    const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
    const sx = Math.sign(bx - ax), sz = Math.sign(bz - az);
    for (let s = 0; s <= n; s++) cells.set(`${ax + sx * s},${az + sz * s}`, [ax + sx * s, az + sz * s]);
  }
  for (const [x, z] of cells.values()) {
    const arms = {};
    for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
      const nx = x + dx, nz = z + dz;
      arms[dir] = cells.has(`${nx},${nz}`) || !AIR.has(g.blockAt(nx, y, nz)) ? "true" : "false";
    }
    put(g, res, [x, y, z], [`${material}_fence`, arms], opts);
  }
  return res;
}

/**
 * Fruit tree: an oak_log trunk at (x, y..y+4, z) and a 5 x 5 x 5 crown of persistent oak_leaves over x±2, z±2,
 * y+3..y+7. The crown is air-only, so it never overwrites the trunk. Plan: x 23, z 35, y 6.
 */
export function fruitTree(g, x, z, y = 6, opts = {}) {
  const res = result();
  for (let k = 0; k <= 4; k++) put(g, res, [x, y + k, z], B.log("oak", "y"), opts);
  const leaves = ["oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" }];
  for (let dx = -2; dx <= 2; dx++)
    for (let dy = 3; dy <= 7; dy++)
      for (let dz = -2; dz <= 2; dz++) put(g, res, [x + dx, y + dy, z + dz], leaves);
  return res;
}

/** Garden bench: one spruce stair at (x, y, z) with its facing as given (plan: 12, 6, 25, facing east). */
export function bench(g, x, y, z, facing = "east", opts = {}) {
  const res = result();
  put(g, res, [x, y, z], B.stairs("spruce", facing, "bottom"), opts);
  return res;
}
