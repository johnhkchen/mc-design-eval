// A 1930s reinforced-concrete commercial block (plastered, with a volcanic-basalt base) on the Eden Terrace side of
// Maungawhau: five storeys of 4 blocks, a flat roof with a coped parapet, shopfronts and a canopied entrance on the
// ground floor, pier-and-panel windows above, a few shroomlights and glowstone lit behind the glass, a lift overrun
// and plant on the roof. The footprint and the lidar roof heights are followed cell by cell: lidar noise (19s) is
// flattened to 20, and the three 9-block cells at the corners stay as a low two-storey wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355377782.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355377782.nbt";
const SIZE = [43, 33, 38];
const FLOORS = [1, 5, 9, 13, 17];                       // storey slab rows: ground base at 1, then every 4 blocks
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// ---- the record: per footprint cell ground and roof (lidar), lidar noise flattened to one roof tier
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(k2(x, z), { g, R: r < 12 ? r : 20 });
const inside = (x, z) => plan.has(k2(x, z));
const T = (x, z) => plan.get(k2(x, z)).R - 1;           // top block row of the cell (roof surface sits at R)

// ---- the shell: ring cells touch the outside; each knows its outward direction
const ring = new Map();
for (const [x, z] of plan.keys().map((s) => s.split(",").map(Number))) {
  const out = DIRS.find(([dx, dz]) => !inside(x + dx, z + dz));
  if (out) ring.set(k2(x, z), { x, z, out });
}
let cx = 0, cz = 0; for (const k of plan.keys()) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; }
cx /= plan.size; cz /= plan.size;
// the ring walked round the footprint, so a window bay is a run of cells and piers fall every 4th cell
const loop = [...ring.values()].sort((a, b) => Math.atan2(a.z + 0.5 - cz, a.x + 0.5 - cx) - Math.atan2(b.z + 0.5 - cz, b.x + 0.5 - cx));
loop.forEach((c, k) => { c.k = k; c.pier = k % 4 === 0; });
const ringAt = (x, z) => ring.get(k2(x, z));

// the entrance: the middle of the north-west face (outward -x or -z), off a pier, with its ring neighbours as canopy
const nw = loop.filter((c) => c.out[0] < 0 || c.out[1] < 0);
const door = nw[Math.floor(nw.length / 2)].pier ? nw[Math.floor(nw.length / 2) + 1] : nw[Math.floor(nw.length / 2)];
const canopy = new Set([loop[(door.k + loop.length - 1) % loop.length], door, loop[(door.k + 1) % loop.length]].map((c) => k2(c.x, c.z)));
const lanterns = new Set([loop[(door.k + loop.length - 1) % loop.length], loop[(door.k + 1) % loop.length]].map((c) => k2(c.x, c.z)));

// ---- what each cell holds, row by row
const vox = new Map();                                   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(k3(x, y, z), { block, state });
const PANE = (upper) => (upper ? "light_blue_stained_glass_pane" : "glass_pane");

for (const [key, { g, R }] of plan) {
  const [x, z] = key.split(",").map(Number);
  const top = R - 1, base = Math.max(g, 1), c = ringAt(x, z);
  for (let y = 0; y < base; y++) put(x, y, z, "polished_andesite");          // plinth / fill under the ground
  for (let y = base; y <= top; y++) {
    const F = FLOORS.filter((f) => f <= y).pop();
    if (y === top) { put(x, y, z, c ? "smooth_quartz" : "stone"); continue; }           // coped parapet / light roof deck
    if (y === F) { put(x, y, z, !c ? "smooth_stone" : F === 1 ? "polished_andesite" : "smooth_quartz"); continue; }
    if (!c) continue;                                    // no interiors: air behind the glass
    if (F + 3 <= top - 1 && y === F + 3) { put(x, y, z, "smooth_quartz"); continue; }   // head course
    if (c.pier) { put(x, y, z, "smooth_quartz"); continue; }                             // pier between bays
    if (F === 1) {
      const dk = k2(x, z);
      if (y === 4 && canopy.has(dk)) { put(x, y, z, "dark_oak_planks"); continue; }
      if (y === 3 && lanterns.has(dk)) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (c === door && (y === 2 || y === 3)) {
        put(x, y, z, "dark_oak_door", { facing: c.out[0] ? (c.out[0] > 0 ? "east" : "west") : (c.out[1] > 0 ? "south" : "north"), half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      put(x, y, z, PANE(false));                         // shopfront glass
    } else put(x, y, z, PANE(true));                     // upper windows
  }
}

// ---- warm light behind some windows: shroomlight (upper) and glowstone (shopfront) on the interior cell behind the glass
let lit = 0;
for (const c of loop) {
  if (c.pier) continue;
  const inward = [-c.out[0], -c.out[1]];
  const ix = c.x + inward[0], iz = c.z + inward[1];
  if (!inside(ix, iz) || ringAt(ix, iz)) continue;
  for (const y of [2, 6, 10, 14, 18]) {
    if (y > T(c.x, c.z) - 1 || (c.k * 5 + y) % 9 !== 0) continue;
    if (vox.get(k3(c.x, y, c.z))?.block === "dark_oak_door") continue;
    put(ix, y, iz, y === 2 ? "glowstone" : "shroomlight");
    lit++;
  }
}

// ---- roof plant: a 3x3 lift overrun on two rows, and two plant boxes, all on the main roof tier near the middle
const onMainRoof = (x, z) => inside(x, z) && !ringAt(x, z) && plan.get(k2(x, z)).R === 20;
let best = null;
for (const k of plan.keys()) {
  const [x, z] = k.split(",").map(Number);
  let ok = true; for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 3; dz++) if (!onMainRoof(x + dx, z + dz)) { ok = false; break; }
  if (!ok) continue;
  const d = Math.hypot(x + 1 - cx, z + 1 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) put(best.x + dx, 20, best.z + dz, "light_gray_concrete");
  put(best.x + 1, 21, best.z + 1, "smooth_quartz");       // a cap on the overrun's middle
  for (const [x, z] of [[best.x + 4, best.z], [best.x + 4, best.z + 2]]) if (onMainRoof(x, z)) put(x, 20, z, "iron_block");   // plant boxes
}

// ---- the pane sides: a pane joins its neighbours that are walls, not lights or the door
const NOJOIN = new Set(["shroomlight", "glowstone", "lantern", "dark_oak_door"]);
for (const [key, v] of vox) {
  if (!v.block.endsWith("glass_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  const j = (dx, dz) => { const n = vox.get(k3(x + dx, y, z + dz)); return n && !NOJOIN.has(n.block) ? "true" : "false"; };
  v.state = { east: j(1, 0), north: j(0, -1), south: j(0, 1), west: j(-1, 0), waterlogged: "false" };
}

// ---- write the volume
const g = new Voxels(SIZE);
for (const [key, v] of vox) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const report = g.save(OUT);
console.log(JSON.stringify({ ring: loop.length, door: [door.x, door.z], lit, roofPlant: best, ...report }));
