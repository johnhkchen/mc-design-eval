import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1779 Massachusetts Ave NW: a masonry commercial-office block of the 1920s-30s. Brick walls, a limestone base,
// storey lines and cornice, a lower shopfront wing on the street (north) side with the entrance, a stepped set-back
// core rising two storeys above the main roof. The lidar roof tiers (4, 9, 12, 14) come from a 3x3 median of the
// raw roof heights, so the noise becomes clean flat tiers.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78291.cells.json`, "utf8"));

const W = 15, H = 26, D = 22;
const out = new Voxels([W, H, D]);

const BRICK = "bricks";
const STONE = "calcite";          // limestone bands, cornice, lintels
const BASE = "polished_granite";  // base course
const FOUND = "stone_bricks";     // foundation under the ground
const FLOOR = "smooth_stone";     // floor slabs and roof decks
const GLASS = "light_blue_stained_glass_pane";
const ROOFBOX = "light_gray_concrete";
const LIGHT_GLOW = "glowstone";
const LANTERN = "lantern";

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));
const groundOf = (x, z) => raw.get(key(x, z)).gr;

// ---- roof tiers: 3x3 median of the lidar roof, then clean storey-counted tiers ----
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const tier = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = raw.get(key(x + dx, z + dz)); if (c) v.push(c.roof); }
  const m = median(v);
  tier.set(k, m <= 5 ? 4 : m <= 10 ? 9 : m <= 12 ? 12 : 14);
}
const R_of = (x, z) => tier.get(key(x, z));

// Storey lines (absolute): floor slabs at 4 and 8 (and 11 under the main roof's cornice). Ground floor 0..3.
const LINES = [4, 8];
const DECK = [0, 4, 8, 11];

// blocks are kept in a map first so the glass panes can take their connections from their neighbours
const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

const DIRS = {
  N: { dx: 0, dz: -1, axis: "x" },
  S: { dx: 0, dz: 1, axis: "x" },
  W: { dx: -1, dz: 0, axis: "z" },
  E: { dx: 1, dz: 0, axis: "z" },
};

// the faces a cell shows to the outside (missing neighbour) or to a lower roof (set-back): each from the height it is exposed
const facesOf = (x, z, R, gr) => {
  const out = [];
  for (const [name, d] of Object.entries(DIRS)) {
    const nx = x + d.dx, nz = z + d.dz;
    if (!has(nx, nz)) out.push({ name, ...d, fromY: gr });
    else if (R_of(nx, nz) < R) out.push({ name, ...d, fromY: Math.max(gr, R_of(nx, nz)) });
  }
  return out;
};

// interior: a floor slab at each storey line and the roof deck; air between
const slabsOf = (gr, R) => new Set([gr, ...DECK, R - 1].filter((y) => y >= gr && y <= R - 1));

// the facade block at height y for a wall cell with the faces that are exposed at y
const facade = (x, y, z, faces, R, gr) => {
  if (y === R - 1) return { block: STONE };                                  // cornice / cap
  if (y === gr) return { block: BASE };                                      // base course at the ground
  if (faces.some((f) => f.fromY === y && y > gr)) return { block: STONE };   // the lower roof's edge
  if (LINES.includes(y)) return { block: STONE };                           // storey lines
  if (faces.length > 1) return { block: BRICK };                            // corner: solid
  const f = faces[0], b = f.axis === "x" ? x : z;
  if (b % 3 === 0) return { block: BRICK };                                 // piers between bays
  return { block: GLASS, face: f, b };                                      // glazed bay
};

const ENTRY = [7, 0];   // the entrance bay on the street (north) face

// ---- main pass: foundation, walls, interior floors, roof deck ----
const wallCells = [];
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const R = R_of(x, z), gr = groundOf(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  const faces = facesOf(x, z, R, gr);
  const slabs = slabsOf(gr, R);
  for (let y = gr; y < R; y++) {
    const active = faces.filter((f) => f.fromY <= y);
    if (active.length) {
      if (x === ENTRY[0] && z === ENTRY[1] && (y === 1 || y === 2)) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const m = facade(x, y, z, active, R, gr);
      if (m.face) wallCells.push({ x, y, z, ...m });
      else put(x, y, z, m.block);
    } else if (slabs.has(y)) put(x, y, z, FLOOR);
  }
}

// ---- glazing: warm lights behind some glass, lanterns in the shopfront ----
for (const w of wallCells) {
  const { x, y, z, face, b } = w;
  put(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  const ix = x - face.dx, iz = z - face.dz;                          // one cell inside, behind the glass
  if (!has(ix, iz) || at(ix, y, iz)) continue;                         // only into an empty interior cell
  const R = R_of(x, z), gr = groundOf(x, z);
  if (y === gr + 1 && b % 6 === 2) put(ix, y, iz, LANTERN, { hanging: "false", waterlogged: "false" });
  else if (y > gr + 1 && y < R - 1 && (b * 5 + y * 3) % 9 === 0) put(ix, y, iz, LIGHT_GLOW);
}

// ---- roof equipment: plant boxes on the main roof, a penthouse-like pair on the core ----
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const R = R_of(x, z);
  const inner = [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => has(x + dx, z + dz) && R_of(x + dx, z + dz) === R));
  if (!inner) continue;
  if (R === 12 && x % 4 === 1 && z % 4 === 2) {
    put(x, R, z, ROOFBOX);
    if (x % 8 === 1) put(x, R + 1, z, ROOFBOX);
  }
  if (R === 14 && x % 3 === 1 && z % 3 === 1) {
    put(x, R, z, ROOFBOX);
    if (x % 6 === 1 && z % 6 === 1) put(x, R + 1, z, ROOFBOX);
  }
}

// ---- panes take their connections from their neighbours (a run of glass joins; a lit gap does not) ----
const open = (b) => !!b && !/door|lantern|glowstone|air/.test(b.block);
for (const [k, e] of blocks) {
  if (e.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const n = at(x, y, z - 1), s = at(x, y, z + 1), w = at(x - 1, y, z), ea = at(x + 1, y, z);
  e.state = {
    north: String(open(n) && (n.block === GLASS || n.block === BRICK || n.block === STONE || n.block === BASE)),
    south: String(open(s) && (s.block === GLASS || s.block === BRICK || s.block === STONE || s.block === BASE)),
    west: String(open(w) && (w.block === GLASS || w.block === BRICK || w.block === STONE || w.block === BASE)),
    east: String(open(ea) && (ea.block === GLASS || ea.block === BRICK || ea.block === STONE || ea.block === BASE)),
    waterlogged: "false",
  };
}

for (const [k, e] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  out.set(x, y, z, e.block, e.state);
}
const { blocks: n, palette } = out.save(`${DIR}/DC78291.nbt`);
console.log(`DC78291.nbt: ${n} blocks, ${palette} palette entries`);
