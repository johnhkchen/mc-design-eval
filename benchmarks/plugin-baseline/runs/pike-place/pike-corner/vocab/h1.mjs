// Vocabulary H1 (plan.md VOCABULARY 1, 4, 7, 10, 13, 16, 19, 22, 25): plinthTo, pier, litWindow, parapetCap,
// signboard, stallFit, chimneyStack, rooftopPlanter, sanitaryPier. Each takes its position as an argument and writes
// only inside the footprint it is given, into air only. `over: true` lets a helper replace non-air inside its own
// footprint; plinthTo uses it for the ground under the walls, as the plan specifies.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const blk = (name, state = {}) => [name, state];
const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
const within = (x0, y0, z0, x1, y1, z1) => {
  const [ax, bx] = span(x0, x1), [ay, by] = span(y0, y1), [az, bz] = span(z0, z1);
  return (x, y, z) => x >= ax && x <= bx && y >= ay && y <= by && z >= az && z <= bz;
};

// One block into the footprint. Returns 1 when placed, 0 when refused (outside, out of bounds, or not air).
function put(g, inFoot, x, y, z, entry, over = false) {
  if (!inFoot(x, y, z) || !g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, ...entry);
  return 1;
}

// Along a wall of this face ([dx, dz]); the wall's own cells run along it.
const along = (face) => (face === "west" || face === "east" ? [0, 1] : [1, 0]);
// The `width` cells of a pier (or sign strip) starting at `at` = [x, z] and running along the wall.
const strip = ([x, z], face, width) => {
  const [dx, dz] = along(face);
  return Array.from({ length: width }, (_, i) => [x + dx * i, z + dz * i]);
};
const onStrip = (cells, y0, y1) => (x, y, z) => y >= y0 && y <= y1 && cells.some(([cx, cz]) => cx === x && cz === z);

// plinthTo(g, {x0,x1,z0,z1, groundAt(x,z), wallY, footprint?}): stone from y 0 up to the ground under each footprint
// cell (over the ground), then on up to wallY (into air). footprint(x, z) limits it to the # cells; default: the box.
export function plinthTo(g, { x0, x1, z0, z1, groundAt, wallY, footprint = () => true }) {
  const inBox = within(x0, 0, z0, x1, wallY, z1);
  const inFoot = (x, y, z) => inBox(x, y, z) && footprint(x, z);
  const [ax, bx] = span(x0, x1), [az, bz] = span(z0, z1);
  let n = 0;
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) {
    if (!footprint(x, z)) continue;
    const ground = groundAt(x, z);
    for (let y = 0; y <= wallY; y++) {
      // about every tenth cell below y 6 is mossy or cracked
      const mossy = y < 6 && (x * 7 + z * 3 + y * 5) % 10 === 0;
      const block = mossy ? ((x + z) % 2 ? "mossy_stone_bricks" : "cracked_stone_bricks") : "stone_bricks";
      n += put(g, inFoot, x, y, z, blk(block), y <= ground);
    }
  }
  return n;
}

// pier(g, {at:[x,z], face, y0, y1, width:2, cap?}): a 2-wide brick column on the wall plane from y0 to y1, capped
// at y1 with `cap` (smooth_sandstone by default).
export function pier(g, { at, face, y0, y1, width = 2, cap = "smooth_sandstone" }) {
  const cells = strip(at, face, width);
  const inFoot = onStrip(cells, y0, y1);
  let n = 0;
  for (const [x, z] of cells) for (let y = y0; y <= y1; y++) n += put(g, inFoot, x, y, z, blk(y === y1 ? cap : "bricks"));
  return n;
}

// litWindow(g, {at:[x,y,z], face, w, h, lit?, light?}): glass_pane across the opening (at = its lower corner on the
// wall plane, face = the way the wall looks). lit: a light one cell inside on alternate bays, mid-height, and a
// lantern hanging under the lintel inside (a chain up to the ceiling where the room has one; otherwise no lantern).
export function litWindow(g, { at: [x, y, z], face, w, h, lit = true, light = "shroomlight" }) {
  const [dx, dz] = along(face);
  const [ix, , iz] = DIRS[OPPOSITE[face]];   // the way in, one cell behind the glass
  const plane = (i, j) => [x + dx * i, y + j, z + dz * i];
  const room = (i, j) => { const [px, py, pz] = plane(i, j); return [px + ix, py, pz + iz]; };
  const cells = new Set();
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) cells.add(plane(i, j).join());
    for (let j = 0; j <= h; j++) cells.add(room(i, j).join());   // one row above the opening: the chain's cell
  }
  const inFoot = (X, Y, Z) => cells.has(`${X},${Y},${Z}`);
  // panes join their neighbours along the wall only
  const link = dz ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
  let n = 0;
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [X, Y, Z] = plane(i, j);
    n += put(g, inFoot, X, Y, Z, ["glass_pane", link]);
  }
  if (!lit) return n;
  const mid = Math.floor(h / 2);
  for (let i = 0; i < w; i += 2) {
    const [rx, ry, rz] = room(i, mid);
    n += put(g, inFoot, rx, ry, rz, blk(light));
  }
  const mi = Math.floor(w / 2);
  const [lx, ly, lz] = room(mi, h - 1), [kx, ky, kz] = room(mi, h);
  let hung = !g.isAir(kx, ky, kz);
  if (!hung && !g.isAir(kx, ky + 1, kz)) hung = put(g, inFoot, kx, ky, kz, B.chain("y", false)) === 1;
  if (hung) n += put(g, inFoot, lx, ly, lz, B.lantern(true));
  return n;
}

// parapetCap(g, {box:[x0,z0,x1,z1], y0, y1, coping, wall?}): a ring of `wall` (bricks) around the roof edge from y0
// up to y1 - 1, and the `coping` slab (type bottom) at y1 on top. Air only, so the roof deck below stays as it is.
export function parapetCap(g, { box: [x0, z0, x1, z1], y0, y1, coping, wall = "bricks" }) {
  const [ax, bx] = span(x0, x1), [az, bz] = span(z0, z1);
  const ring = (x, z) => x === ax || x === bx || z === az || z === bz;
  const inFoot = (x, y, z) => ring(x, z) && x >= ax && x <= bx && z >= az && z <= bz && y >= y0 && y <= y1;
  let n = 0;
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) {
    if (!ring(x, z)) continue;
    for (let y = y0; y <= y1; y++) {
      n += put(g, inFoot, x, y, z, y === y1 ? [coping, { type: "bottom", waterlogged: "false" }] : blk(wall));
    }
  }
  return n;
}

// Hanging-sign rotation for the way it faces (0 south, 4 west, 8 north, 12 east).
const SIGN_TURN = { south: 0, west: 4, north: 8, east: 12 };

// Up to four lines of `width` characters; a sign holds four, so longer text is an error, not a cut.
function wrapLines(text, width = 15, max = 4) {
  const lines = [];
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (lines.length && (lines.at(-1) + " " + word).length <= width) lines[lines.length - 1] += " " + word;
    else lines.push(word);
  }
  if (lines.length > max) throw new Error(`signboard: "${text}" needs ${lines.length} lines of ${width}; a sign holds ${max}`);
  return lines;
}

// signboard(g, "TEXT", {at:[x,y,z], face, mode?, wood?}): one sign at `at`, the cell in front of the wall.
// mode "wall": a spruce_wall_sign facing `face` (out from the wall). mode "hanging": a hanging sign, a chain up to
// a fence arm that reaches out from the wall on the cell above (the arm joins the wall, at y + 2).
export function signboard(g, text, { at: [x, y, z], face, mode = "wall", wood = "spruce" }) {
  const lines = wrapLines(text);
  const dv = g.dataVersion;
  if (mode === "wall") {
    return put(g, (X, Y, Z) => X === x && Y === y && Z === z, x, y, z, B.sign(wood, lines, { wall: true, facing: face, dataVersion: dv }));
  }
  const inFoot = (X, Y, Z) => X === x && Z === z && Y >= y && Y <= y + 2;
  let n = put(g, inFoot, x, y, z, B.sign(wood, lines, { wall: false, hanging: true, rotation: SIGN_TURN[face], dataVersion: dv }));
  n += put(g, inFoot, x, y + 1, z, B.chain("y", false));
  const arm = Object.fromEntries(["north", "east", "south", "west"].map((d) => [d, d === OPPOSITE[face] ? "true" : "false"]));
  n += put(g, inFoot, x, y + 2, z, [`${wood}_fence`, arm]);
  return n;
}

const TRADES = {
  produce: [["melon", {}], ["pumpkin", {}], ["hay_block", { axis: "y" }]],
  flowers: [["potted_red_tulip", {}], ["potted_azalea_bush", {}], ["potted_fern", {}]],
  crafts: [["barrel", { facing: "up", open: "false" }], ["composter", { level: "0" }]],
};

// stallFit(g, {box:[x0,y0,z0,x1,y1,z1], front, trade?}): a stall in its room box, the open side at `front`.
// Front layer: spruce_planks counter, a bottom spruce slab on it, goods on every other cell. Back layer: a planks
// wall with open spruce-trapdoor shelves. Between them a 2-high clear lane. Glowstone in the ceiling every third
// cell, a hanging lantern under each one in the middle lane layer. Needs 3 deep and 3 high (the stall is never deeper).
export function stallFit(g, { box: [x0, y0, z0, x1, y1, z1], front, trade = "produce" }) {
  const [ax, bx] = span(x0, x1), [ay, by] = span(y0, y1), [az, bz] = span(z0, z1);
  if (!["north", "south", "east", "west"].includes(front)) throw new Error(`stallFit: front "${front}" is not a side`);
  const alongX = front === "east" || front === "west";
  const depth = alongX ? bx - ax + 1 : bz - az + 1, width = alongX ? bz - az + 1 : bx - ax + 1;
  if (depth < 3 || by - ay < 2) throw new Error(`stallFit: box needs 3 deep and 3 high (depth ${depth}, height ${by - ay + 1})`);
  // d counts from the open front (0) to the back wall; w runs across the front
  const sgn = front === "west" || front === "north" ? 1 : -1;
  const base = { west: ax, east: bx, north: az, south: bz }[front];
  const at = (d, w, y) => (alongX ? [base + sgn * d, y, az + w] : [ax + w, y, base + sgn * d]);
  const inFoot = within(ax, ay, az, bx, by, bz);
  const back = depth - 1, mid = Math.floor(back / 2);
  const goods = TRADES[trade] ?? TRADES.produce;
  let n = 0;
  for (let w = 0; w < width; w++) {
    n += put(g, inFoot, ...at(0, w, ay), blk("spruce_planks"));
    // goods stand on a full planks block (a bottom slab leaves half a block of air under them)
    if (w % 2 === 0) {
      n += put(g, inFoot, ...at(0, w, ay + 1), blk("spruce_planks"));
      const [gb, gs] = goods[(w / 2) % goods.length];
      n += put(g, inFoot, ...at(0, w, ay + 2), [gb, gs]);
    } else n += put(g, inFoot, ...at(0, w, ay + 1), B.slab("spruce", "bottom"));
  }
  // shelves go in before the planks, which then fill only the air around them
  for (let w = 0; w < width; w += 2) n += put(g, inFoot, ...at(back, w, ay + 1), B.trapdoor("spruce", front, "bottom", true));
  for (let w = 0; w < width; w++) for (let y = ay; y <= by; y++) n += put(g, inFoot, ...at(back, w, y), blk("spruce_planks"));
  for (let d = 1; d < back; d++) for (let w = 1; w < width; w += 3) {
    n += put(g, inFoot, ...at(d, w, by), blk("glowstone"));
    if (d === mid && by - 1 >= ay + 2) n += put(g, inFoot, ...at(d, w, by - 1), B.lantern(true));
  }
  return n;
}

// chimneyStack(g, {at:[x,z], y0?, y1?}): a solid 2x2 brick stack (no flue), a deepslate_bricks band at y 36, and a
// brick_slab cap ring one cell outside it at the top (y1). The stack's 4x4 footprint is the bounds.
export function chimneyStack(g, { at: [x, z], y0 = 33, y1 = 38 }) {
  const inFoot = (X, Y, Z) => X >= x - 1 && X <= x + 2 && Z >= z - 1 && Z <= z + 2 && Y >= y0 && Y <= y1;
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    n += put(g, inFoot, x + dx, y, z + dz, blk(y === 36 ? "deepslate_bricks" : "bricks"));
  }
  for (let X = x - 1; X <= x + 2; X++) for (let Z = z - 1; Z <= z + 2; Z++) {
    const ring = X === x - 1 || X === x + 2 || Z === z - 1 || Z === z + 2;
    if (ring) n += put(g, inFoot, X, y1, Z, ["brick_slab", { type: "bottom", waterlogged: "false" }]);
  }
  return n;
}

// rooftopPlanter(g, {box:[x0,y0,z0,x1,y1,z1]}): a dirt bed on the box's bottom layer (sit it on the parapet cap),
// with persistent oak_leaves clumps on the layer above and a potted_fern every third cell.
export function rooftopPlanter(g, { box: [x0, y0, z0, x1, y1, z1] }) {
  const [ax, bx] = span(x0, x1), [ay, by] = span(y0, y1), [az, bz] = span(z0, z1);
  const inFoot = within(ax, ay, az, bx, by, bz);
  let n = 0;
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) n += put(g, inFoot, x, ay, z, blk("dirt"));
  if (by > ay) {
    for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) {
      n += put(g, inFoot, x, ay + 1, z, (x - ax) % 3 === 2 ? blk("potted_fern") : blk("oak_leaves", { persistent: "true" }));
    }
  }
  return n;
}

// sanitaryPier(g, {at:[x,z], face?}): a 2-wide smooth_sandstone pier from the ground (the first solid cell under the
// air) up to y 9, with a cut_sandstone cap at y 10. face defaults to west.
export function sanitaryPier(g, { at, face = "west" }) {
  const cells = strip(at, face, 2);
  const inFoot = onStrip(cells, 0, 10);
  let n = 0;
  for (const [x, z] of cells) {
    let base = 10;
    while (base > 0 && g.isAir(x, base - 1, z)) base--;
    for (let y = base; y < 10; y++) n += put(g, inFoot, x, y, z, blk("smooth_sandstone"));
    n += put(g, inFoot, x, 10, z, blk("cut_sandstone"));
  }
  return n;
}
