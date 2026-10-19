// 9 East 47th Street, 1930 commercial and office building: a 20-block (about 22 m) Art Deco office block of pale stone on
// a granite base, six storeys of 3 blocks, on a 7 x 26 footprint. The lidar gives two tall flanks (roof 20) either side
// of a 17-block middle, and a 4-5 block wing at the north end, so the massing is read as tiers: 5 (wing), 8, 11, 14, 17,
// 20, each stepping on the one below through the lidar's own cells. Ends are the street fronts: a granite shopfront with
// a recessed entrance, a granite fascia, then calcite piers with glass panes between them and sandstone storey lines.
// Each tier's top is a calcite parapet over a stone roof, and a small glass-banded plant room sits on the middle roof.
// Between the shell and a solid core (x 3) there is an air gap, with a floor slab per storey; the core keeps the slabs
// tied in, so nothing floats. Warm glowstone sits behind some panes and lanterns hang in the end bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035413.cells.json`, "utf8"));
const W = 7, D = 26, Y = 32;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof with its one gap (5, 8 reads 0) filled from the median of its neighbours that have a roof.
const roofAt = (x, z) => {
  const r = cell.get(`${x},${z}`).roof;
  if (r > 0) return r;
  const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => cell.get(`${x + dx},${z + dz}`))
    .filter((c) => c && c.roof > 0).map((c) => c.roof).sort((a, b) => a - b);
  return n[Math.floor(n.length / 2)];
};
// Tiers stand at 5, 8, 11, 14, 17, 20 blocks: each top is 3 blocks of storey (plus a parapet) above the last, so
// every tier's roof cap (top - 1) sits on a storey slab (y = 0 mod 3) and the stepped tiers read as storeys.
const tierOf = (r) => (r <= 5 ? 5 : r <= 9 ? 8 : r <= 12 ? 11 : r <= 15 ? 14 : r <= 17 ? 17 : 20);
const topOf = (x, z) => tierOf(roofAt(x, z)) - 1;

// Materials: granite base and fascia, pale calcite piers and parapet, buff sandstone storey lines, light-blue glass.
const BASE = "polished_granite", FASCIA = BASE, PIER = "calcite", SPAN = "smooth_sandstone";
const GLASS = "light_blue_stained_glass", PANE = "light_blue_stained_glass_pane";
const CORE = "stone_bricks", SLAB = "smooth_stone", ROOF = "stone";

const g = new Voxels([W, Y, D]);
const solid = (x, y, z) => g.get(x, y, z) !== null;

// Facade position: the ends (z 0 and D-1) are the street fronts, p runs along x; the long flanks run along z.
const facade = (x, z) => (z === 0 || z === D - 1
  ? { end: true, p: x, span: W - 1, outward: z === 0 ? "north" : "south" }
  : { end: false, p: z, span: D - 1, outward: x === 0 ? "west" : "east" });
const isPier = (f) => f.p % 3 === 0 || f.p === f.span;

// Glass panes connect along their own facade to the neighbour in the run (a pier or another pane), never out or in.
const paneState = (f) => {
  const lo = f.p - 1 >= 0 ? "true" : "false", hi = f.p + 1 <= f.span ? "true" : "false";
  return f.end
    ? { east: hi, west: lo, north: "false", south: "false", waterlogged: "false" }
    : { north: lo, south: hi, east: "false", west: "false", waterlogged: "false" };
};

// The block for an edge (facade) cell at height y, under the top row c; null leaves it air.
const facadeBlock = (x, z, y, c, f) => {
  if (y === c) return { block: PIER };                       // calcite parapet on the top row
  if (y === 0) return { block: BASE };                       // granite base course
  if (y < 3) {                                               // ground storey: shopfront
    if (f.end && z === 0 && x === 3) return { door: true };  // recessed entrance, centred
    if (f.end && z === 0 && (x === 2 || x === 4)) return { block: BASE };
    return { block: isPier(f) ? BASE : GLASS };
  }
  if (y === 3) return { block: FASCIA };                     // shop fascia
  if (y % 3 === 0) return { block: SPAN };                   // sandstone storey lines
  if (isPier(f)) return { block: PIER };
  return { block: PANE, state: paneState(f) };
};

// Solid core (x 3) ties the storey slabs to the ground; air fills the rest behind the shell.
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const c = topOf(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  for (let y = ground; y <= c; y++) {
    if (edge) {
      const f = facade(x, z), b = facadeBlock(x, z, y, c, f);
      if (!b) continue;
      if (b.door) continue;                                  // the entrance door is set below
      else if (b.state) g.set(x, y, z, PANE, b.state);
      else g.set(x, y, z, b.block);
    } else if (y === c) g.set(x, y, z, ROOF);
    else if (x === 3) g.set(x, y, z, CORE);
    else if (y % 3 === 0) g.set(x, y, z, SLAB);
  }
}
// Entrance door: the lower half is at y 1, the upper at y 2; the upper half's state matches the lower.
g.set(3, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Plant room on the middle roof (tier 17): a calcite box with a glass band, standing on the roof cap at y 16.
for (let x = 2; x <= 4; x++) for (let z = 12; z <= 14; z++) {
  if (topOf(x, z) !== 16) continue;
  for (const y of [17, 19]) g.set(x, y, z, PIER);
  g.set(x, 18, z, x === 3 && z === 13 ? PIER : GLASS);
}

// Warm light behind some panes: glowstone on the storey slab in the air gap, and lanterns hanging from the slab above
// in the north-end bays. Only where the air cell has its slab under it (or above it), so nothing is set in the air.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  if (!edge) continue;
  const f = facade(x, z), c = topOf(x, z);
  for (let L = 3; L + 3 <= c; L += 3) {
    if (f.end) {
      // North end: interior cells (1 and 5) at z 1, under the slab at L+3; a lantern hangs at L+2.
      if (z !== 0 || (x !== 1 && x !== 5) || (L / 3) % 2 !== 0) continue;
      if (solid(x, L + 2, 1) || !solid(x, L + 3, 1)) continue;
      g.set(x, L + 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      // Flank: a glowstone just inside the pane, on the slab at L, in the window row L+1.
      const ix = x === 0 ? 1 : W - 2;
      if (f.p % 6 !== 2 || (L / 3) % 2 !== 1 || isPier(f)) continue;
      if (!solid(ix, L, z) || solid(ix, L + 1, z)) continue;
      g.set(ix, L + 1, z, "glowstone");
    }
  }
}

// Check: every solid block must reach the ground through solid blocks (no floating course).
const seen = new Set(), queue = [];
const k = (x, y, z) => (z * Y + y) * W + x;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (solid(x, 0, z)) { seen.add(k(x, 0, z)); queue.push([x, 0, z]); }
while (queue.length) {
  const [x, y, z] = queue.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= Y || nz >= D || seen.has(k(nx, ny, nz)) || !solid(nx, ny, nz)) continue;
    seen.add(k(nx, ny, nz)); queue.push([nx, ny, nz]);
  }
}
let floating = 0, total = 0;
for (let y = 0; y < Y; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!solid(x, y, z)) continue;
  total++;
  if (!seen.has(k(x, y, z))) floating++;
}
console.log(`solid ${total}, not tied to the ground ${floating}`);

const { blocks, palette } = g.save(`${DIR}/NYC1035413.nbt`);
console.log(`wrote ${blocks} blocks, palette ${palette}`);
