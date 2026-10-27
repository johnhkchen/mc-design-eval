// way 326664548: a two-storey 1920s-30s brick-and-plaster commercial block in Mt Eden / Eden Terrace, the kind of
// street-front building that backs onto the village's main road. Red brick walls with white plaster bands
// (lintel, string course, cornice band), stone quoins, a shopfront with glazing bays at street level and a door in
// the south bay, upper windows in glazed bays, a parapet with a stone cap, and a small rooftop plant box. Tiers come
// from the lidar roof (values 7-9 above y 0, median 9). Smoothed over the 3x3 footprint neighbourhood and snapped to
// two flat tops: 9 (main body) and 8 (lower wing). The top of a tier is always the roof deck; interiors are air
// between a floor slab and a ceiling slab per storey, with glowstone behind a few upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664548.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664548.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const cellAt = new Map();
for (const [x, z, ground, roof] of cells) cellAt.set(K(x, z), { ground, roof });
const inF = (x, z) => cellAt.has(K(x, z));

// Direction of each outward face: N is -z, S is +z, W is -x, E is +x.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Tier per cell: average of the lidar roof over the 3x3 neighbourhood, snapped to 9 or 8.
const tierAt = new Map();
for (const [x, z] of cells) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cellAt.get(K(x + dx, z + dz)); if (c) { s += c.roof; n++; }
  }
  tierAt.set(K(x, z), s / n >= 8.5 ? 9 : 8);
}

// The door: the south-facing bay cell nearest the footprint's middle, not a corner.
const xs = cells.map((c) => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const [x, z] of cells) {
  const out = outsOf(x, z);
  if (out.length !== 1 || out[0] !== "S" || x % 3 === 0) continue;
  if (!door || Math.abs(x - midX) < Math.abs(door[0] - midX)) door = [x, z];
}
const doorKey = door ? K(door[0], door[1]) : null;

const g = new Voxels([13, 22, 19]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z, ground] of cells) {
  const key = K(x, z);
  const t = tierAt.get(key);                     // roof cap layer: blocks run from y 1 up to t
  const out = outsOf(x, z);
  const ring = out.length > 0;
  const corner = out.length > 1;
  const face = out[0];                           // primary outward face, for facade bays
  const along = face === "N" || face === "S" ? x : z;
  const bay = ring && !corner && along % 3 !== 0; // glazed bay; piers sit on every multiple of 3
  const facing = face ? ({ N: "south", S: "north", W: "east", E: "west" })[face] : null;
  const paneAxis = face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { east: "false", west: "false", north: "true", south: "true" };

  for (let y = 1; y <= ground; y++) put(x, y, z, "stone_bricks");   // foundation (none here: ground is 0)

  // Ground storey: y 1 floor, y 2-3 glazing, y 4 lintel band; then the upper floor at y 5.
  // Upper storey: windows from y 6 up to the band at t-1; cap (roof deck) at t.
  const facadeRow = (y) => {
    if (!ring) return null;
    if (corner) return "stone_bricks";           // quoins
    if (!bay) return "bricks";                    // pier
    return "glass";
  };

  for (let y = ground + 1; y <= t + 2; y++) {
    if (y === 1) { put(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }
    if (y === t) { put(x, y, z, "stone_bricks"); continue; }                    // roof deck
    if (y === t + 1) { if (ring) put(x, y, z, "bricks"); continue; }            // parapet
    if (y === t + 2) { if (ring) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    const band = y === 4 || y === 5 || y === t - 1;                             // lintel, string, ceiling band
    if (band) {
      if (ring) put(x, y, z, "white_concrete");
      else if (y === 5 || y === t - 1) put(x, y, z, "smooth_stone");           // floor / ceiling slab per storey
      continue;
    }
    // y 2-3 and y 6 .. t-2 are the glazed storeys
    if (!ring) continue;                                                       // interior air behind the glass
    const kind = facadeRow(y);
    if (kind === "glass") {
      if (key === doorKey && (y === 2 || y === 3)) {
        put(x, y, z, "dark_oak_door", { facing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "glass_pane", paneAxis);
      }
    } else if (kind) {
      put(x, y, z, kind);
    }
  }

  // Warm light behind every third glazed bay of the upper floor: a glowstone on the room side of the pane.
  if (bay && along % 6 === 1) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && outsOf(ix, iz).length === 0) put(ix, 6, iz, "glowstone");
  }
}

// Rooftop plant box: a 2x2 block on the main body's roof, near the middle of the high tier, standing on the deck.
const mainInterior = cells.filter(([x, z]) => tierAt.get(K(x, z)) === 9 && outsOf(x, z).length === 0);
const cx = mainInterior.reduce((s, c) => s + c[0], 0) / mainInterior.length;
const cz = mainInterior.reduce((s, c) => s + c[1], 0) / mainInterior.length;
let best = null;
for (const [x, z] of mainInterior) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
    const k = K(x + dx, z + dz);
    return tierAt.get(k) === 9 && outsOf(x + dx, z + dz).length === 0;
  });
  if (!ok) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(best.x + dx, 10, best.z + dz, "light_gray_concrete");
    put(best.x + dx, 11, best.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const stats = g.save(OUT);
console.log(`way 326664548: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
