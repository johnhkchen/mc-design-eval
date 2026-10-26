// FR245184606: a commercial block of pale limestone on the Île de la Cité, its lidar roofs snapped to three tiers: one-storey
// shop wings (6 blocks), two-storey middle blocks (11) and three-storey tower ends under a deepslate attic (17). Storeys are
// 5 blocks: a plinth or a sign band, then the window rows (2 glass to 1 pier) with a sill below and a lintel above, then a
// string course. Each window has a one-block air pocket behind it, carved inside the footprint, and every fourth lower
// window is lit with a glowstone. The shop-sign band tops the ground floor, and the door is on the east face at mid-length.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184606.cells.json`, "utf8"));

const X = 16, Y = 33, Z = 51;
const tierOf = (r) => (r <= 7 ? 6 : r <= 12 ? 11 : 17);

const lidar = new Map(), fp = new Map();                    // "x,z" -> lidar roof; "x,z" -> { g, T }
for (const [x, z, g, r] of cells) { lidar.set(`${x},${z}`, r); fp.set(`${x},${z}`, { g, T: 0 }); }
const at = (x, z) => fp.get(`${x},${z}`);
const solid = (x, z, y) => { const c = at(x, z); return !!c && y < c.T; };   // every column is solid from y 0 up to its roof
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposedAt = (x, z, y) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], z + DIRS[d][1], y));

// Smooth the lidar: 3x3 median, then snap to a tier (kills the noisy edge cells and the stepped roof).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = lidar.get(`${x + dx},${z + dz}`); if (r !== undefined) vals.push(r); }
  vals.sort((a, b) => a - b);
  c.T = tierOf(vals[Math.floor(vals.length / 2)]);
}

const WALL = "calcite", PLINTH = "stone_bricks", STRING = "smooth_stone", SILL = "polished_andesite", LINTEL = "polished_andesite";
const SIGN = "dark_oak_planks", CORNICE = "stone_bricks", ATTIC = "deepslate_tiles", GLASS = "glass", FLAT = "smooth_stone";
const LIGHT = "glowstone", CHIMNEY = "bricks", LOWER_WINDOW = new Set([1, 7, 12]);

// The facade at height y on a cell whose exposed face has its own index idx along the wall (x for north/south, z for east/west).
function facadeBlock(y, T, idx) {
  if (y === T - 1) return { block: T === 17 ? ATTIC : CORNICE, window: false };
  if (y === 0) return { block: PLINTH, window: false };
  if (y === 4) return { block: SIGN, window: false };
  if (y === 5 || y === 10) return { block: STRING, window: false };
  if (y === 6 || y === 11) return { block: SILL, window: false };
  if (y === 9 || y === 14) return { block: LINTEL, window: false };
  if (idx % 3 === 0) return { block: y >= 15 ? ATTIC : WALL, window: false };   // a pier every third cell
  return { block: GLASS, window: true };
}

const g = new Voxels([X, Y, Z]);

// The massing: each column solid from y 0 up to its roof, the plinth's stone where the ground is raised.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.T; y++) g.set(x, y, z, y < c.g ? PLINTH : WALL);
}

// The entrance: a door in a ground-floor window bay on the east face, nearest the middle of the face's length.
let entrance = null;
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.T < 6 || z % 3 !== 1 || !exposedAt(x, z, 1).includes("east")) continue;
  if (!entrance || Math.abs(z - 25) < Math.abs(entrance.z - 25)) entrance = { x, z, g: c.g };
}

// The facades: every cell with a face to the open air (or to a lower roof) at a height gets that storey's element there.
// A window's glass gets a pocket of air behind it in the next cell in, at the window rows only, so the floors stay whole.
let windowCount = 0;
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = c.g; y < c.T; y++) {
    const faces = exposedAt(x, z, y);
    if (!faces.length) continue;
    const d = faces[0], idx = d === "north" || d === "south" ? x : z;
    const f = facadeBlock(y, c.T, idx);
    g.set(x, y, z, f.block);
    if (!f.window || y >= 15) continue;
    const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;                 // the cell inward of this face
    if (!solid(ix, iz, y) || exposedAt(ix, iz, y).length) continue;     // a wing one cell thick has no room behind
    if (LOWER_WINDOW.has(y) && windowCount++ % 4 === 0) g.set(ix, y, iz, LIGHT);
    else g.set(ix, y, iz, "air");
  }
}

// The door: a dark oak door on the east face, lintel above, both halves in the glass bay.
if (entrance) {
  const { x, z, g: lo } = entrance;
  const st = { facing: "east", hinge: "left", open: "false", powered: "false" };
  g.set(x, lo, z, "dark_oak_door", { ...st, half: "lower" });
  g.set(x, lo + 1, z, "dark_oak_door", { ...st, half: "upper" });
  g.set(x, lo + 2, z, WALL);
}

// The roofs: the open top of each block is flat stone (the attic is deepslate), with a few brick chimneys on the lower blocks.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (exposedAt(x, z, c.T - 1).length) continue;                        // the perimeter's cornice or attic is already set
  g.set(x, c.T - 1, z, c.T === 17 ? ATTIC : FLAT);
  if (c.T < 17 && (x * 5 + z * 7) % 19 === 0) { g.set(x, c.T, z, CHIMNEY); g.set(x, c.T + 1, z, CHIMNEY); }
}

g.save(`${DIR}/FR245184606.nbt`);
