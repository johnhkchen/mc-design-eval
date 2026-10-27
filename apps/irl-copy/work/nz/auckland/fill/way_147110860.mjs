// Way 147110860, Mt Eden view: a 1960s-70s reinforced-concrete office block. Seven storeys of 4 blocks on a stepped
// massing (lidar roof snapped to the storey grid): a 7-storey body, a plant-room core, 6/5/4/2-storey wings stepping
// down the east side. White concrete piers and string courses, dark spandrels, light blue glazing, a stone plinth,
// a glazed entrance on the south face, and warm glowstone behind some windows. Air behind the glass, one slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110860.cells.json", "utf8"));
const g = new Voxels([30, 43, 32]);

// The lidar roof height, smoothed into flat tiers on the 4-block storey grid. Roof surfaces: 30 core, 28 body, 24/20/16 wings, 8 low wing.
function storeys(roof) {
  if (roof <= 1) return 0;                 // lidar sees no roof here: nothing built above the ground
  if (roof >= 29) return 30;               // core: seven storeys and a plant room
  if (roof >= 27) return 28;               // body: seven storeys
  if (roof >= 25) return 24;
  if (roof >= 20) return 20;
  if (roof >= 15) return 16;
  if (roof >= 6) return 8;
  return 4;
}

const col = new Map();
for (const [x, z, gr, r] of cells) col.set(`${x},${z}`, { gr, top: storeys(r) });
const topAt = (x, z) => col.get(`${x},${z}`)?.top ?? 0;
const DIRS = [{ dx: 0, dz: 1 }, { dx: 0, dz: -1 }, { dx: 1, dz: 0 }, { dx: -1, dz: 0 }];   // S, N, E, W
// the faces of a cell at height y that look onto air (no neighbour, or a neighbour lower than y)
const exposed = (x, z, y) => DIRS.filter((d) => topAt(x + d.dx, z + d.dz) <= y);

const plan = new Map();   // "x,y,z" -> { block, state }; applied at the end so the air and glow checks see the whole plan
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

// the facade of an edge cell at height y: plinth, string courses, spandrels, piers, glazing; corners are pilasters
function facade(x, y, z, ex, gr) {
  if (y < gr || y === 0) return "stone_bricks";
  if (ex.length >= 2) return y < 4 ? "polished_andesite" : "white_concrete";
  if (y % 4 === 0) return "smooth_quartz";             // floor string course
  if (y % 4 === 3) return "gray_concrete";             // dark spandrel under each window band
  const t = ex[0].dx ? z : x;                          // position along the face
  if (t % 4 === 0) return y < 4 ? "polished_andesite" : "white_concrete";   // pier
  return "light_blue_stained_glass";
}

const lights = [];
for (const [x, z, gr] of cells) {
  const { top } = col.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");  // foundation: solid from y 0 up to the cell's ground
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y === top - 1) { put(x, y, z, ex.length ? "smooth_quartz" : "gray_concrete"); continue; }   // roof deck, cornice on the edge
    if (ex.length) {
      put(x, y, z, facade(x, y, z, ex, gr));
      if (ex.length === 1 && y >= 4 && (y % 4 === 1 || y % 4 === 2)) lights.push([x, y, z, ex[0]]);
      continue;
    }
    if (y === 0) put(x, y, z, "light_gray_concrete");                    // interior ground floor slab
    else if (y % 4 === 0 && y <= top - 3) put(x, y, z, "light_gray_concrete");   // floor slab of an interior storey
  }
  // parapet on the roof edge
  if (exposed(x, z, top - 1).length) put(x, top, z, "white_concrete");
}

// the frame: concrete columns on a 4-block grid through the interior, so each floor slab sits on something
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { top } = col.get(`${x},${z}`);
  if (!top || x % 4 || z % 4) continue;
  if (DIRS.some((d) => topAt(x + d.dx, z + d.dz) < top)) continue;
  for (let y = 0; y <= top - 2; y++) put(x, y, z, "white_concrete");
}

// roof plant on the core and the body: boxes set in from the parapet
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { top } = col.get(`${x},${z}`);
  if (!top || exposed(x, z, top - 1).length) continue;
  if ((top === 30 && x % 6 === 2 && z % 6 === 2) || (top === 28 && x % 5 === 0 && z % 5 === 0)) put(x, top, z, "iron_block");
}

// the entrance: a glazed bay in the middle of the south face, a door, and a lantern under the storey-2 slab
const southEdge = cells.filter(([x, z, , r]) => storeys(r) > 0 && topAt(x, z + 1) === 0).map((c) => [c[0], c[1]]);
const zE = Math.max(...southEdge.map((c) => c[1]));
const xsE = southEdge.filter((c) => c[1] === zE).map((c) => c[0]).sort((a, b) => a - b);
const xc = xsE[xsE.length >> 1];
for (const dx of [-2, -1, 1, 2]) {
  if (!topAt(xc + dx, zE)) continue;
  for (let y = 1; y <= 3; y++) put(xc + dx, y, zE, Math.abs(dx) === 2 ? "polished_andesite" : y === 3 ? "gray_concrete" : "light_blue_stained_glass");
}
put(xc, 1, zE, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(xc, 2, zE, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(xc, 3, zE, "lantern", { hanging: "true", waterlogged: "false" });

// warm light: glowstone on the air side of some upper-floor windows (a deterministic pick, about one in seven)
for (const [x, y, z, d] of lights) {
  const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
  if (h % 7) continue;
  const tx = x - d.dx, tz = z - d.dz;
  if (topAt(tx, tz) <= y || plan.has(`${tx},${y},${tz}`)) continue;
  put(tx, y, tz, "glowstone");
}

for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110860.nbt");
console.log(JSON.stringify({ ...stats, entrance: { x: xc, z: zE } }));
