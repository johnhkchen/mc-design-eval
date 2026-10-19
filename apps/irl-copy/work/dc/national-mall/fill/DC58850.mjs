// DC58850: a 1960s federal office block for public service, 400 E St SW, Washington DC 20024, as a 1.21.1 module.
// Era and materials: the Southwest waterfront was rebuilt in the 1950s-70s as precast-concrete federal offices, so the
// walls are light-grey concrete spandrels between buff stone piers with tinted glass in the bays, on a dark plinth.
// The lidar roof is smoothed (3x3 median over the footprint) and snapped to three storey tiers (3, 5 or 7 blocks above
// y 0), so the massing steps up from the 3-block wings to the 7-block core. A storey is 2 blocks (a window row and a
// spandrel row), and the rows are fixed to absolute y, so every tier's floor line lines up across the building.
// Every column is solid from y 0 up to its top, so nothing floats; the downhill side shows its extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58850.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58850.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Tiers: a wing of one or two storeys, a middle block, the 7-block core.
const tier = (h) => (h <= 3 ? 3 : h <= 5 ? 5 : 7);

// Per cell: built (at least 2 blocks of building above its ground), top (the tier), outward faces, shell or interior.
const P = new Map();
for (const c of F.values()) {
  const h = smooth.get(key(c.x, c.z));
  // A cell with lidar roof above its ground is building: at least one storey (two blocks: window row and cornice),
  // so a 1-block lidar bump still closes the wall instead of leaving a hole in the envelope.
  const built = h > c.g;
  const outs = DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));
  P.set(key(c.x, c.z), { ...c, h, built, top: built ? Math.max(c.g + 2, tier(h)) : 0, outs, shell: outs.length > 0 });
}
const plan = (x, z) => P.get(key(x, z));

// Palette
const PLINTH = "polished_andesite";   // plinth, base course, parapet
const SPANDREL = "light_gray_concrete"; // precast spandrels between the windows
const PIER = "smooth_sandstone";         // buff stone piers in the window bands
const GLASS = "gray_stained_glass_pane";
const FLOOR = "smooth_stone";          // floor slabs and the roof membrane
const CORNICE = "smooth_stone";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const UNIT = "iron_block";             // roof plant

const g = new Voxels([16, 10, 21]);

// Entrance: a shell cell on the east face at ground level in a building tier of 5 or more, so the door has a lintel
// above it. Take the one nearest the middle of that run.
// Prefer the east face, then a lintel (tier of 5), then ground level; among the best, the middle of the run.
const score = (c) => (c.outs.length === 1 && c.outs[0][0] === 1 ? 4 : 0) + (c.top >= 5 ? 2 : 0) + (c.g === 0 ? 1 : 0);
const entranceCands = [...P.values()].filter((c) => c.shell && c.built && c.g <= 1 && c.outs.length === 1 && c.top >= 3);
const bestScore = Math.max(...entranceCands.map(score));
const best = entranceCands.filter((c) => score(c) === bestScore).sort((a, b) => a.z - b.z);
const door = best[Math.floor(best.length / 2)] ?? null;

// Which face a shell cell sits on, and where its wall runs: an x-facing face runs along z, a z-facing one along x.
const wallAxis = (c) => (c.outs.length !== 1 ? null : c.outs[0][0] !== 0 ? "z" : "x");
const isPier = (c) => {
  if (c.outs.length !== 1) return true;                     // corners
  const i = wallAxis(c) === "z" ? c.z : c.x;
  return i % 3 === 0;                                       // a pier every third cell along the wall
};

for (const c of P.values()) {
  if (!c.built) {
    // Open ground of the footprint: foundation to its ground, paved on top.
    for (let y = 0; y < c.g - 1; y++) g.set(c.x, y, c.z, PLINTH);
    if (c.g > 0) g.set(c.x, c.g - 1, c.z, FLOOR);
    continue;
  }
  const T = c.top;
  for (let y = 0; y < T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, PLINTH); continue; }    // foundation under the cell's ground
    if (y === T - 1) { g.set(c.x, y, c.z, CORNICE); continue; } // cornice or roof membrane
    const windowRow = y % 2 === 1;
    if (!c.shell) { if (!windowRow) g.set(c.x, y, c.z, FLOOR); continue; } // interior: a slab per storey, air behind the glass
    if (y === c.g) { g.set(c.x, y, c.z, PLINTH); continue; }   // base course on the wall
    if (!windowRow) { g.set(c.x, y, c.z, SPANDREL); continue; }
    g.set(c.x, y, c.z, isPier(c) ? PIER : GLASS);
  }
  // Parapet on the core, and plant on the roof of its interior.
  if (c.shell && T === 7) g.set(c.x, 7, c.z, PLINTH);
  if (!c.shell && T === 7 && c.x % 4 === 1 && c.z % 4 === 1) g.set(c.x, 7, c.z, UNIT);
}

// Entrance: a dark oak door (two halves) in the east face, a stone canopy over it on three cells, and lanterns
// hanging from the canopy either side of the door.
if (door) {
  const { x, z } = door;
  g.set(x, 1, z, DOOR, { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, DOOR, { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dz of [-1, 0, 1]) {
    const n = plan(x, z + dz);
    if (!n || !n.built || !n.shell) continue;
    g.set(x, 3, z + dz, PLINTH);
    if (dz !== 0) g.set(x, 2, z + dz, LANTERN, { hanging: "true", waterlogged: "false" });
  }
}

// Warm light: a few windows on the faces have a glowstone lamp in the air just behind the glass.
for (const c of P.values()) {
  if (!c.shell || !c.built || c.outs.length !== 1) continue;
  const [ox, oz] = c.outs[0];
  for (let y = Math.max(c.g, 1); y < c.top - 1; y += 2) {
    if (((c.x * 7 + c.z * 13 + y * 5) % 11) !== 0) continue;
    if (isPier(c)) continue;
    const ix = c.x - ox, iz = c.z - oz, inner = plan(ix, iz);
    if (!inner || inner.shell || !inner.built || y >= inner.top - 1) continue;
    g.set(ix, y, iz, LAMP);
  }
}

// Glass panes connect to the panes and piers beside them in the wall plane (not into the interior).
for (const c of P.values()) {
  if (!c.shell || c.outs.length !== 1 || !c.built) continue;
  for (let y = 1; y < c.top - 1; y++) {
    const p = g.get(c.x, y, c.z);
    if (!p || p.block !== GLASS) continue;
    const st = {};
    if (wallAxis(c) === "z") {
      if (g.get(c.x, y, c.z - 1)) st.north = "true";
      if (g.get(c.x, y, c.z + 1)) st.south = "true";
    } else {
      if (g.get(c.x + 1, y, c.z)) st.east = "true";
      if (g.get(c.x - 1, y, c.z)) st.west = "true";
    }
    g.set(c.x, y, c.z, GLASS, st);
  }
}

console.log(g.save(OUT));
console.log({ entrance: door && { x: door.x, z: door.z, top: door.top }, cells: P.size, built: [...P.values()].filter((c) => c.built).length });
