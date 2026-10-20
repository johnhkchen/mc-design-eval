// Grand Hyatt (plot 2): podium with banded skin, tower slab and stepped ends, crown band and penthouse with aircraft
// lights, lit lobby on the south face, porte-cochere, west wing, north glass pavilion, SE garden wall.
// Each mass is a solid core with a one-layer skin: the skin is banded per storey (spandrel + glass with cut-sandstone
// mullions every 4), a warm/cool backing sits one cell inside each glass bay. Writes go through a Map so later
// overrides in this file win; only plot-2 cells on the site footprint (#) are touched.
import { readFileSync } from "node:fs";
import { aircraft_light } from "../vocab.mjs";
import { CUT_SANDSTONE, DARK_BACKING, GRANITE, PALE_QUARTZ, PAVING, ROOF_LIGHT, RIM_GLASS, SANDSTONE, WARM_LIGHT, COOL_LIGHT, LOBBY_GLASS } from "../vocab/base.mjs";

const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8"));
const plot = site.plots.find((p) => p.x0 === 391);
const ROWS = plot.footprint, GROUND = plot.ground, CELL = plot.cell;

function cellOf(x, z) {
  const c = Math.floor((x - plot.x0) / CELL), r = Math.floor((z - plot.z0) / CELL);
  return r < 0 || c < 0 || r >= ROWS.length || c >= ROWS[r].length ? null : [r, c];
}
const onSite = (x, z) => { const rc = cellOf(x, z); return !!rc && ROWS[rc[0]][rc[1]] === "#"; };
const groundAt = (x, z) => { const rc = cellOf(x, z); return rc ? GROUND[rc[0]][rc[1]] : 0; };

// Deterministic 0..1 roll per cell: which windows are lit (scattered, not clustered).
function roll(x, y, z) {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) % 10000 / 10000;
}
const backingFor = (x, y, z) => { const r = roll(x, y, z); return r < 0.25 ? WARM_LIGHT : r < 0.3 ? COOL_LIGHT : DARK_BACKING; };

const inMass = (m, x, y, z) => x >= m.x0 && x <= m.x1 && y >= m.y0 && y <= m.y1 && z >= m.z0 && z <= m.z1 && onSite(x, z);

// Horizontal neighbours of a cell that are outside the mass: the exposed faces.
function exposed(m, x, y, z) {
  const out = [];
  if (!inMass(m, x - 1, y, z)) out.push([-1, 0]);
  if (!inMass(m, x + 1, y, z)) out.push([1, 0]);
  if (!inMass(m, x, y, z - 1)) out.push([0, -1]);
  if (!inMass(m, x, y, z + 1)) out.push([0, 1]);
  return out;
}

const cells = new Map();
const put = (x, y, z, b) => cells.set(`${x},${y},${z}`, [x, y, z, b]);

// Skin + solid core for one mass. o.base = first storey row (bands every 5 from it); o.glass null = no windows.
function skin(m, o = {}) {
  const base = o.base ?? m.y0;
  const glass = o.glass === undefined ? "gray_stained_glass" : o.glass;
  const bands = o.bands !== false;
  for (let x = m.x0; x <= m.x1; x++) for (let z = m.z0; z <= m.z1; z++) {
    if (!onSite(x, z)) continue;
    for (let y = Math.max(m.y0, groundAt(x, z)); y <= m.y1; y++) {
      const dirs = exposed(m, x, y, z);
      let b = SANDSTONE;
      let inward = null;
      if (y === m.y1) b = o.cap ?? PALE_QUARTZ;
      else if (y < base) b = GRANITE;
      else if (dirs.length) {
        const d = dirs.find((q) => q[0] !== 0) ?? dirs[0];
        const along = d[0] !== 0 ? z : x;
        const r = bands ? ((y - base) % 5 + 5) % 5 : 0;
        if (!glass || r < 2) b = SANDSTONE;
        else if (along % 4 === 0) b = CUT_SANDSTONE;
        else { b = glass; inward = [x - d[0], y, z - d[1]]; }
      }
      put(x, y, z, b);
      if (inward && inMass(m, ...inward)) put(...inward, backingFor(x, y, z));
    }
  }
}

// Sea lantern on the deck's top row, every 12 blocks (interior cells only).
function deckLights(m) {
  for (let x = m.x0; x <= m.x1; x++) for (let z = m.z0; z <= m.z1; z++) {
    if (!inMass(m, x, m.y1, z) || exposed(m, x, m.y1, z).length) continue;
    if (x % 12 === 0 && z % 12 === 0) put(x, m.y1, z, ROOF_LIGHT);
  }
}

const PODIUM = { x0: 403, x1: 554, y0: 0, y1: 24, z0: 16, z1: 100 };
const WING = { x0: 391, x1: 402, y0: 3, y1: 14, z0: 44, z1: 67 };
const PAVILION = { x0: 455, x1: 514, y0: 0, y1: 9, z0: 0, z1: 7 };
const SE_WALL = { x0: 555, x1: 566, y0: 0, y1: 10, z0: 16, z1: 115 };
const STEPS = [
  { x0: 418, x1: 429, y0: 25, y1: 103, z0: 48, z1: 70 },
  { x0: 408, x1: 417, y0: 25, y1: 87, z0: 52, z1: 66 },
  { x0: 531, x1: 542, y0: 25, y1: 103, z0: 48, z1: 70 },
  { x0: 543, x1: 552, y0: 25, y1: 87, z0: 52, z1: 66 },
];
const TOWER = { x0: 430, x1: 530, y0: 25, y1: 111, z0: 46, z1: 72 };
const CROWN = { x0: 430, x1: 530, y0: 112, y1: 118, z0: 46, z1: 72 };
const PENTHOUSE = { x0: 460, x1: 500, y0: 119, y1: 123, z0: 52, z1: 66 };
const CANOPY = { x0: 450, x1: 510, y0: 14, y1: 16, z0: 101, z1: 112 };

export function build(g) {
  // Podium: base course, banded storeys, pale cornice on its deck (y 24), parapet 25 on the edge.
  skin(PODIUM, { base: 5 });
  for (let x = PODIUM.x0; x <= PODIUM.x1; x++) for (let z = PODIUM.z0; z <= PODIUM.z1; z++) {
    if (inMass(PODIUM, x, 24, z) && exposed(PODIUM, x, 24, z).length) put(x, 25, z, SANDSTONE);
  }
  deckLights(PODIUM);

  // West wing (ballroom), door in its west face at z 54..57.
  skin(WING, { base: 3 });
  deckLights(WING);
  for (let z = 54; z <= 57; z++) for (let y = 3; y <= 6; y++) for (const x of [391, 392]) put(x, y, z, "air");

  // North glass pavilion (garden entry).
  skin(PAVILION, { base: 0, glass: LOBBY_GLASS });
  deckLights(PAVILION);

  // SE garden wall: a solid low wall, planters left for the garden part.
  skin(SE_WALL, { bands: false, glass: null });
  deckLights(SE_WALL);

  // Stepped ends, then the tower slab over the podium deck.
  for (const s of STEPS) { skin(s, { base: 25 }); deckLights(s); }
  skin(TOWER, { base: 25 });

  // Crown band: lit rim (glass over sea lantern, 2 rows) on every face, sandstone sign band above, cornice on top.
  skin(CROWN, { bands: false, glass: null });
  for (let x = CROWN.x0; x <= CROWN.x1; x++) for (let z = CROWN.z0; z <= CROWN.z1; z++) {
    if (!onSite(x, z)) continue;
    const edge = Math.min(x - CROWN.x0, CROWN.x1 - x, z - CROWN.z0, CROWN.z1 - z);
    if (edge > 1) continue;
    for (const y of [113, 114]) put(x, y, z, edge === 0 ? RIM_GLASS : ROOF_LIGHT);
  }

  // Penthouse plant room.
  skin(PENTHOUSE, { bands: false, glass: null });

  // Lit lobby on the south face (z 100): glass with sandstone piers every 4, warm ceiling at y 14, doors open.
  for (let x = 440; x <= 520; x++) {
    for (let z = 92; z <= 99; z++) for (let y = 5; y <= 13; y++) put(x, y, z, "air");
    for (let z = 92; z <= 99; z++) put(x, 14, z, WARM_LIGHT);
    for (let y = 5; y <= 13; y++) put(x, y, 100, x % 4 === 0 ? SANDSTONE : LOBBY_GLASS);
    put(x, 14, 100, WARM_LIGHT);
  }
  for (let x = 476; x <= 484; x++) for (let y = 5; y <= 7; y++) put(x, y, 100, "air");

  // Porte-cochere: 3-thick pale canopy on four 3x3 piers, sea-lantern soffit; paved forecourt.
  for (let x = CANOPY.x0; x <= CANOPY.x1; x++) for (let z = CANOPY.z0; z <= CANOPY.z1; z++) {
    if (!onSite(x, z)) continue;
    for (let y = CANOPY.y0; y <= CANOPY.y1; y++) put(x, y, z, PALE_QUARTZ);
    put(x, 14, z, x % 6 === 0 && z % 6 === 0 ? ROOF_LIGHT : "smooth_stone");
  }
  for (const px of [451, 507]) for (const pz of [101, 109]) {
    for (let x = px; x < px + 3; x++) for (let z = pz; z < pz + 3; z++) for (let y = 5; y <= 13; y++) put(x, y, z, PALE_QUARTZ);
  }
  for (let x = 440; x <= 520; x++) for (let z = 101; z <= 115; z++) {
    if (onSite(x, z)) put(x, groundAt(x, z) - 1, z, z % 8 === 0 ? PAVING : "smooth_stone");
  }

  for (const [x, y, z, b] of cells.values()) g.set(x, y, z, b);

  // Penthouse aircraft lights on its four corners, floodlights on the crown corners.
  for (const [x, z] of [[460, 52], [500, 52], [460, 66], [500, 66]]) aircraft_light(g, x, 124, z);
  for (const [x, z] of [[432, 48], [528, 48], [432, 70], [528, 70]]) g.set(x, 119, z, "end_rod", { facing: "up" });
}
