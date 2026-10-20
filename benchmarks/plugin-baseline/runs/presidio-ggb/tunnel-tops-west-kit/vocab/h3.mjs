// Landscape helpers for Tunnel Tops west (plan.md VOCABULARY): the eight names, nothing else.
// Module coordinates (x 0..119, z 0..145, y 0..30). A helper takes its position as arguments, writes only inside the
// footprint it is given, and writes only into air. The one exception is the surface row of roadStrip and tier:
// { over: true } lets them replace the ground block at their own y, never any other y. Each returns { placed, refused }.
// A `y` argument is the y of the surface block the helper stands on (the mapped H); the helper builds above it.
import { B, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const PLANTABLE = new Set(["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:moss_block"]);
const DRIFTS = {
  "grey-green": ["tall_grass", "fern", "short_grass"],
  ochre: ["dead_bush", "sweet_berry_bush"],
  purple: ["allium", "cornflower"],
  meadow: ["allium", "cornflower", "dandelion"],
};

// A seeded hash in [0, 1) for integer inputs: the same call always gives the same stone, plant or wobble.
function rnd(...k) {
  let h = 0x811c9dc5;
  for (const v of k) { h = Math.imul(h ^ (v | 0), 0x01000193); h ^= h >>> 15; }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

// The one write path. box = [[x0, y0, z0], [x1, y1, z1]] (inclusive, any order) is the footprint. over = the y whose
// non-air cells may be replaced (null: air only). Writes are queued and checked as they are queued (footprint, grid,
// air), so a refused write is listed, never thrown; the first write to a cell in a call wins. done() commits.
function writer(g, box, over = null) {
  const lo = box[0].map((v, i) => Math.min(v, box[1][i])), hi = box[0].map((v, i) => Math.max(v, box[1][i]));
  const queue = new Map(), refused = [];
  const set = (x, y, z, block, state) => {
    const k = `${x},${y},${z}`;
    if (queue.has(k)) return false;
    const inside = x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
    const now = inside && g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
    if (now === null || (!AIR.has(now) && y !== over)) {
      refused.push({ at: [x, y, z], block, why: now === null ? "outside footprint" : `occupied by ${now}` });
      return false;
    }
    queue.set(k, [x, y, z, block, state]);
    return true;
  };
  const done = () => {
    for (const [x, y, z, block, state] of queue.values()) g.set(x, y, z, block, state);
    return { placed: queue.size, refused };
  };
  return { set, done };
}

/** A grey road strip on the surface row y. axis: the direction the road runs ("x" or "z"). Edges white solid, a yellow
 *  centre line (two for an even width), white dashed lane lines (3 on, 3 off) between edge and centre when the road is 7+
 *  wide. Pass { over: true } to lay it over the ground at y. */
export function roadStrip(g, x0, z0, x1, z1, y, { axis = "x", over = false } = {}) {
  const w = writer(g, [[x0, y, z0], [x1, y, z1]], over ? y : null);
  const lo = [Math.min(x0, x1), Math.min(z0, z1)], hi = [Math.max(x0, x1), Math.max(z0, z1)];
  const along = axis === "x" ? 0 : 1, across = 1 - along, W = hi[across] - lo[across] + 1;
  const centre = W % 2 ? [(W - 1) / 2] : [W / 2 - 1, W / 2];
  const q = Math.round((W - 1) / 4);
  for (let a = 0; a <= hi[along] - lo[along]; a++) for (let j = 0; j < W; j++) {
    let block = "gray_concrete";
    if (j === 0 || j === W - 1) block = "white_concrete";
    else if (centre.includes(j)) block = "yellow_concrete";
    else if (W >= 7 && (j === q || j === W - 1 - q) && a % 6 < 3) block = "white_concrete";
    const [x, z] = along === 0 ? [lo[0] + a, lo[1] + j] : [lo[0] + j, lo[1] + a];
    w.set(x, y, z, block);
  }
  return w.done();
}

/** A lawn mound one block high (grass_block at y + 1) over the rectangle, its outline wandering: odd rows are staggered
 *  half a block and the edge is wobbled, so it reads as a soft swell, not a terrace. Air only, so it sits on the lawn. */
export function moundLawn(g, x0, z0, x1, z1, y, { seed = 1 } = {}) {
  const w = writer(g, [[x0, y + 1, z0], [x1, y + 1, z1]]);
  const [lx, hx, lz, hz] = [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)];
  const cx = (lx + hx) / 2, cz = (lz + hz) / 2, rx = (hx - lx) / 2 + 0.5, rz = (hz - lz) / 2 + 0.5;
  for (let x = lx; x <= hx; x++) for (let z = lz; z <= hz; z++) {
    const dx = (x + (z % 2 ? 0.5 : 0) - cx) / rx, dz = (z - cz) / rz;
    const wobble = 0.12 * Math.sin(0.9 * x + seed) * Math.cos(0.7 * z) + 0.1 * (rnd(seed, x, z) - 0.5);
    if (dx * dx + dz * dz + wobble <= 1) w.set(x, y + 1, z, "grass_block");
  }
  return w.done();
}

/** The Fort lookout on a 6 x 6 deck. (x, z) = the NW post cell, y = the mound's surface (4). Posts y+1..y+11, a mid
 *  platform at y+4 (south half), the deck at y+8 with an open spruce trapdoor hatch in it, a fence rail at y+9, a ladder
 *  on the inside of the north face (y+1..y+7, backed by planks at y+3..y+7), a hip cap of stair rings at y+11 and y+12
 *  with a 2 x 2 slab apex, and a hanging lantern under each eave corner. Footprint x-1..x+6, z-1..z+6, y+1..y+12. */
export function fortTower(g, x, z, y) {
  const X1 = x + 5, Z1 = z + 5, w = writer(g, [[x - 1, y + 1, z - 1], [X1 + 1, y + 12, Z1 + 1]]);
  const corners = [[x, z], [X1, z], [x, Z1], [X1, Z1]];
  // first write wins: posts, then the hatch, then the deck around it
  for (const [cx, cz] of corners) for (let yy = y + 1; yy <= y + 11; yy++) w.set(cx, yy, cz, "stripped_spruce_log", { axis: "y" });
  w.set(x + 2, y + 8, z + 1, ...B.trapdoor("spruce", "north", "bottom", true));
  for (let xx = x; xx <= X1; xx++) for (let zz = z; zz <= Z1; zz++) w.set(xx, y + 8, zz, "spruce_planks");
  for (let xx = x; xx <= X1; xx++) for (let zz = z + 3; zz <= Z1; zz++) w.set(xx, y + 4, zz, "spruce_planks");
  for (let yy = y + 3; yy <= y + 7; yy++) w.set(x + 2, yy, z, "spruce_planks");
  for (let yy = y + 1; yy <= y + 7; yy++) w.set(x + 2, yy, z + 1, "ladder", { facing: "south" });
  // fence rail round the deck, corners are posts; each rail piece joins its neighbours
  const rail = [];
  for (let xx = x; xx <= X1; xx++) for (let zz = z; zz <= Z1; zz++) {
    const edge = xx === x || xx === X1 || zz === z || zz === Z1, corner = corners.some(([cx, cz]) => cx === xx && cz === zz);
    if (edge && !corner) rail.push([xx, zz]);
  }
  const solidAt = new Set([...rail, ...corners].map(([xx, zz]) => `${xx},${zz}`));
  const joins = (xx, zz) => solidAt.has(`${xx},${zz}`);
  for (const [xx, zz] of rail) {
    w.set(xx, y + 9, zz, "spruce_fence", { north: joins(xx, zz - 1), east: joins(xx + 1, zz), south: joins(xx, zz + 1), west: joins(xx - 1, zz) });
  }
  // hip cap: outer ring (eaves, one out) at y+11, inner ring at y+12, apex slabs in the middle; stairs face the centre
  const ring = (x0, x1, z0, z1, yy) => {
    for (let xx = x0; xx <= x1; xx++) for (let zz = z0; zz <= z1; zz++) {
      if (xx !== x0 && xx !== x1 && zz !== z0 && zz !== z1) continue;
      const toward = zz === z0 ? "south" : zz === z1 ? "north" : xx === x0 ? "east" : "west";
      w.set(xx, yy, zz, ...B.stairs("spruce", toward, "bottom"));
    }
  };
  ring(x - 1, X1 + 1, z - 1, Z1 + 1, y + 11);
  ring(x, X1, z, Z1, y + 12);
  for (let xx = x + 2; xx <= x + 3; xx++) for (let zz = z + 2; zz <= z + 3; zz++) w.set(xx, y + 12, zz, ...B.slab("spruce", "bottom"));
  for (const [lx, lz] of [[x - 1, z - 1], [X1 + 1, z - 1], [x - 1, Z1 + 1], [X1 + 1, Z1 + 1]]) w.set(lx, y + 10, lz, ...B.lantern(true));
  return w.done();
}

/** A boulder of 2..4 blocks (stone, tuff or andesite) on the square of side 2r at (x, z), on the surface y, one or two
 *  high. r = 1 gives a 2 x 2 footprint; the blocks nearest the centre are chosen first. seed varies it; tall forces or
 *  forbids the second course. Air only. */
export function boulder(g, x, z, y, r = 1, { seed = 1, tall } = {}) {
  const n = 2 * r, w = writer(g, [[x, y + 1, z], [x + n - 1, y + 2, z + n - 1]]);
  const cx = x + r - 0.5, cz = z + r - 0.5, MATS = ["stone", "tuff", "andesite"];
  const cells = [];
  for (let dx = 0; dx < n; dx++) for (let dz = 0; dz < n; dz++) {
    const [xx, zz] = [x + dx, z + dz];
    cells.push({ xx, zz, score: Math.hypot(xx - cx, zz - cz) + 0.5 * rnd(seed, xx, zz) });
  }
  cells.sort((a, b) => a.score - b.score);
  const count = 2 + Math.floor(rnd(seed, x, z, 9) * 3);
  const chosen = cells.slice(0, Math.min(count, cells.length));
  chosen.forEach(({ xx, zz }, i) => w.set(xx, y + 1, zz, MATS[Math.floor(rnd(seed, xx, zz, i) * MATS.length)]));
  if (tall ?? rnd(seed, x, z, 7) < 0.5) w.set(chosen[0].xx, y + 2, chosen[0].zz, MATS[Math.floor(rnd(seed, x, z, 8) * MATS.length)]);
  return w.done();
}

/** A bench at (x, y, z), the seat block on the surface y - 1 (the support must be solid, or nothing is placed). facing:
 *  the way the seat looks (toward the view). Spruce stairs with their back to the view, an open trapdoor arm either end.
 *  Writes its own three cells only, so the 2-high lane in front of it stays clear. */
export function bench(g, x, y, z, facing) {
  if (!g.inBounds(x, y - 1, z) || AIR.has(g.blockAt(x, y - 1, z))) {
    return { placed: 0, refused: [{ at: [x, y - 1, z], block: "support", why: "no solid block under the bench" }] };
  }
  const w = writer(g, [[x - 1, y, z - 1], [x + 1, y, z + 1]]);
  const across = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  w.set(x, y, z, ...B.stairs("spruce", face.opposite(facing), "bottom"));
  for (const s of [-1, 1]) w.set(x + across[0] * s, y, z + across[1] * s, ...B.trapdoor("spruce", facing, "bottom", true));
  return w.done();
}

/** A terrace tier over x0..x1, z0..z1 with its surface at y: light_gray_concrete (or `surface`), calcite edging, and a
 *  seat wall on the north edge (calcite riser at y + 1, spruce slab seat at y + 2). aisles: x starts of 2-wide gaps in
 *  the seat wall. Pass { over: true } to lay the surface over the ground at y. */
export function tier(g, x0, x1, z0, z1, y, { surface = "light_gray_concrete", seat = true, aisles = [], over = false } = {}) {
  const w = writer(g, [[x0, y, z0], [x1, y + 2, z1]], over ? y : null);
  const [lx, hx, lz, hz] = [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)];
  for (let x = lx; x <= hx; x++) for (let z = lz; z <= hz; z++) {
    const edge = x === lx || x === hx || z === lz || z === hz;
    w.set(x, y, z, edge ? "calcite" : surface);
  }
  if (seat) {
    for (let x = lx; x <= hx; x++) {
      if (aisles.some((s) => x === s || x === s + 1)) continue;
      w.set(x, y + 1, lz, "calcite");
      w.set(x, y + 2, lz, ...B.slab("spruce", "bottom"));
    }
  }
  return w.done();
}

/** Plants in clumps on the surface y over the rectangle: the area is cut into 3 x 3 patches, about 60% of them planted,
 *  each cell ragged. kind: "grey-green" | "ochre" | "purple" | "meadow". Plants stand on grass, dirt, podzol or moss
 *  only (other cells are skipped). Tall grass writes both halves. */
export function drift(g, kind, x0, z0, x1, z1, y, { seed = 1 } = {}) {
  const pool = DRIFTS[kind];
  if (!pool) throw new Error(`drift: unknown kind "${kind}" (grey-green, ochre, purple, meadow)`);
  const w = writer(g, [[x0, y + 1, z0], [x1, y + 2, z1]]);
  const [lx, hx, lz, hz] = [Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)];
  for (let x = lx; x <= hx; x++) for (let z = lz; z <= hz; z++) {
    if (rnd(seed, Math.floor(x / 3), Math.floor(z / 3)) > 0.6 || rnd(seed, x, z, 1) > 0.85) continue;
    if (!PLANTABLE.has(g.blockAt(x, y, z))) continue;
    const plant = pool[Math.floor(rnd(seed, x, z, 2) * pool.length)];
    if (plant === "tall_grass") {
      if (w.set(x, y + 1, z, "tall_grass", { half: "lower" })) w.set(x, y + 2, z, "tall_grass", { half: "upper" });
    } else if (plant === "sweet_berry_bush") {
      w.set(x, y + 1, z, plant, { age: String(2 + Math.floor(rnd(seed, x, z, 3) * 2)) });
    } else {
      w.set(x, y + 1, z, plant);
    }
  }
  return w.done();
}

/** A hidden light (level 15) at (x, y + 1), y the surface under it. ring: moss carpet on the eight cells round it, for
 *  planting; on the lawn leave ring off. Nothing is placed if there is no ground under it. */
export function hiddenLight(g, x, z, y, { ring = false } = {}) {
  if (!g.inBounds(x, y, z) || AIR.has(g.blockAt(x, y, z))) {
    return { placed: 0, refused: [{ at: [x, y, z], block: "light", why: "no ground under the light" }] };
  }
  const w = writer(g, [[x - 1, y + 1, z - 1], [x + 1, y + 1, z + 1]]);
  w.set(x, y + 1, z, "light", { level: 15 });
  if (ring) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) w.set(x + dx, y + 1, z + dz, "moss_carpet");
  return w.done();
}
