// h3 vocabulary: litWindow, towerFace, penthouse, crownBand, column, doubleDoor, emblemDisc, tree, litEntry.
// Conventions (every helper):
//   - boxes are inclusive [x0, y0, z0, x1, y1, z1]; `dir` is the outward direction of the wall (north|south|east|west).
//   - each helper takes its own position and writes only inside its footprint, and only into air. The one exception is
//     a surface it dresses: pass { over: true } to let it swap that named surface block (smooth_sandstone, smooth_quartz)
//     and nothing else. A cell that is solid and not named is left alone.
//   - every helper returns the number of blocks it placed.
// Penthouse roof: smooth_stone_slab (the roof-deck material; vanilla has no concrete slabs).
import { B, DIRS, OPPOSITE, face as faceOps } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const id = (name) => (name.includes(":") ? name : `minecraft:${name}`);
const norm = ([x0, y0, z0, x1, y1, z1]) => [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)];
const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

/** One write, refused unless the cell is in the footprint and is air (or holds one of the `over` blocks). spec: name or [block, state]. */
function put(g, box, [x, y, z], spec, { over = [] } = {}) {
  if (!inside(box, x, y, z)) return 0;
  if (!g.isAir(x, y, z) && !over.map(id).includes(g.blockAt(x, y, z))) return 0;
  const [block, state, nbt] = typeof spec === "string" ? [spec] : spec;
  g.set(x, y, z, block, state, nbt);
  return 1;
}

/** Swap one backing cell (black_concrete) for a light. Writes that one cell and only while it still holds the backing. */
export function litWindow(g, [x, y, z], kind) {
  if (kind !== "shroomlight" && kind !== "sea_lantern") throw new Error(`litWindow: kind must be shroomlight or sea_lantern, not ${kind}`);
  if (g.blockAt(x, y, z) !== "minecraft:black_concrete") return 0;
  g.set(x, y, z, kind);
  return 1;
}

/**
 * Dress one face of a tower box. Depth 0 is the face plane, depth 1 and 2 the cells behind it. The face is blank
 * smooth_sandstone, with cut_sandstone joint courses at y 7, 12, ... (the joints swap smooth_sandstone with over).
 * Two slot columns per storey at 1/3 and 2/3 of the width: opening at depth 0 (left air), glass at depth 1 with
 * black_concrete backing at depth 2; one slot in four is sea_lantern at depth 1 instead.
 */
export function towerFace(g, dir, box, { over = false } = {}) {
  const b = norm(box);
  const [x0, y0, z0, x1, y1, z1] = b;
  const [u0, u1] = dir === "west" || dir === "east" ? [z0, z1] : [x0, x1];
  const cols = [u0 + Math.round((u1 - u0) / 3), u0 + Math.round((2 * (u1 - u0)) / 3)];
  const floors = [];
  for (let f = 7; f + 3 <= y1; f += 5) if (f >= y0) floors.push(f);
  const at = (depth, u, y) => {
    if (dir === "west") return [x0 + depth, y, u];
    if (dir === "east") return [x1 - depth, y, u];
    if (dir === "north") return [u, y, z0 + depth];
    return [u, y, z1 - depth];
  };
  const isSlot = (u, y) => cols.includes(u) && floors.some((f) => y === f + 2 || y === f + 3);
  const swap = over ? ["smooth_sandstone"] : [];
  let placed = 0;

  let n = 0;
  for (const f of floors) for (const u of cols) {
    const lit = n++ % 4 === 0;
    for (const y of [f + 2, f + 3]) {
      if (lit) placed += put(g, b, at(1, u, y), "sea_lantern");
      else {
        placed += put(g, b, at(1, u, y), "gray_stained_glass");
        placed += put(g, b, at(2, u, y), "black_concrete");
      }
    }
  }
  for (let u = u0; u <= u1; u++) for (let y = y0; y <= y1; y++) {
    if (isSlot(u, y)) continue;                      // the opening stays air
    if (y >= 7 && y % 5 === 2) placed += put(g, b, at(0, u, y), "cut_sandstone", { over: swap });
    else placed += put(g, b, at(0, u, y), "smooth_sandstone");
  }
  return placed;
}

/** Hand-built penthouse box: light_gray_concrete walls, iron_bars louvres (default the two rows 3 and 4 up), slab roof on the top row. */
export function penthouse(g, box, { louvres = null } = {}) {
  const b = norm(box);
  const [x0, y0, z0, x1, y1, z1] = b;
  const rows = louvres ?? [y0 + 3, y0 + 4];
  const ring = (x, y, z) => inside(b, x, y, z) && (x === x0 || x === x1 || z === z0 || z === z1);
  let placed = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!ring(x, y, z)) continue;
    if (!rows.includes(y)) { placed += put(g, b, [x, y, z], "light_gray_concrete"); continue; }
    // louvres connect to the neighbouring ring cells, as placed bars do
    const state = { north: ring(x, y, z - 1), south: ring(x, y, z + 1), west: ring(x - 1, y, z), east: ring(x + 1, y, z), waterlogged: "false" };
    placed += put(g, b, [x, y, z], ["iron_bars", state]);
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) placed += put(g, b, [x, y1, z], B.slab("smooth_stone", "bottom"));
  return placed;
}

/**
 * Crown light courses on the perimeter of a box: ochre_froglight on the bottom course (the light slot under the coping,
 * off with slot: false) and pearlescent_froglight on the top course (the cool band). Pass the crown walls' box.
 */
export function crownBand(g, box, { over = false, slot = true } = {}) {
  const b = norm(box);
  const [x0, y0, z0, x1, y1, z1] = b;
  const swap = over ? ["smooth_quartz"] : [];
  const courses = [[y1, "pearlescent_froglight"], ...(slot ? [[y0, "ochre_froglight"]] : [])];
  let placed = 0;
  for (const [y, block] of courses) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) placed += put(g, b, [x, y, z], block, { over: swap });
  }
  return placed;
}

/** A 2x2 quartz_pillar column with its low-x, low-z corner at (x, z), from y0 to y1 (portico columns: y 2..12). */
export function column(g, x, z, { y0 = 2, y1 = 12 } = {}) {
  const b = [x, y0, z, x + 1, y1, z + 1];
  let placed = 0;
  for (let y = y0; y <= y1; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    placed += put(g, b, [x + dx, y, z + dz], B.pillar("quartz_pillar", "y"));
  }
  return placed;
}

/**
 * A double iron door in a wall, two 1x2 leaves side by side. pos is the left leaf's lower cell; `facing` is the way you
 * walk in (the leaves' hinges are on their outer edges). Writes all four halves or none (both halves of both leaves).
 */
export function doubleDoor(g, [x, y, z], facing) {
  const [rx, , rz] = DIRS[faceOps.cw(facing)];
  const leaves = [[x, z, "left"], [x + rx, z + rz, "right"]];
  const cells = leaves.flatMap(([lx, lz, hinge]) => [[lx, y, lz, "lower", hinge], [lx, y + 1, lz, "upper", hinge]]);
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[2]);
  const b = [Math.min(...xs), y, Math.min(...zs), Math.max(...xs), y + 1, Math.max(...zs)];
  if (!cells.every(([cx, cy, cz]) => g.isAir(cx, cy, cz))) return 0;
  for (const [cx, cy, cz, half, hinge] of cells) g.set(cx, cy, cz, ...B.door("iron", facing, half, hinge));
  return cells.length;
}

/**
 * A round emblem disc of radius r (default 4, 9 cells across) on the plane through center, one proud of the wall.
 * `dir` is the outward direction of the wall. Blue ring at the edge, yellow core at the centre, smooth_quartz between,
 * and a shroomlight set in the wall directly behind the centre.
 */
export function emblemDisc(g, [cx, cy, cz], dir, { r = 4 } = {}) {
  const [bx, , bz] = DIRS[OPPOSITE[dir]];          // from the disc, into the wall
  const along = dir === "west" || dir === "east";
  const cell = (da, db) => (along ? [cx, cy + db, cz + da] : [cx + da, cy + db, cz]);
  const cells = [];
  for (let da = -r; da <= r; da++) for (let db = -r; db <= r; db++) {
    const d2 = da * da + db * db;
    if (d2 > r * r) continue;
    const block = d2 <= 2 ? "yellow_concrete" : d2 > (r - 1) * (r - 1) ? "blue_concrete" : "smooth_quartz";
    cells.push([...cell(da, db), block]);
  }
  const back = [cx + bx, cy, cz + bz];
  const pts = [...cells.map((c) => c.slice(0, 3)), back];
  const b = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.min(...pts.map((p) => p[2])),
    Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[2]))];
  let placed = 0;
  for (const [x, y, z, block] of cells) placed += put(g, b, [x, y, z], block);
  placed += put(g, b, back, "shroomlight");
  return placed;
}

/**
 * A tree on the ground: a straight trunk above groundY (the grass cell it stands on; nothing is written at or below it),
 * then an irregular crown of persistent leaves four cells tall. wood: oak | jungle.
 */
export function tree(g, x, groundY, z, { h = 5, wood = "oak" } = {}) {
  const top = groundY + h;
  const b = [x - 2, groundY + 1, z - 2, x + 2, top + 1, z + 2];
  const log = B.log(wood, "y");
  const leaves = [`${wood}_leaves`, { persistent: "true" }];
  let placed = 0;
  for (let y = groundY + 1; y <= top; y++) placed += put(g, b, [x, y, z], log);
  for (let dy = -2; dy <= 1; dy++) {
    const reach = dy <= -1 ? 2 : 1;
    for (let dx = -reach; dx <= reach; dx++) for (let dz = -reach; dz <= reach; dz++) {
      const corner = Math.abs(dx) === reach && Math.abs(dz) === reach;
      // the lowest and cap courses lose their corners; the others drop some corners at random-looking spots
      if (corner && (dy === -2 || dy === 1 || ((x + dx) * 7 + (z + dz) * 3 + top + dy) % 3 === 0)) continue;
      placed += put(g, b, [x + dx, top + dy, z + dz], leaves);
    }
  }
  return placed;
}

/**
 * A lit entry in a wall opening. The glass fills box (light_blue_stained_glass) with a sea_lantern one cell inside each
 * pane. canopy: a 1-deep smooth_quartz_slab on the row above, out over the street. dir = outward direction of the wall.
 */
export function litEntry(g, box, dir, { canopy = false, glass = "light_blue_stained_glass" } = {}) {
  const b = norm(box);
  const [x0, y0, z0, x1, y1, z1] = b;
  const [ox, , oz] = DIRS[dir];
  const [ix, , iz] = DIRS[OPPOSITE[dir]];
  const fp = [x0 - 1, y0, z0 - 1, x1 + 1, y1 + (canopy ? 1 : 0), z1 + 1];
  let placed = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    placed += put(g, fp, [x, y, z], glass);
    placed += put(g, fp, [x + ix, y, z + iz], "sea_lantern");
  }
  if (canopy) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    placed += put(g, fp, [x + ox, y1 + 1, z + oz], B.slab("smooth_quartz", "bottom"));
  }
  return placed;
}
