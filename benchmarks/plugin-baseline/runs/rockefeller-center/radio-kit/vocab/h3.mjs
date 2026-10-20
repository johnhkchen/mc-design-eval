// Exterior helpers for the Radio City block (plan.md VOCABULARY): pier_wall, crown_lantern, marquee_end, roundel,
// shopfront_bay, skylight_strip, roof_lights, lamp_stub.
//
// Every helper takes its position as arguments and writes only its own footprint, and only into air. A cell that
// holds something else is skipped (and counted) unless the caller lists that block in `over`, the option for
// facade work that sits in a solid body. Ground and floor are never replaced unless listed in `over`.
// Each helper returns { placed, skipped, box }: `box` is the footprint [x0, y0, z0, x1, y1, z1] it may write.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = "minecraft:air";
const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const mod = (n, k) => ((n % k) + k) % k;

// +1 for a face that looks east or south, -1 for west or north
const outward = (f) => DIRS[f][0] + DIRS[f][2];
// 0 when the face plane is x (east, west faces), 2 when it is z (north, south faces)
const axisOf = (f) => (f === "west" || f === "east" ? 0 : 2);
// a cell on a face: `plane` is the coordinate across the wall, `along` runs along it, `y` is height
const onFace = (f, plane, along, y) => (axisOf(f) === 0 ? [plane, y, along] : [along, y, plane]);

function bounds(cells) {
  const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]), zs = cells.map((c) => c[2]);
  return [Math.min(...xs), Math.min(...ys), Math.min(...zs), Math.max(...xs), Math.max(...ys), Math.max(...zs)];
}

// Write planned cells [x, y, z, block, state?]: air or an `over` block only. A later entry for a cell wins.
function commit(g, cells, over = [], box = null) {
  const allow = new Set(over.map(id));
  const byCell = new Map();
  for (const [x, y, z, block, state] of cells) byCell.set(`${x},${y},${z}`, [x, y, z, block, state]);
  let placed = 0, skipped = 0;
  for (const [x, y, z, block, state] of byCell.values()) {
    const cur = g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
    if (cur === null || (cur !== AIR && !allow.has(cur))) { skipped++; continue; }
    if (id(block) === AIR && cur === AIR) continue;
    g.set(x, y, z, block, state);
    placed++;
  }
  return { placed, skipped, box: box ?? bounds(cells) };
}

/**
 * Piers in the face plane with recessed window strips between them. o: { face, at, from, to, y0, y1, phase = 0,
 * pierEvery = 3, corners = "double", over = [] }. `at` is the face plane, `from`..`to` the run along it. Piers
 * every `pierEvery` from `from`, double at both ends. Between piers the face plane is carved to air and the strip
 * sits one behind it: glass where (y - phase) % 3 is 0 or 1, polished_deepslate spandrel where it is 2.
 */
export function pier_wall(g, { face, at, from, to, y0, y1, phase = 0, pierEvery = 3, corners = "double", over = [] }) {
  const inner = at - outward(face);
  const doubles = corners === "double" ? [from, from + 1, to - 1, to] : [];
  const cells = [];
  for (let a = from; a <= to; a++) {
    const pier = mod(a - from, pierEvery) === 0 || doubles.includes(a);
    for (let y = y0; y <= y1; y++) {
      if (pier) cells.push([...onFace(face, at, a, y), "smooth_sandstone"]);
      else {
        cells.push([...onFace(face, at, a, y), "air"]);
        cells.push([...onFace(face, inner, a, y), mod(y - phase, 3) === 2 ? "polished_deepslate" : "gray_stained_glass"]);
      }
    }
  }
  return commit(g, cells, over);
}

/**
 * Crown lantern: a 4 x 3 x 4 box whose min corner is (x, y, z). Skin light_gray_stained_glass, core sea_lantern
 * (the middle layer, inside the skin), and a lightning_rod mast on top at (x + 1, z + 1) from y + 3 to y + 6.
 * Plan spot: x 13, y 112, z 25.
 */
export function crown_lantern(g, { x, y, z, over = [] }) {
  const cells = [];
  for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 3; dy++) for (let dz = 0; dz < 4; dz++) {
    const core = dx > 0 && dx < 3 && dz > 0 && dz < 3 && dy === 1;
    cells.push([x + dx, y + dy, z + dz, core ? "sea_lantern" : "light_gray_stained_glass"]);
  }
  for (let dy = 3; dy <= 6; dy++) cells.push([x + 1, y + dy, z + 1, "lightning_rod", { facing: "up", powered: "false" }]);
  return commit(g, cells, over);
}

/**
 * Marquee end cheek: iron_block, a column of `height` cells (plan: 5, y6..10) from cell = [x, y, z] upward.
 */
export function marquee_end(g, [x, y, z], { height = 5, over = [] } = {}) {
  const cells = [];
  for (let k = 0; k < height; k++) cells.push([x, y + k, z, "iron_block"]);
  return commit(g, cells, over);
}

const FIGURE = ["yellow", "white", "orange", "light_blue", "purple", "lime"];

/**
 * Round enamel roundel: a disc of `dominant` terracotta of radius r (3 gives 7 wide, 4 gives 9) in the face plane
 * through center = [x, y, z]. A ring and a cross of two other terracottas sit inside it. With rim, a
 * waxed_cut_copper rim runs round the disc edge, 1 proud on the outward side. face: the wall it sits on.
 */
export function roundel(g, { center: [cx, cy, cz], face, r = 3, dominant = "light_blue", rim = true, over = [] }) {
  const p = axisOf(face) === 0 ? cx : cz;
  const uc = axisOf(face) === 0 ? cz : cx;
  const at = (du, dv, plane) => onFace(face, plane, uc + du, cy + dv);
  const figure = FIGURE.filter((c) => c !== dominant);
  const inDisc = (du, dv) => du * du + dv * dv <= r * r;
  const cells = [];
  for (let du = -r; du <= r; du++) for (let dv = -r; dv <= r; dv++) {
    if (!inDisc(du, dv)) continue;
    const d2 = du * du + dv * dv;
    let block = `${dominant}_terracotta`;
    if (d2 >= (r - 1.5) ** 2 && d2 < (r - 0.5) ** 2) block = `${figure[0]}_terracotta`;
    else if ((du === 0 || dv === 0) && d2 < (r - 1.5) ** 2) block = `${figure[1]}_terracotta`;
    cells.push([...at(du, dv, p), block]);
  }
  if (rim) {
    for (let du = -r; du <= r; du++) for (let dv = -r; dv <= r; dv++) {
      if (!inDisc(du, dv)) continue;
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inDisc(du + a, dv + b));
      if (edge) cells.push([...at(du, dv, p + outward(face)), "waxed_cut_copper"]);
    }
  }
  return commit(g, cells, over);
}

/**
 * Shopfront bay, `w` cells along the run from `from`, on the glazing plane `at` (the shell carves it to air). A
 * waxed_cut_copper mullion on the first cell, glass on the rest, rows y0..y1. A shroomlight lobby ceiling sits on
 * row y1 just behind the glass, and a cut_sandstone fascia runs along row `fascia` on the glazing plane.
 */
export function shopfront_bay(g, { face, at, from, w = 3, y0 = 1, y1 = 5, fascia = 6, over = [] }) {
  const inner = at - outward(face);
  const cells = [];
  for (let a = from; a < from + w; a++) {
    for (let y = y0; y <= y1; y++) cells.push([...onFace(face, at, a, y), a === from ? "waxed_cut_copper" : "glass"]);
    cells.push([...onFace(face, inner, a, y1), "shroomlight"]);
    cells.push([...onFace(face, at, a, fascia), "cut_sandstone"]);
  }
  return commit(g, cells, over);
}

/**
 * Skylight strip in a deck: light_gray_stained_glass in the deck's top row y, glowstone under it at y - 1 (glow:
 * false to skip). Runs from x0 to x1, `depth` cells deep from z0. Plan: x 50..74, z 22 / 30 / 38, depth 2, y 31.
 */
export function skylight_strip(g, { x0, x1, z0, depth = 2, y, glow = true, over = [] }) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z < z0 + depth; z++) {
    cells.push([x, y, z, "light_gray_stained_glass"]);
    if (glow) cells.push([x, y - 1, z, "glowstone"]);
  }
  return commit(g, cells, over);
}

/**
 * Sea lanterns in a deck's top row. deck = { x0, x1, z0, z1, y }; one lantern every `every` cells on both axes,
 * counted from x0 and z0. The footprint is the whole deck top, and only lantern cells are written into air.
 */
export function roof_lights(g, { x0, x1, z0, z1, y }, every, { over = [] } = {}) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (mod(x - x0, every) === 0 && mod(z - z0, every) === 0) cells.push([x, y, z, "sea_lantern"]);
  }
  return commit(g, cells, over, [x0, y, z0, x1, y, z1]);
}

/**
 * Ground lamp: a 2-high polished_granite stub standing on walking level y (default 1), with a standing lantern on
 * top. One column only, so the rest of the walk stays clear. Writes only into air, so the ground course stays.
 */
export function lamp_stub(g, x, z, { y = 1, over = [] } = {}) {
  const [lantern, lanternState] = B.lantern(false);
  const cells = [[x, y, z, "polished_granite"], [x, y + 1, z, "polished_granite"], [x, y + 2, z, lantern, lanternState]];
  return commit(g, cells, over);
}
