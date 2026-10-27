// Way 162152811: a 1930s rendered-brick commercial block on Mt Eden's western slope (the uphill north end sits on
// ground 5, the downhill south end on ground 0). Basalt plinth, cream render walls, chiseled-quartz string courses at
// every floor, steel-frame windows in 5-block bays, a stall-front shopfront on the street (west) face, a timber door
// at mid-block, a parapet and cornice on top, two plant boxes on the roof. Roof tiers: 15 blocks, with the west bay and
// the stair core stepped up to 16 (lidar 14-17, smoothed); the east and south lower wings are lifted to the main 15
// rather than stepped, so every storey stacks on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152811.cells.json", "utf8"));
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152811.nbt";

const F0 = 3;                                        // the first floor line (the top of the foundation on a low site)
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => ground.has(`${x},${z}`);
const tier = (x, z) => (x <= 1 || (x >= 6 && x <= 8 && z >= 4 && z <= 40) ? 16 : 15);   // roof top (the roof slab is one below)
const topOf = (x, z) => Math.max(ground.get(`${x},${z}`) ?? 0, F0);                      // the solid top of the foundation here

const vox = new Map();                              // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });

// the facade of one exposed cell at height y: floor lines, steel windows in bays of 5 on the sides, a shopfront on the west
function facade(y, face, c, Rt) {
  if (y === Rt) return "smooth_quartz";                                    // parapet
  if (y === Rt - 1) return "quartz_bricks";                                // cornice under the parapet
  const r = (y - F0) % 4, k = Math.floor((y - F0) / 4);                    // r 0: floor line; 1: sill; 2-3: glass
  if (r === 0) return "chiseled_quartz_block";                             // string course at every floor
  if (!face) return "smooth_quartz";                                       // corner pier
  const p = c % 5;
  if (p === 0) return k === 0 ? "polished_andesite" : "smooth_quartz";     // pier
  if (k === 0 && face === "W") return r === 1 ? "polished_andesite" : "light_blue_stained_glass_pane";   // stall front, glazed the full bay
  if (r === 1) return "gray_concrete";                                     // steel sill
  return p === 1 || p === 4 ? "gray_concrete" : "light_blue_stained_glass_pane";              // steel jamb or glass
}

for (const [x, z, g] of cells) {
  const T = topOf(x, z), Rt = tier(x, z);
  const W = !has(x - 1, z), E = !has(x + 1, z), N = !has(x, z - 1), S = !has(x, z + 1);
  const exposed = [W, E, N, S].filter(Boolean).length;
  const face = exposed === 1 ? (W ? "W" : E ? "E" : N ? "N" : "S") : null;
  const c = face === "W" || face === "E" ? z : x;
  const ring = exposed > 0;
  for (let y = 0; y <= Rt; y++) {
    if (y < T) { put(x, y, z, ring ? "polished_andesite" : "stone"); continue; }   // basalt plinth on the outside, fill within
    if (ring) { put(x, y, z, facade(y, face, c, Rt)); continue; }
    if (y === Rt - 1) put(x, y, z, "smooth_stone");                                 // roof covering on the interior
    else if (y >= F0 && y < Rt - 1 && (y - F0) % 4 === 0) put(x, y, z, "stone");   // floor slab per storey
  }
}

// the entrance: a dark timber door in the west bay at mid-block, its lintel the pier course above
{
  const T = topOf(0, 30);
  put(0, T, 30, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(0, T + 1, 30, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// a warm lantern hangs in some bays, inside the glass, from the floor above
for (const [key, v] of [...vox]) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const W = !has(x - 1, z), E = !has(x + 1, z), N = !has(x, z - 1);
  const face = W ? "W" : E ? "E" : N ? "N" : "S";
  const c = face === "W" || face === "E" ? z : x;
  const k = Math.floor((y - F0) / 4), F = F0 + 4 * k;
  const Rt = tier(x, z), yL = F + 3 < Rt - 1 ? F + 3 : Rt - 2;
  if (yL !== y || (c + k) % 3 !== 1) continue;
  const [ix, iz] = face === "W" ? [1, z] : face === "E" ? [13, z] : face === "N" ? [x, 1] : [x, 59];
  if (!has(ix, iz) || yL < topOf(ix, iz)) continue;
  put(ix, yL, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// plant boxes on the roof, set on the roof slab
for (const [x0, z0] of [[3, 18], [10, 44]]) for (const dx of [0, 1]) for (const dz of [0, 1]) put(x0 + dx, tier(x0, z0), z0 + dz, "iron_block");

// glass panes connect to the solid facade next to them in their own plane
const solid = (x, y, z) => vox.has(`${x},${y},${z}`);
const g = new Voxels([15, 30, 61]);
for (const [key, { block, state }] of vox) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === "light_blue_stained_glass_pane") {
    // a pane on the west or east face runs along z; one on the north or south face runs along x
    const onWE = !has(x - 1, z) || !has(x + 1, z);
    const st = onWE
      ? { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false" }
      : { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)) };
    g.set(x, y, z, block, { ...st, waterlogged: "false" });
  } else g.set(x, y, z, block, state);
}

const info = g.save(out);
console.log(`way_162152811: ${cells.length} cells, ${info.blocks} blocks, ${info.palette} palette entries`);
