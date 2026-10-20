// Taipei 101 helpers, the plan.md VOCABULARY names that the parts call (bandRing, cornerStrip, litClump, uplightRow,
// mallFacade, slabRamp, lampPost, spireSection, deckRail). All coordinates are the grid's own (box-local).
// Each helper plans its cells first, then writes only the ones that are air and inside the grid: an earlier part's
// block, the ground under a fitting, and out-of-grid cells are left alone (the count returned is what was written).
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const GLASS = new Set(["minecraft:cyan_stained_glass", "minecraft:light_blue_stained_glass"]);

// Writes planned [x, y, z, block, state] cells into air only. Returns how many were written.
function paint(g, cells) {
  let n = 0;
  for (const [x, y, z, block, state] of cells) {
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) continue;
    g.set(x, y, z, block, state);
    n++;
  }
  return n;
}

const shrink = (box, k) => ({ x0: box.x0 + k, z0: box.z0 + k, x1: box.x1 - k, z1: box.z1 - k });

// The (a, b) offsets of cell (x, z) from each corner of the plan rect r, a along one face and b along the other.
const cornerOffsets = (x, z, r) => [[x - r.x0, z - r.z0], [r.x1 - x, z - r.z0], [x - r.x0, r.z1 - z], [r.x1 - x, r.z1 - z]];
const atCornerOffset = (x, z, r, a, b) => cornerOffsets(x, z, r).some(([p, q]) => p === a && q === b);

// Band plan ring (notchRing): the outer boundary of the square minus its corner notch. "double" is the double
// sawtooth (cut where a<2&&b<4 or a<4&&b<2), "single" a 2x2 corner notch, "corner" one corner cell.
function wallCells(r, notch = "double") {
  const cut = (a, b) => notch === "double" ? (a < 2 && b < 4) || (a < 4 && b < 2)
    : notch === "single" ? a < 2 && b < 2 : a < 1 && b < 1;
  const inPlan = (x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && !cornerOffsets(x, z, r).some(([a, b]) => cut(a, b));
  const cells = [];
  for (let x = r.x0; x <= r.x1; x++) for (let z = r.z0; z <= r.z1; z++) {
    if (inPlan(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPlan(x + dx, z + dz))) cells.push([x, z]);
  }
  return cells;
}

// glassCell: the block for one wall cell of a band. ctx.floorRes = the y residue of floor lines mod 6 (pedestal 2,
// segment 0); ctx.pinnacle swaps body and under-floor glass. Precedence as plan.md: floor line, mullion, noses, lit
// corner, glass course, body glass.
function wallBlock(x, y, z, r, ctx) {
  const isFloor = (yy) => (((yy - (ctx.floorRes ?? 0)) % 6) + 6) % 6 === 0;
  if (isFloor(y)) return ["dark_prismarine"];
  const onNorthSouth = z === r.z0 || z === r.z1;   // mullions on N/S faces follow x, on E/W faces follow z
  if ((onNorthSouth ? x : z) % 4 === 1) return ["light_gray_concrete"];
  if (atCornerOffset(x, z, r, 4, 0) || atCornerOffset(x, z, r, 0, 4)) return ["light_gray_concrete"];
  if (atCornerOffset(x, z, r, 2, 2)) return ["ochre_froglight", { axis: "y" }];
  const under = isFloor(y + 1);
  return [under !== !!ctx.pinnacle ? "light_blue_stained_glass" : "cyan_stained_glass"];
}

// One band of the tower shell: the notched ring of the box shrunk by inset, from y0 to y1, glass by glassCell.
export function bandRing(g, { box, inset = 0, y0, y1, ctx = {}, notch = "double" }) {
  const r = shrink(box, inset);
  const cells = [];
  for (const [x, z] of wallCells(r, notch)) {
    for (let y = y0; y <= y1; y++) cells.push([x, y, z, ...wallBlock(x, y, z, r, ctx)]);
  }
  return paint(g, cells);
}

// The (2,2) nose of each corner, through each band, as an ochre_froglight column (stepping out with the band).
export function cornerStrip(g, { box, bands }) {
  const cells = [];
  for (const { inset = 0, y0, y1 } of bands) {
    const r = shrink(box, inset);
    const noses = [[r.x0 + 2, r.z0 + 2], [r.x1 - 2, r.z0 + 2], [r.x0 + 2, r.z1 - 2], [r.x1 - 2, r.z1 - 2]];
    for (let y = y0; y <= y1; y++) for (const [x, z] of noses) cells.push([x, y, z, "ochre_froglight", { axis: "y" }]);
  }
  return paint(g, cells);
}

// Scattered lit offices on the glass that faces `face` (exposed outside, hollow inside). Clumps are 2-4 wide and
// 1-2 rows high, ~density of the glass cells (doubled on south and east), 2 warm : 1 cool per clump, one froglight in
// the cell inside each glass cell it lights. Seeded and deterministic. box (optional) limits the footprint.
export function litClump(g, face, seed, density, box = null) {
  const out = DIRS[face], inward = DIRS[OPPOSITE[face]];
  const ns = face === "north" || face === "south";
  const inBox = (x, y, z) => !box || (x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1 && z >= box.z0 && z <= box.z1);
  const along = (p) => (ns ? p[0] : p[2]);
  const cand = [...g].filter((c) => {
    const [x, y, z] = c.pos;
    const i = [x + inward[0], y, z + inward[2]];
    return GLASS.has(c.block) && inBox(x, y, z) && g.isAir(x + out[0], y, z + out[2]) && inBox(...i) && g.inBounds(...i) && g.isAir(...i);
  }).sort((p, q) => p.pos[1] - q.pos[1] || along(p.pos) - along(q.pos));
  const at = new Map(cand.map((c) => [c.pos.join(","), c.pos]));
  const rnd = mulberry32(seed);
  const target = Math.round(density * (face === "south" || face === "east" ? 2 : 1) * cand.length);
  const done = new Set(), cells = [];
  for (let tries = 0; cand.length && done.size < target && tries < 10000; tries++) {
    const [x, y, z] = cand[Math.floor(rnd() * cand.length)].pos;
    const w = 2 + Math.floor(rnd() * 3), h = 1 + Math.floor(rnd() * 2);
    const block = rnd() < 2 / 3 ? "ochre_froglight" : "pearlescent_froglight";
    for (let dy = 0; dy < h; dy++) for (let da = 0; da < w; da++) {
      const p = ns ? [x + da, y + dy, z] : [x, y + dy, z + da];
      const k = p.join(",");
      if (!at.has(k) || done.has(k)) continue;
      done.add(k);
      cells.push([p[0] + inward[0], p[1], p[2] + inward[2], block, { axis: "y" }]);
    }
  }
  return paint(g, cells);
}

// Mulberry32: a small seeded PRNG, so the same seed gives the same clumps.
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

// A row of shroomlight at height y, from..to along the face, one cell in front of the wall plane at `wall`.
export function uplightRow(g, face, from, to, y, wall) {
  const ns = face === "north" || face === "south";
  const d = DIRS[face];
  const fixed = wall + (ns ? d[2] : d[0]);
  const cells = [];
  for (let a = from; a <= to; a++) cells.push(ns ? [a, y, fixed, "shroomlight"] : [fixed, y, a, "shroomlight"]);
  return paint(g, cells);
}

// The mall facade on the wall plane `wall` between from..to, up to height top: y2 polished_andesite plinth, polished
// diorite piers 2 wide every 8 (absolute x or z), shopfront glass y3..10 with a smooth_quartz fascia y11..12, then
// storeys of 11 from y13: smooth_stone spandrel 3 courses, light_blue glass 8 courses.
export function mallFacade(g, face, { from, to, wall, top }) {
  if (top == null) throw new Error("mallFacade: range.top is required");
  const ns = face === "north" || face === "south";
  const cells = [];
  for (let a = from; a <= to; a++) {
    const pier = a % 8 < 2;
    for (let y = 2; y <= top; y++) {
      let block;
      if (y === 2) block = "polished_andesite";
      else if (pier) block = "polished_diorite";
      else if (y <= 10) block = "glass";
      else if (y <= 12) block = "smooth_quartz";
      else block = (y - 13) % 11 <= 2 ? "smooth_stone" : "light_blue_stained_glass";
      cells.push(ns ? [a, y, wall, block] : [wall, y, a, block]);
    }
  }
  return paint(g, cells);
}

// The entrance ramp: a bottom smooth_stone_slab at depth `slab`, a full-block landing at depth `landing`, both at y,
// from..to along the face. Depth is z for north and south faces, x for east and west.
export function slabRamp(g, { face, from, to, y, slab, landing, block = "smooth_stone" }) {
  const ns = face === "north" || face === "south";
  const at = (a, depth) => (ns ? [a, y, depth] : [depth, y, a]);
  const cells = [];
  for (let a = from; a <= to; a++) {
    cells.push([...at(a, slab), "smooth_stone_slab", { type: "bottom" }]);
    cells.push([...at(a, landing), block]);
  }
  return paint(g, cells);
}

// A lamp post: cobblestone_wall twice, a standing lantern on top. Writes its own three cells only.
export function lampPost(g, x, y, z) {
  return paint(g, [
    [x, y, z, "cobblestone_wall", { up: "true" }],
    [x, y + 1, z, "cobblestone_wall", { up: "true" }],
    [x, y + 2, z, "lantern", { hanging: "false" }],
  ]);
}

// A spire section at (x, z), size x size cells, y0..y1. kind: iron_block, light_gray_concrete, iron_bars, end_rod or
// lightning_rod (rods face up). Lower spire is iron_block size 2; upper is size 1.
export function spireSection(g, { x, z, y0, y1, kind, size = 1 }) {
  const KIND = {
    iron_block: ["iron_block"], light_gray_concrete: ["light_gray_concrete"], iron_bars: ["iron_bars"],
    end_rod: ["end_rod", { facing: "up" }], lightning_rod: ["lightning_rod", { facing: "up" }],
  };
  const [block, state] = KIND[kind] ?? [];
  if (!block) throw new Error(`spireSection: unknown kind ${kind}`);
  const cells = [];
  for (let y = y0; y <= y1; y++) for (let dx = 0; dx < size; dx++) for (let dz = 0; dz < size; dz++) {
    cells.push([x + dx, y, z + dz, block, state]);
  }
  return paint(g, cells);
}

// Iron bars around the perimeter of box at height y, each joined to its ring neighbours.
export function deckRail(g, box, y) {
  const ring = (x, z) => x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1
    && (x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1);
  const cells = [];
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (!ring(x, z)) continue;
    cells.push([x, y, z, "iron_bars", { north: ring(x, z - 1), east: ring(x + 1, z), south: ring(x, z + 1), west: ring(x - 1, z) }]);
  }
  return paint(g, cells);
}
