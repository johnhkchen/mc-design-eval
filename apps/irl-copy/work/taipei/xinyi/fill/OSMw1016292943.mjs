import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292943";
const W = 21, H = 38, D = 20;
const ROOF_DECK = 25;   // top surface of roof deck sits at 26 blocks above lowest ground
const PARAPET = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Normalise so the lowest ground under the footprint is y 0.
const minGround = Math.min(...cells.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of cells) {
  const g = Math.max(0, Math.min(H - 1, Math.round(gr) - minGround));
  ground.set(`${x},${z}`, g);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exposed faces of a footprint cell. idx = position along that face (for piers/bays).
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dir: "N", idx: x });
  if (!has(x, z + 1)) f.push({ dir: "S", idx: x });
  if (!has(x - 1, z)) f.push({ dir: "W", idx: z });
  if (!has(x + 1, z)) f.push({ dir: "E", idx: z });
  return f;
}

// Footprint bounds and centre for entrance and roof plant.
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);

const g = new Voxels([W, H, D]);

// Wall material for a storey band on an exposed face.
function wallBlock(x, y, z, faces) {
  const rel = y % 5;
  if (rel === 0) return "light_gray_concrete";                 // floor line / spandrel
  if (rel === 4) return "smooth_quartz";                       // storey band under the slab
  const piers = faces.some(f => f.idx % 3 === 0);
  if (piers) return "white_concrete";                          // vertical piers
  if ((x + y + z) % 13 === 0) return "shroomlight";            // warm lit window
  return "light_blue_stained_glass";                           // tinted glazing
}

// Foundation, floors, walls, parapet.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const edge = faces.length > 0;

  // Foundation fill from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_DECK; y++) {
    if (y === ROOF_DECK) {
      g.set(x, y, z, "light_gray_concrete");                   // roof deck
    } else if (edge && y === gr) {
      g.set(x, y, z, "polished_andesite");                     // base course
    } else if (y % 5 === 0) {
      g.set(x, y, z, "light_gray_concrete");                   // storey slab (interior and edge)
    } else if (edge) {
      g.set(x, y, z, wallBlock(x, y, z, faces));
    }
    // interior non-slab cells stay air (no interiors)
  }

  if (edge) g.set(x, PARAPET, z, "smooth_quartz");             // parapet coping
}

// Ground-floor entrance on the north (minimum z) face, centred.
for (let x = cx - 1; x <= cx + 1; x++) {
  if (!has(x, minZ)) continue;
  const gr = gAt(x, minZ);
  const faces = exposedFaces(x, minZ);
  if (!faces.some(f => f.dir === "N")) continue;
  g.set(x, gr + 1, minZ, "air");
  g.set(x, gr + 2, minZ, "air");
  g.set(x, gr + 3, minZ, "light_blue_stained_glass");          // transom light
}
// Warm lanterns just inside the entrance piers.
if (has(cx, minZ + 1)) {
  const gr = gAt(cx, minZ + 1);
  g.set(cx, gr + 2, minZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a central penthouse block with a lightning rod.
for (let x = cx - 2; x <= cx + 2; x++) {
  for (let z = cz - 2; z <= cz + 2; z++) {
    if (!has(x, z)) continue;
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}
if (has(cx, cz)) {
  g.set(cx, PARAPET + 2, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
