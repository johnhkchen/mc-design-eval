import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office tower, Xinyi, c. 1995-2005:
// a two-storey glazed podium, a setback shaft of white-clad floors with
// ribbon windows and alternating piers, and a crown with a plant penthouse and mast.
// Roof slab at y 78 (about 78 blocks above the lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw423104550";
const W = 39, H = 90, D = 36;
const ROOF_Y = 78;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(`${x},${z}`, gr);
const fp = (x, z) => groundMap.has(`${x},${z}`);
const groundAt = (x, z) => {
  const v = groundMap.get(`${x},${z}`);
  return Math.max(0, Math.min(ROOF_Y - 1, Math.round(v)));
};

// Tier 0 = podium (full footprint), 1 = main shaft, 2 = upper setback.
const tierRect = [
  null,
  { x0: 3, x1: 35, z0: 3, z1: 32 },
  { x0: 9, x1: 29, z0: 9, z1: 26 },
];

function inTier(t, x, z) {
  if (!fp(x, z)) return false;
  if (t === 0) return true;
  const r = tierRect[t];
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

function isEdge(t, x, z) {
  return inTier(t, x, z) &&
    !(inTier(t, x + 1, z) && inTier(t, x - 1, z) && inTier(t, x, z + 1) && inTier(t, x, z - 1));
}

// true when the wall faces +/-x (so its pier rhythm runs along z)
function onXFace(t, x, z) {
  return !inTier(t, x - 1, z) || !inTier(t, x + 1, z);
}

const wallTier = (y) => (y < 10 ? 0 : y < 45 ? 1 : 2);
const slabTier = (y) => (y <= 10 ? 0 : y <= 45 ? 1 : 2);

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function paneFor(t, x, z) {
  // podium glass reads cyan so the base separates from the blue-glass shaft
  const name = t === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
  return [name, onXFace(t, x, z) ? PANE_X : PANE_Z];
}

// Returns [name, props?] for a building voxel, or null for air.
function blockAt(x, y, z, gr) {
  if (y === ROOF_Y) return inTier(2, x, z) ? ["smooth_quartz"] : null;

  // Floor slabs every 5 blocks; podium roof at 10 covers the full footprint.
  if (y % 5 === 0 && y > 0) {
    const st = slabTier(y);
    if (!inTier(st, x, z)) return null;
    // cornice band on the outer edge at each setback, reads as a projecting line
    if (y === 10 || y === 45 || y === 75) {
      if (isEdge(st, x, z)) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];
    }
    return ["smooth_quartz"];
  }

  const wt = wallTier(y);

  // Planted terrace on the tier-1 setback ring, sitting on the y=45 slab.
  if (y === 46 && inTier(1, x, z) && !inTier(2, x, z)) return ["moss_carpet"];

  if (!inTier(wt, x, z)) return null;
  if (!isEdge(wt, x, z)) return null; // interior air: no interiors

  if (y === gr) return ["polished_andesite"]; // base course
  if (wt === 2 && y >= 76) return ["white_concrete"]; // parapet
  if (y % 5 === 4) return ["light_gray_concrete"]; // spandrel line, darker than the piers

  if (y < 5) return paneFor(0, x, z); // shopfront glass

  const idx = onXFace(wt, x, z) ? z : x;
  if (idx % 6 === 0) return ["light_gray_concrete"]; // fin pier, darker
  if (idx % 3 === 0) return ["white_concrete"];      // mullion pier
  return paneFor(wt, x, z);
}

const g = new Voxels([W, H, D]);

for (const [x, z] of cells) {
  const gr = groundAt(x, z);

  // Foundation from y 0 up to the cell's own ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_Y; y++) {
    const b = blockAt(x, y, z, gr);
    if (!b) continue;
    if (b[1]) g.set(x, y, z, b[0], b[1]);
    else g.set(x, y, z, b[0]);

    // Warm light behind a subset of glazed windows.
    const wt = wallTier(y);
    const isGlass = b[0].endsWith("stained_glass_pane");
    if (isGlass && y % 5 >= 1 && y % 5 <= 3 && ((x + 2 * z + y) % 7 === 0)) {
      const dx = !inTier(wt, x - 1, z) ? 1 : !inTier(wt, x + 1, z) ? -1 : 0;
      const dz = !inTier(wt, x, z - 1) ? 1 : !inTier(wt, x, z + 1) ? -1 : 0;
      const ix = x + dx, iz = z + dz;
      if (inTier(wt, ix, iz) && !isEdge(wt, ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Plant penthouse on the roof, y 79-82, centred in the upper setback.
for (let y = ROOF_Y + 1; y <= ROOF_Y + 4; y++) {
  for (let x = 14; x <= 24; x++) {
    for (let z = 13; z <= 21; z++) {
      if (!fp(x, z)) continue;
      const edgeP = x === 14 || x === 24 || z === 13 || z === 21;
      if (y === ROOF_Y + 4) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (edgeP) {
        if (y === 80) {
          const idx = (x === 14 || x === 24) ? z : x;
          if (idx % 3 === 0) g.set(x, y, z, "white_concrete");
          else g.set(x, y, z, "light_blue_stained_glass_pane", (x === 14 || x === 24) ? PANE_X : PANE_Z);
        } else {
          g.set(x, y, z, "white_concrete");
        }
      }
    }
  }
}

// Antenna mast from the penthouse roof.
if (fp(19, 17)) {
  for (let y = ROOF_Y + 5; y <= 88; y++) {
    g.set(19, y, 17, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Main entrance on the street (minimum-z) face, centred on the footprint.
// Stone surround, two glass-and-oak door leaves, and a canopy band over the door.
let z0 = Infinity;
for (let z = 0; z < D; z++) if (fp(19, z)) { z0 = z; break; }
if (Number.isFinite(z0)) {
  const gr0 = groundAt(19, z0);
  const ok = (x) => fp(x, z0) && groundAt(x, z0) <= gr0;

  // Surround: stone brick jambs either side of the doors, up to the canopy.
  for (const x of [16, 17, 20, 21]) {
    if (!ok(x)) continue;
    for (let y = gr0; y <= gr0 + 3; y++) {
      g.set(x, y, z0, y === gr0 ? "polished_andesite" : "stone_bricks");
    }
  }

  // Glass flanking the doors.
  for (const x of [15, 22]) {
    if (!ok(x)) continue;
    for (let y = gr0 + 1; y <= gr0 + 2; y++) {
      g.set(x, y, z0, "cyan_stained_glass_pane", x === 15 ? PANE_X : PANE_X);
    }
  }

  // Door leaves, centred on x 18-19.
  for (const x of [18, 19]) {
    if (!ok(x)) continue;
    const hinge = x === 18 ? "left" : "right";
    g.set(x, gr0, z0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, gr0 + 1, z0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }

  // Canopy band across the entrance, one row above the door head.
  for (let x = 15; x <= 22; x++) {
    if (!ok(x)) continue;
    g.set(x, gr0 + 4, z0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  // Lanterns under the canopy for a dusk read.
  for (const x of [17, 20]) {
    if (!ok(x)) continue;
    g.set(x, gr0 + 3, z0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
