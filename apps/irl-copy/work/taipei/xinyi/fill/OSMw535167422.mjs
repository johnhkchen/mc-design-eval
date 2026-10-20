import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 24 x 22 footprint, roof ~26 blocks above lowest ground.
// Read as a late-1990s Taipei office block: five storeys of 5 blocks each,
// white and light-grey concrete frame, blue-tinted glass curtain bands with
// dark mullions, a stone-faced ground storey with a shopfront, a grey parapet,
// and a small plant house on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167422";
const W = 24, H = 38, D = 22;
const ROOF_Y = 25;      // top of the fifth storey slab
const PARAPET_Y = 26;   // parapet course on the perimeter

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.max(0, Math.min(30, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));
const gAt = (x, z) => G.get(key(x, z));

// Outward-facing directions of a footprint cell (neighbour not in footprint)
function outward(x, z) {
  const out = [];
  for (const d of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (!has(x + d[0], z + d[1])) out.push(d);
  }
  return out;
}

const g = new Voxels([W, H, D]);
const lights = [];

for (const [k0, gr] of G) {
  const [x, z] = k0.split(",").map(Number);
  const out = outward(x, z);
  const perim = out.length > 0;
  const dir = out[0];

  for (let y = 0; y <= ROOF_Y; y++) {
    // Foundation: solid from y 0 up to this cell's ground
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    const k = Math.floor(y / 5);
    const r = y % 5;

    if (!perim) {
      // Interior: floor slab per storey, otherwise air
      if (r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade
    if (y === ROOF_Y) { g.set(x, y, z, "white_concrete"); continue; }
    if (r === 0) {
      g.set(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");
      continue;
    }
    if (r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }

    // Window band r = 1..3: glass with dark mullions every 3 blocks
    const idx = dir[1] !== 0 ? x : z;
    const mull = idx % 3 === 0;
    g.set(x, y, z, mull ? "gray_concrete" : "light_blue_stained_glass");

    // Warm light behind some glass on upper storeys
    if (k >= 1 && k <= 4 && r === 2 && !mull && idx % 6 === 2) {
      const ix = x - dir[0], iz = z - dir[1];
      if (has(ix, iz) && outward(ix, iz).length === 0 && y >= gAt(ix, iz)) {
        lights.push([ix, y, iz]);
      }
    }
  }

  // Parapet course on the perimeter
  if (perim && gr <= PARAPET_Y) g.set(x, PARAPET_Y, z, "light_gray_concrete");
}

// Roof plant house: 8 x 8 box in the middle of the roof, on the roof slab
for (let x = 8; x <= 15; x++) {
  for (let z = 7; z <= 14; z++) {
    if (!has(x, z)) continue;
    const gr = gAt(x, z);
    const ring = x === 8 || x === 15 || z === 7 || z === 14;
    const corner = (x === 8 || x === 15) && (z === 7 || z === 14);
    if (ring) {
      g.set(x, 26, z, "white_concrete");
      g.set(x, 27, z, corner || (x + z) % 3 === 0 ? "gray_concrete" : "light_blue_stained_glass");
      g.set(x, 28, z, "white_concrete");
    }
    g.set(x, 29, z, "smooth_stone");
    if (gr > ROOF_Y) { /* footprint sits on a slope: roof slab already solid */ }
  }
}
// Warm light inside the plant house, visible through its glass
for (const [x, z] of [[8, 10], [15, 11]]) {
  if (has(x, z)) g.set(x, 27, z, "glowstone");
}

// Entrance door on the south face, on the stone-faced ground storey
const dg = gAt(11, 21);
if (dg !== undefined && outward(11, 21).some((d) => d[0] === 0 && d[1] === 1)) {
  const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(11, dg + 1, 21, "oak_door", { ...doorBase, half: "lower" });
  g.set(11, dg + 2, 21, "oak_door", { ...doorBase, half: "upper" });
}

// Place the interior lights last so they are not overwritten
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
