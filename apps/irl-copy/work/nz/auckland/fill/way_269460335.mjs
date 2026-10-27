// way 269460335: The Project TV Studio, Auckland (Mt Eden view). A 1990s-era, three-storey studio block
// on a sloping site: a concrete main body on a stone plinth, with a brick two-storey wing and a brick
// single-storey hall to the south, the wings stepping down the slope. Storeys are 4 blocks (floor lines
// at y 4 and 8), the body's roof is 11 with a 12-block parapet. Tinted glass in bays with white piers
// and head bands, a glazed studio foyer at street level with a dark-oak door under a stone lintel, and
// warm lights standing on the floor behind some windows. A rooftop mast on the body and a plant box on
// the wing. The shell is one block thick, the interior is air with a floor slab per storey.
// Tiers come from the lidar roof (r >= 10 body, 7-9 wing, <= 6 hall), mode-smoothed over 3x3.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269460335.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269460335.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const FACING = { E: "east", W: "west", N: "north", S: "south" };

const TOP = { 3: 11, 2: 8, 1: 6 };                 // body, wing, hall: top surface (parapet sits one above)
const FLOORS = { 3: [4, 8], 2: [4], 1: [] };       // storey string-course rows per tier

// ---- footprint ------------------------------------------------------------------------------------
const at = new Map();
for (const [x, z, g, r] of cells) at.set(K(x, z), { x, z, g, r });
const cs = [...at.values()];
const tierRaw = (c) => (c.r >= 10 ? 3 : c.r >= 7 ? 2 : 1);
for (const c of cs) {
  const votes = [0, 0, 0, 0];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at.get(K(c.x + dx, c.z + dz)); if (n) votes[tierRaw(n)]++;
  }
  let best = tierRaw(c);                            // a neighbourhood majority wins; ties keep the cell's own tier
  for (const t of [1, 2, 3]) if (votes[t] > votes[best]) best = t;
  c.tier = best;
  c.base = Math.max(c.g, 1);                        // y 0 is the lowest ground; every cell is solid from y 0 up to its base
  c.top = Math.max(TOP[best], c.base + 3);
  c.fl = FLOORS[best].filter((y) => y > c.base && y < c.top);
}
const inF = (x, z) => at.has(K(x, z));
const topOf = (x, z) => at.get(K(x, z))?.top ?? -1;

// Which sides of a cell face open air at row y: off the footprint, or a lower neighbouring tier.
const openSides = (c, y) => Object.keys(DIRS).filter((d) => {
  const n = at.get(K(c.x + DIRS[d][0], c.z + DIRS[d][1]));
  return !n || y >= n.top;
});
// The shell is a column of blocks from base to top wherever a side is open (one block thick).
const isShell = (c, y) => openSides(c, y).length > 0;

function storey(c, y) {
  const b = [c.base, ...c.fl, c.top];
  let s = 0; while (y >= b[s + 1]) s++;
  return { a: b[s], e: b[s + 1], ground: s === 0, last: s === b.length - 2 };
}
// a pier stands at each facade's bay line (every 4th block along the wall), and at every corner
const isPier = (c, sides) => sides.length >= 2 || ((sides[0] === "E" || sides[0] === "W" ? c.z : c.x) % 4 === 0);

// ---- entrance: a door at street level on the lowest single-facing wall cell, nearest the middle ----
const cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cz = cs.reduce((s, c) => s + c.z, 0) / cs.length;
let door = null;
for (const c of cs) {
  const sides = openSides(c, c.base);
  if (sides.length !== 1 || isPier(c, sides)) continue;
  const st = storey(c, c.base);
  if (c.base + 2 >= st.e) continue;                 // the door and its lintel fit in the ground storey
  const score = [c.base, Math.hypot(c.x - cx, c.z - cz)];
  if (!door || score[0] < door.score[0] || (score[0] === door.score[0] && score[1] < door.score[1])) door = { c, side: sides[0], score };
}
const doorKey = door ? K(door.c.x, door.c.z) : null;

// ---- the volume --------------------------------------------------------------------------------------
let maxY = 0; for (const c of cs) maxY = Math.max(maxY, c.top);
const MAST_H = 5;                                   // rooftop mast above the body roof
const Yh = Math.max(maxY + 1 + MAST_H + 1, 18);
const g = new Voxels([28, Yh, 60]);

const NO_PANE = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
function paneState(side) {
  const ns = side === "E" || side === "W";           // a pane runs along the wall, so it joins its neighbours that way
  return { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" };
}

for (const c of cs) {
  const wing = c.tier < 3;
  const wall = wing ? "bricks" : "light_gray_concrete";
  const perimeter = openSides(c, -1).length > 0;     // any side off the footprint
  // foundation: solid from y 0 up to the cell's base (stone bricks on the outside faces)
  for (let y = 0; y < c.base; y++) g.set(c.x, y, c.z, perimeter ? "stone_bricks" : "stone");
  for (let y = c.base; y <= c.top; y++) {
    if (y === c.top) {
      if (isShell(c, c.top - 1)) g.set(c.x, y, c.z, "white_concrete");       // parapet: the roof's edge and the faces above a lower tier
      continue;
    }
    if (!isShell(c, y)) {
      // interior: a floor slab at the base and at each storey line, the roof deck on top, air between
      if (y === c.base || c.fl.includes(y)) g.set(c.x, y, c.z, "smooth_stone");
      else if (y === c.top - 1) g.set(c.x, y, c.z, "gray_concrete");
      continue;
    }
    const sides = openSides(c, y);
    const { a, e, ground, last } = storey(c, y);
    if (y === c.base) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                // plinth course
    if (y === a) { g.set(c.x, y, c.z, "smooth_stone"); continue; }                     // storey string course
    if (last && y === c.top - 1) { g.set(c.x, y, c.z, "smooth_stone"); continue; }    // cornice
    if (!ground && !last && y === e - 1) { g.set(c.x, y, c.z, "white_concrete"); continue; }  // head band
    if (isPier(c, sides)) { g.set(c.x, y, c.z, wall); continue; }
    if (K(c.x, c.z) === doorKey && (y === c.base + 1)) {                                // door upper half
      g.set(c.x, y, c.z, "dark_oak_door", { facing: FACING[door.side], half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (K(c.x, c.z) === doorKey && (y === c.base + 2)) { g.set(c.x, y, c.z, "smooth_stone"); continue; }   // lintel
    g.set(c.x, y, c.z, ground ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", paneState(sides[0]));
  }
}
// door lower half, after the loop so it wins over the plinth
if (door) g.set(door.c.x, door.c.base, door.c.z, "dark_oak_door", { facing: FACING[door.side], half: "lower", hinge: "left", open: "false", powered: "false" });

// Warm lights standing on the floor just behind some windows (the first glass row of each storey).
// The glass cell's inward neighbour is air, so each light stands on the storey's floor slab.
let lights = 0;
for (const c of cs) {
  if (c.top <= c.base + 2) continue;
  for (let y = c.base + 1; y < c.top - 1; y++) {
    if (!isShell(c, y)) continue;
    const { a } = storey(c, y);
    if (y !== a + 1) continue;
    const sides = openSides(c, y);
    if (sides.length !== 1 || isPier(c, sides)) continue;
    if (K(c.x, c.z) === doorKey) continue;
    const pos = (c.x * 7 + c.z * 3) % 8;           // spread them across the facade
    if (pos !== 2 && pos !== 6) continue;
    const d = DIRS[sides[0]];
    const ix = c.x - d[0], iz = c.z - d[1];         // inward = opposite the open side
    const inner = at.get(K(ix, iz));
    if (!inner || isShell(inner, y) || y === inner.base || inner.fl.includes(y) || y >= inner.top - 1) continue;
    if (pos === 2) g.set(ix, y, iz, "glowstone");
    else g.set(ix, y, iz, "shroomlight");
    lights++;
  }
}
// a standing lantern just inside the door, on the ground floor slab
if (door) {
  const d = DIRS[door.side];
  const ix = door.c.x - d[0], iz = door.c.z - d[1];
  const inner = at.get(K(ix, iz));
  if (inner && !isShell(inner, door.c.base + 1)) g.set(ix, door.c.base + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant on the wing: a 4 x 2 plant box on its deck, inside the wing's footprint, nearest its middle.
const wing = cs.filter((c) => c.tier === 2);
if (wing.length) {
  const wx = wing.reduce((s, c) => s + c.x, 0) / wing.length, wz = wing.reduce((s, c) => s + c.z, 0) / wing.length;
  let best = null;
  for (const c of wing) {
    let ok = true;
    for (let dx = 0; dx < 4 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) {
      const n = at.get(K(c.x + dx, c.z + dz));
      if (!n || n.tier !== 2 || openSides(n, -1).length) ok = false;
    }
    if (!ok) continue;
    const dist = Math.hypot(c.x + 2 - wx, c.z + 1 - wz);
    if (!best || dist < best.dist) best = { c, dist };
  }
  if (best) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    const n = at.get(K(best.c.x + dx, best.c.z + dz));
    g.set(n.x, n.top, n.z, "gray_concrete");
    g.set(n.x, n.top + 1, n.z, "light_gray_concrete");
  }
}

// The broadcast mast on the body roof: a column of iron bars on the deck, a warm lamp at its head.
const body = cs.filter((c) => c.tier === 3);
if (body.length) {
  const bx = body.reduce((s, c) => s + c.x, 0) / body.length, bz = body.reduce((s, c) => s + c.z, 0) / body.length;
  let best = null;
  for (const c of body) {
    if (openSides(c, -1).length) continue;
    const dist = Math.hypot(c.x - bx, c.z - bz);
    if (!best || dist < best.dist) best = { c, dist };
  }
  if (best) {
    for (let y = best.c.top; y < best.c.top + MAST_H; y++) g.set(best.c.x, y, best.c.z, "iron_bars", NO_PANE);
    g.set(best.c.x, best.c.top + MAST_H, best.c.z, "redstone_lamp", { lit: "true" });
  }
}

const info = g.save(OUT);
console.log(JSON.stringify({ cells: cs.length, lights, door: door ? { x: door.c.x, z: door.c.z, side: door.side, base: door.c.base } : null, size: g.size, ...info }));
