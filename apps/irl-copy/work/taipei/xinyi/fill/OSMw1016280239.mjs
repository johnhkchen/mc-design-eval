import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi commercial/office block, c. 1990s: four storeys over a stone
// base, cream tiled walls, tinted glazing in bays, a smooth quartz parapet and
// a rooftop plant box. Roof slab at y=20, parapet to y=22, plant box to y=24.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280239";
const W = 22, H = 33, D = 18;
const ROOF_Y = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(ROOF_Y - 1, Math.max(0, Math.round(gr))));
}

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// Exposed faces of a footprint cell: N = -z side, S = +z side, W = -x, E = +x.
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const isPerim = (x, z) => faces(x, z).length > 0;

// Footprint centre
let sx = 0, sz = 0, n = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  sx += x; sz += z; n++;
}
const cx = Math.round(sx / n);
const cz = Math.round(sz / n);

// Entrance: a north-facing (else south-facing) perimeter cell nearest the middle
let doorKey = null, doorFace = "N";
for (const face of ["N", "S"]) {
  let best = null, bestD = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const fs = faces(x, z);
    if (fs[0] !== face) continue;
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; best = k; }
  }
  if (best) { doorKey = best; doorFace = face; break; }
}
const doorGround = doorKey ? ground.get(doorKey) : 0;

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Is this (perimeter) cell a glazed window position at height y?
function isWindow(x, z, y, gr) {
  if (!isPerim(x, z)) return false;
  if (y <= gr || y >= ROOF_Y) return false;
  const r = y % 5;
  if (r < 1 || r > 3) return false;
  const fs = faces(x, z);
  const coord = (fs[0] === "N" || fs[0] === "S") ? x : z;
  if (coord % 3 === 0) return false;
  if (doorKey === key(x, z) && (y === gr + 1 || y === gr + 2)) return false;
  return true;
}

const g = new Voxels([W, H, D]);

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);
  const fs = faces(x, z);
  const face = fs[0];
  const coord = (face === "N" || face === "S") ? x : z;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === gr) { g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone"); continue; }
    if (y % 5 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (!perim) continue;
    if (y % 5 === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (doorKey === k && (y === gr + 1 || y === gr + 2)) continue; // door added later
    if (coord % 3 === 0) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      const props = (face === "N" || face === "S") ? paneNS : paneEW;
      g.set(x, y, z, "light_blue_stained_glass_pane", props);
    }
  }

  // Parapet with a quartz cap
  if (perim) {
    g.set(x, ROOF_Y + 1, z, "white_concrete");
    g.set(x, ROOF_Y + 2, z, "smooth_quartz");
  }
}

// Rooftop plant box, centred on the footprint, interior cells only
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 2) continue;
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, ROOF_Y + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light behind some windows (glowstone in the air gap, interior side)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  if (!isPerim(x, z)) continue;
  const face = faces(x, z)[0];
  let ix = x, iz = z;
  if (face === "N") iz = z + 1;
  else if (face === "S") iz = z - 1;
  else if (face === "W") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (let y = gr + 1; y < ROOF_Y - 1; y++) {
    if (y % 5 !== 2) continue;
    if (!isWindow(x, z, y, gr)) continue;
    if ((x * 7 + z * 3 + y) % 4 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Entrance door, recessed into a window bay on the front face
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const yLow = doorGround + 1;
  const common = { facing: doorFace === "N" ? "north" : "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, yLow, dz, "birch_door", { ...common, half: "lower" });
  g.set(dx, yLow + 1, dz, "birch_door", { ...common, half: "upper" });
  // Transom glazing above the door stays as pane (y = gr+3)
}

g.save(`${DIR}/${ID}.nbt`);
