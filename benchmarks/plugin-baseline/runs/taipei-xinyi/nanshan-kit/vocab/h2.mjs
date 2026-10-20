// Vocabulary helpers, batch h2 (plan.md VOCABULARY): floorLine, lobbyGlass, crownFin, litWindows, plaqueFascia,
// terraceDeck, kiosk, slabRamp, ribFace, glassHip. Blocks are plan.md PALETTE ids; states are valid for 1.21.1.
// Each helper takes its position as arguments, writes only inside the footprint it is given and only into air.
// The one exception is plaqueFascia: its letters go onto the fascia band's own smooth_quartz, and only there.
// No helper places furniture: the rooms are seen through glass, so interiors get light only.
// Boxes are {x0,x1,y0,y1,z0,z1}, inclusive. Faces are "north" (z0 side), "south" (z1), "west" (x0), "east" (x1).
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { frame } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/brush-core.mjs";

const FACES = ["north", "south", "east", "west"];
const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);

/** Wrap a grid so that writes outside `box`, or into a non-air cell (unless over(name) says so), are dropped.
 *  `placed` counts the writes that landed. Reads and everything else pass through to the grid. */
function scoped(g, box, { over = () => false } = {}) {
  let placed = 0;
  const inside = (x, y, z) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1 && z >= box.z0 && z <= box.z1;
  const write = (x, y, z, block, state, nbt) => {
    if (!inside(x, y, z)) return;
    if (!AIR.has(g.blockAt(x, y, z)) && !over(g.blockAt(x, y, z))) return;
    g.set(x, y, z, block, state, nbt);
    placed++;
  };
  const proxy = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { write(x, y, z, block, state, nbt); return proxy; };
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) write(x, y, z, block, state);
        return proxy;
      };
      if (prop === "placed") return placed;
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return proxy;
}

/** The slab of cells `d0..d1` in from a face's outer edge (depth 0 = the outer plane), over y0..y1. */
function slabOf(face, box, d0, d1, y0, y1) {
  switch (face) {
    case "north": return { x0: box.x0, x1: box.x1, z0: box.z0 + d0, z1: box.z0 + d1, y0, y1 };
    case "south": return { x0: box.x0, x1: box.x1, z0: box.z1 - d1, z1: box.z1 - d0, y0, y1 };
    case "west": return { x0: box.x0 + d0, x1: box.x0 + d1, z0: box.z0, z1: box.z1, y0, y1 };
    case "east": return { x0: box.x1 - d1, x1: box.x1 - d0, z0: box.z0, z1: box.z1, y0, y1 };
    default: throw new Error(`face must be north, south, east or west (got ${face})`);
  }
}

const alongAxisIsX = (face) => face === "north" || face === "south";

/** Length of a face in cells (its first corner to its last cell, as an offset). */
const alongLen = (face, box) => (alongAxisIsX(face) ? box.x1 - box.x0 : box.z1 - box.z0);

/** Every cell of the face slab: { x, y, z, a (offset along the face from its first corner), d (depth in from the edge) }. */
function* faceCells(face, box, d0, d1, y0, y1) {
  const s = slabOf(face, box, d0, d1, y0, y1);
  for (let x = s.x0; x <= s.x1; x++) for (let y = y0; y <= y1; y++) for (let z = s.z0; z <= s.z1; z++) {
    const a = alongAxisIsX(face) ? x - box.x0 : z - box.z0;
    const d = { north: z - box.z0, south: box.z1 - z, west: x - box.x0, east: box.x1 - x }[face];
    yield { x, y, z, a, d };
  }
}

/** [x, z] of the cell at offset `a` along a face, `d` cells in from its outer edge. */
function cellAt(face, box, a, d) {
  switch (face) {
    case "north": return [box.x0 + a, box.z0 + d];
    case "south": return [box.x0 + a, box.z1 - d];
    case "west": return [box.x0 + d, box.z0 + a];
    case "east": return [box.x1 - d, box.z0 + a];
    default: throw new Error(`face must be north, south, east or west (got ${face})`);
  }
}

/** Seeded PRNG (mulberry32): the same seed gives the same lit bays on every build. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** floorLine(g, face, y, box): light_gray_concrete in the glass plane (one cell in) at height y, across the face.
 *  chamfer: the shaft's corner chamfer width (plan: 6); cells with dx+dz < chamfer from a corner are left out. */
export function floorLine(g, face, y, box, { depth = 1, chamfer = 0, block = "light_gray_concrete" } = {}) {
  const s = scoped(g, slabOf(face, box, depth, depth, y, y));
  const n = alongLen(face, box);
  for (const { x, z, a, d } of faceCells(face, box, depth, depth, y, y)) {
    if (a + d < chamfer || n - a + d < chamfer) continue;
    s.set(x, y, z, block);
  }
  return s.placed;
}

/** lobbyGlass(g, box, pierEvery, pierMat, opts): the lobby's glazed faces (default all four). Piers of pierMat on the
 *  outer edge every pierEvery cells and at the corners, one proud of the glass; glass one cell in; in one bay of every
 *  three a sea_lantern on the ceiling one cell behind the glass. opts: faces, glass ("glass"), lanternBays (3). */
export function lobbyGlass(g, box, pierEvery, pierMat, { faces = FACES, glass = "glass", lanternBays = 3 } = {}) {
  const s = scoped(g, box);
  const pierState = /_pillar$/.test(pierMat) ? { axis: "y" } : undefined;
  for (const face of faces) {
    const n = alongLen(face, box);
    for (const d of [0, 1, 2]) for (const { x, y, z, a } of faceCells(face, box, d, d, box.y0, box.y1)) {
      const pier = a % pierEvery === 0 || a === n;
      if (d === 0 && pier) s.set(x, y, z, pierMat, pierState);
      else if (d === 1 && !pier) s.set(x, y, z, glass);
      else if (d === 2 && !pier && y === box.y1 && Math.floor(a / pierEvery) % lanternBays === 1 && a % pierEvery === Math.floor(pierEvery / 2))
        s.set(x, y, z, "sea_lantern");
    }
  }
  return s.placed;
}

/** crownFin(g, at, face, topY, opts): one wheat-ear fin on the outer plane of a crown face. at is the fin's x (north and
 *  south) or z (east and west); topY is computed by the caller (381 at the centre, 366 at the chamfers). smooth_quartz up to
 *  y365, quartz_pillar above, an end_rod cap (opts.cap false where an aircraft light takes the top). opts: box, y0 (353). */
export function crownFin(g, at, face, topY, { box, y0 = 353, cap = true } = {}) {
  if (!box) throw new Error("crownFin: pass { box }, the crown's footprint");
  if (!Number.isInteger(topY) || topY < 366 || topY > 381) throw new Error(`crownFin: top ${topY} is outside 366..381`);
  const a = alongAxisIsX(face) ? at - box.x0 : at - box.z0;
  if (a < 0 || a > alongLen(face, box)) throw new Error(`crownFin: ${at} is not on the ${face} face`);
  const [x, z] = cellAt(face, box, a, 0);
  const top = topY + (cap ? 1 : 0);
  const s = scoped(g, { x0: x, x1: x, y0, y1: top, z0: z, z1: z });
  for (let y = y0; y <= topY; y++) {
    if (y <= 365) s.set(x, y, z, "smooth_quartz");
    else s.set(x, y, z, "quartz_pillar", { axis: "y" });
  }
  if (cap) s.set(x, topY + 1, z, "end_rod", { facing: "up" });
  return s.placed;
}

/** litWindows(g, face, density, box, opts): lit windows on one face, picked by a seeded rng. A bay is 6 cells wide and one
 *  floor band tall (floor lines at y0 + 7k). In 1 bay of every 4.5 a warm light (ochre_froglight, shroomlight, glowstone),
 *  in 1 of 6 a cool one (sea_lantern, pearlescent_froglight), one cell behind the glass at the band's middle height.
 *  density scales both rates: 1 is plan.md's rate; S and E faces are denser, so pass more than 1 there. */
export function litWindows(g, face, density, box, { y0 = box.y0, y1 = box.y1, seed = 1, bayW = 6, step = 7 } = {}) {
  const s = scoped(g, slabOf(face, box, 2, 2, y0, y1));
  const rnd = mulberry32(seed);
  const n = alongLen(face, box);
  const warm = ["ochre_froglight", "shroomlight", "glowstone"];
  const cool = ["sea_lantern", "pearlescent_froglight"];
  const pWarm = density / 4.5, pCool = density / 6;
  for (let f = y0; f + 3 <= y1; f += step) for (let a = Math.floor(bayW / 2); a <= n; a += bayW) {
    const r = rnd();
    let block = null;
    if (r < pWarm) block = warm[Math.floor(rnd() * warm.length)];
    else if (r < pWarm + pCool) block = cool[Math.floor(rnd() * cool.length)];
    if (!block) continue;
    const [x, z] = cellAt(face, box, a, 2);
    s.set(x, f + 3, z, block, block.endsWith("froglight") ? { axis: "y" } : undefined);
  }
  return s.placed;
}

/** plaqueFascia(g, text, at, face, opts): shop-name banner lettering on a fascia band. plaque() with no board (material
 *  null): the letters are wall banners hung on the band's own smooth_quartz, one cell proud, and nothing else is touched.
 *  at is the origin [x,y,z] on the face (plaque's frame). The banners sit on the top row of the band, so for the plan's
 *  fascia at y8 pass at y7 (height 2, the default). opts: width (12), height (2), letter. */
export function plaqueFascia(g, text, at, face, { width = 12, height = 2, letter } = {}) {
  const F = frame(face, at);
  const pts = [];
  for (const u of [0, width - 1]) for (const v of [0, height - 1]) for (const d of [0, 1]) pts.push(F.p(u, v, d));
  const box = {
    x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])),
    z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])),
  };
  const s = scoped(g, box, { over: (name) => name === "minecraft:smooth_quartz" });
  plaque(s, text, { at, face, width, height, material: null, frame: null, letter });
  return s.placed;
}

/** terraceDeck(g, box, y, opts): a roof terrace. smooth_stone_slab (bottom) deck at layer y, laid on the roof below it;
 *  a glass_pane rail one high (y+1) along the edges given (default all four). Deck-light cells (every 6x6, offset 3 from
 *  the corner) are left air for the lighting part. opts: edges, rail, deck, lightGrid (6). */
export function terraceDeck(g, box, y, { edges = FACES, rail = "glass_pane", deck = "smooth_stone_slab", lightGrid = 6 } = {}) {
  const s = scoped(g, { ...box, y0: y, y1: y + 1 });
  const lit = (x, z) => (x - box.x0) % lightGrid === 3 && (z - box.z0) % lightGrid === 3;
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (!lit(x, z)) s.set(x, y, z, deck, { type: "bottom" });
  }
  const rails = new Set();
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    const on = (x === box.x0 && edges.includes("west")) || (x === box.x1 && edges.includes("east"))
      || (z === box.z0 && edges.includes("north")) || (z === box.z1 && edges.includes("south"));
    if (on) rails.add(`${x},${z}`);
  }
  for (const k of rails) {
    const [x, z] = k.split(",").map(Number);
    const side = (dx, dz) => (rails.has(`${x + dx},${z + dz}`) ? "true" : "false");
    s.set(x, y + 1, z, rail, { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0) });
  }
  return s.placed;
}

/** kiosk(g, box, opts): a glass pavilion (P-K). Glass walls on the box edge from y0 to y1-1, a flat quartz_slab roof at y1
 *  over the whole footprint, and sea_lantern on the ceiling inside every 3 cells. It lays no floor: the walls start on the
 *  ground an earlier part owns. opts: glass, roof, light. */
export function kiosk(g, box, { glass = "glass", roof = "quartz_slab", light = "sea_lantern" } = {}) {
  const s = scoped(g, box);
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    s.set(x, box.y1, z, roof, { type: "bottom" });
    const edge = x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1;
    if (edge) {
      for (let y = box.y0; y < box.y1; y++) s.set(x, y, z, glass);
    } else if ((x - box.x0) % 3 === 1 && (z - box.z0) % 3 === 1) {
      s.set(x, box.y1 - 1, z, light);
    }
  }
  return s.placed;
}

/** slabRamp(g, from, to, width, opts): a pedestrian ramp of bottom slabs on full blocks, half a block per step, 3 steps
 *  then a 2-long landing. from is the low end [x,y,z] and to the high end; y is the top solid layer, so the walking layer is
 *  y+1 (plan: ground 1-2 to street 4 means from.y 1 or 2, to.y 3). The ramp runs along x or z from `from` to `to` (inclusive)
 *  and is `width` cells wide from from's perpendicular coordinate on. Throws if the run is too short to reach `to`. */
export function slabRamp(g, from, to, width = 3, { material = "polished_andesite" } = {}) {
  if (from[0] !== to[0] && from[2] !== to[2]) throw new Error("slabRamp: from and to must share x or z");
  if (from[0] === to[0] && from[2] === to[2]) throw new Error("slabRamp: from and to must differ");
  const run = from[0] !== to[0] ? 0 : 2, perp = 2 - run;
  const dir = Math.sign(to[run] - from[run]);
  const n = Math.abs(to[run] - from[run]) + 1;
  const yLow = from[1], yHigh = to[1];
  const p0 = from[perp], p1 = from[perp] + width - 1;
  const r0 = Math.min(from[run], to[run]), r1 = Math.max(from[run], to[run]);
  const box = run === 0
    ? { x0: r0, x1: r1, z0: p0, z1: p1, y0: yLow, y1: yHigh }
    : { z0: r0, z1: r1, x0: p0, x1: p1, y0: yLow, y1: yHigh };
  const s = scoped(g, box);
  const target = 2 * (yHigh + 1);
  let S = 2 * (yLow + 1);                      // walking surface in half blocks
  for (let i = 0; i < n; i++) {
    if (i % 5 < 3 && S < target) S += 1;       // steps, then the 2-long landing
    const r = from[run] + dir * i, k = Math.floor(S / 2);
    for (let p = p0; p <= p1; p++) {
      const [x, z] = run === 0 ? [r, p] : [p, r];
      for (let y = yLow; y < k; y++) s.set(x, y, z, material);
      if (S % 2) s.set(x, k, z, `${material}_slab`, { type: "bottom" });
    }
  }
  if (S !== target) throw new Error(`slabRamp: ${n} cells rise to surface ${S / 2}, not ${yHigh + 1}`);
  return s.placed;
}

/** ribFace(g, face, opts): one flat face of the tower shaft (or of a rounded curve as flat pieces). The outer plane gets a
 *  white_concrete column every `every` cells from the corner (2 on flat faces, 1 on curves); the plane one cell back is
 *  cyan_stained_glass, with light_gray_stained_glass floor lines at y0 + 7k. opts: box, y0, y1, every (2), step (7). */
export function ribFace(g, face, { box, y0 = box.y0, y1 = box.y1, every = 2, rib = "white_concrete", glass = "cyan_stained_glass", line = "light_gray_stained_glass", step = 7 } = {}) {
  const s = scoped(g, slabOf(face, box, 0, 1, y0, y1));
  for (const { x, y, z, a, d } of faceCells(face, box, 0, 1, y0, y1)) {
    if (d === 0) { if (a % every === 0) s.set(x, y, z, rib); }
    else if ((y - y0) % step === 0) s.set(x, y, z, line);
    else s.set(x, y, z, glass);
  }
  return s.placed;
}

/** glassHip(g, box0, box1, y0, y1, opts): a stepped glass hip roof. Course y (y0 to y1) is a solid white_stained_glass
 *  slab whose sides step in one cell per course from box0 until they reach box1; iron_block ribs run along the four
 *  diagonals of every course, from each corner to the middle. */
export function glassHip(g, box0, box1, y0, y1, { glass = "white_stained_glass", rib = "iron_block" } = {}) {
  const insetW = box1.x0 - box0.x0, insetE = box0.x1 - box1.x1, insetN = box1.z0 - box0.z0, insetS = box0.z1 - box1.z1;
  const s = scoped(g, { ...box0, y0, y1 });
  for (let y = y0; y <= y1; y++) {
    const k = y - y0;
    const x0 = box0.x0 + Math.min(k, insetW), x1 = box0.x1 - Math.min(k, insetE);
    const z0 = box0.z0 + Math.min(k, insetN), z1 = box0.z1 - Math.min(k, insetS);
    if (x0 > x1 || z0 > z1) break;
    const hip = new Set();
    const reach = Math.floor(Math.min(x1 - x0, z1 - z0) / 2);
    for (const [cx, dx] of [[x0, 1], [x1, -1]]) for (const [cz, dz] of [[z0, 1], [z1, -1]])
      for (let i = 0; i <= reach; i++) hip.add(`${cx + dx * i},${cz + dz * i}`);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (hip.has(`${x},${z}`)) s.set(x, y, z, rib);
      else s.set(x, y, z, glass);
    }
  }
  return s.placed;
}
