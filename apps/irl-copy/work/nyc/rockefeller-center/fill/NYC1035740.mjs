// 525 Madison Avenue, 1926 mixed residential and commercial building: a six-storey brick loft-apartment block over
// shops (Midtown, the 1920s setback-era walk-up type). Footprint 22 x 11, x along the street (low z = the street front,
// N), with a light court open to grade in the rear-east quarter (lidar 0). Lidar read as three flat tops, not cell by
// cell: 19 blocks (six storeys: a ground storey of 4 and five storeys of 3) on the street front and the rear bay, 16
// (five storeys) across the middle and up the west side, 13 (four storeys) at the west end. Every column is solid from
// y 0 to its top, so each storey and setback stands on what is below and the downhill cells carry their foundation.
// Facades: granite plinth, a shopfront of glass between granite piers with a dark-oak door and fascia (commercial
// street front), smooth-quartz string courses at every floor line, brick piers between three-wide window bays
// (glass panes with an iron-bar mullion, set one block back in punched reveals), a cornice course with a continuous coping on the street front, and a bulkhead on the
// rear bay. Behind each window a one-block air gap sits in a solid core, so the glass reads as glass and there are no
// interiors; a few gaps hold a glowstone lamp behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035740.cells.json`, "utf8"));
const X = 22, Y = 31, Z = 11;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tier per cell (block height of the top, 0 = court, no building), from the lidar roof, thresholds not noise.
const tier = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const r = cell.get(`${x},${z}`).roof;
  if (r === 0) return 0;
  return r >= 18 ? 19 : r >= 15 ? 16 : 13;
};
const H = (x, z) => (x >= 0 && z >= 0 && x < X && z < Z ? tier(x, z) : 0);
const massing = (x, y, z) => H(x, z) > y;                       // solid at height y: the column is built up to H

// Outward faces in priority order: N is the street front (z = 0), then the ends (E, W), then the rear (S).
const DIRS = { N: [0, -1], E: [1, 0], W: [-1, 0], S: [0, 1] };
const face = (x, y, z) => Object.keys(DIRS).find((d) => { const [dx, dz] = DIRS[d]; return !massing(x + dx, y, z + dz); });
const street = (x, z, d) => (d === "N" && z === 0) || (d === "E" && x === X - 1 && z <= 1);
const uOf = (x, z, d) => (d === "N" || d === "S" ? x : z);     // position along the wall
const winRow = (y) => y === 1 || y === 2 || (y >= 4 && (y - 4) % 3 !== 0);   // ground windows; upper storeys: 2 window rows, 1 string

function facade(x, y, z, d) {
  if (y === 0) return { block: "polished_granite" };
  if (d === "N" && z === 0 && x === 8 && y <= 2) {
    return { block: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  const u = uOf(x, z, d);
  if (street(x, z, d) && y <= 2) return { block: u % 4 === 0 ? "polished_granite" : "glass" };
  if (street(x, z, d) && y === 3) return { block: d === "N" && x >= 7 && x <= 9 ? "dark_oak_planks" : "smooth_quartz" };
  if (y === 3 || (y >= 4 && (y - 4) % 3 === 0)) return { block: "smooth_quartz" };         // lintel and floor-line courses
  if (u % 4 === 0) return { block: "bricks" };                                              // brick piers
  const ew = d === "E" || d === "W";                                                        // panes run along the wall
  const state = ew ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
  return u % 4 === 2 ? { block: "iron_bars", state } : { block: "glass_pane", state };
}

// Punched windows: each window sits one block back in a notch (a reveal), so its glass is one block in from the face,
// with a one-block air gap behind it (the pocket) and solid core beyond. The notch is air in the outer block; the pocket
// is bounded by solid on every side, never open to the roof or the court. Only window rows below the top row qualify,
// and only where the glass, pocket and core are all built; otherwise the window stays flush.
const key = (x, y, z) => `${x},${y},${z}`;
const recessed = new Map();    // notch (outer block of a window) -> face
const panes = new Map();       // glass one block in -> the window's block and state
const pockets = new Set();     // air (or lamp) two blocks in
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H(x, z); if (!h) continue;
  for (let y = 1; y <= h - 2; y++) {
    if (!winRow(y)) continue;
    const d = face(x, y, z); if (!d || street(x, z, d)) continue;   // shopfronts stay flush
    const f = facade(x, y, z, d);
    if (!/^(glass|glass_pane|iron_bars)$/.test(f.block)) continue;
    const [dx, dz] = DIRS[d];
    const [ux, uz] = d === "N" || d === "S" ? [1, 0] : [0, 1];
    const at = (n) => [x - dx * n, z - dz * n];
    const [p1x, p1z] = at(1), [p2x, p2z] = at(2), [p3x, p3z] = at(3);
    const ok = massing(p1x, y, p1z) && massing(p2x, y, p2z) && massing(p3x, y, p3z)
      && massing(p1x + ux, y, p1z + uz) && massing(p1x - ux, y, p1z - uz)
      && massing(p2x + ux, y, p2z + uz) && massing(p2x - ux, y, p2z - uz);
    if (!ok) continue;
    recessed.set(key(x, y, z), d);
    panes.set(key(p1x, y, p1z), f);
    pockets.add(key(p2x, y, p2z));
  }
}

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H(x, z);
  if (!h) { if (inFoot(x, z)) g.set(x, 0, z, "stone_bricks"); continue; }   // the light court's paving at grade
  const perimeter = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ez]) => !massing(x + ex, h - 1, z + ez));
  for (let y = 0; y < h; y++) {
    const k = key(x, y, z);
    if (pockets.has(k)) {
      g.set(x, y, z, (x * 5 + y * 3 + z * 7) % 4 === 0 ? "glowstone" : "air");   // warm lamp behind some panes
      continue;
    }
    if (panes.has(k)) { const p = panes.get(k); g.set(x, y, z, p.block, p.state); continue; }
    if (recessed.has(k)) { g.set(x, y, z, "air"); continue; }                  // the notch in front of the glass
    const d = face(x, y, z);
    if (d) { const f = facade(x, y, z, d); g.set(x, y, z, f.block, f.state); }
    else g.set(x, y, z, y === h - 1 ? "stone" : "bricks");                      // roof covering on top, solid core inside
  }
  if (perimeter) {
    g.set(x, h, z, "smooth_quartz");                                             // cornice course on the roof edge
    if (z === 0) g.set(x, h + 1, z, "smooth_quartz_slab", { type: "bottom" });   // continuous coping on the street front
  }
}

// Roof bulkhead on the rear bay: a two-block brick stair-tower with a cap, on the roof covering.
for (const x of [9, 10]) {
  g.set(x, 19, 9, "bricks"); g.set(x, 20, 9, "bricks");
  g.set(x, 21, 9, "smooth_quartz_slab", { type: "bottom" });
}

const out = g.save(`${DIR}/NYC1035740.nbt`);
console.log(`NYC1035740.nbt: ${out.blocks} blocks, palette ${out.palette}, ${pockets.size} window pockets`);
