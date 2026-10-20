import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402986";
const W = 22, H = 23, D = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const grounds = [...ground.values()];
const maxG = Math.max(...grounds);

// Roof sits about 11 blocks above the lowest ground; keep it clear of the
// downhill foundations and inside the 23-block column (plant room needs 4 more).
const roofY = Math.min(19, Math.max(11, maxG + 7));

const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: street-facing (minimum z) edge, middle of its run.
const minZ = Math.min(...cells.map(([, z]) => z));
const doorRow = cells.filter(([x, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorRow[Math.floor(doorRow.length / 2)];

// ---- 1. foundations, floor slabs, roof deck ----------------------------
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground-floor slab
  put(x, gr, z, "smooth_stone");

  // second-floor slab
  if (gr + 5 < roofY - 1) put(x, gr + 5, z, "smooth_stone");

  // ceiling / roof structure slab under the roof deck
  if (roofY - 1 > gr) put(x, roofY - 1, z, "smooth_stone");

  // roof deck covering the whole footprint
  put(x, roofY, z, "gray_concrete");
}

// ---- 2. perimeter walls: base, shopfront, storey lines, windows, cornice
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const corner = isCorner(x, z);
  const pillarCol = corner || (x + z) % 3 === 0;

  for (let y = gr; y <= roofY - 1; y++) {
    const rel = y - gr;
    if (y === roofY - 1) {
      put(x, y, z, "quartz_block");                       // cornice
    } else if (rel === 0) {
      put(x, y, z, "polished_granite");                    // base course
    } else if (rel === 4 || rel === 9) {
      put(x, y, z, "quartz_block");                        // storey lines
    } else if (pillarCol) {
      put(x, y, z, "quartz_pillar");                       // mullions
    } else if (rel >= 1 && rel <= 3) {
      put(x, y, z, "light_blue_stained_glass");            // shopfront glass
    } else if (rel >= 5 && rel <= 8) {
      put(x, y, z, "cyan_stained_glass");                  // upper windows
    } else {
      put(x, y, z, "light_gray_concrete");
    }
  }

  // parapet on the roof edge
  put(x, roofY + 1, z, "light_gray_concrete");
}

// ---- 3. entrance: double-height glazed door with a canopy line ----------
for (const [x, z, gr] of cells) {
  if (z !== minZ || !isEdge(x, z)) continue;
  if (Math.abs(x - doorX) <= 2 && x !== doorX) {
    // canopy over the entrance bay
    put(x, gr + 4, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(doorX, minZ)) {
  const gr = gOf(doorX, minZ);
  put(doorX, gr + 1, minZ, "oak_door",
    { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 2, minZ, "oak_door",
    { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 4, minZ, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- 4. warm interior lights standing on the floor slabs ----------------
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (((x * 5 + z * 3) % 13) === 0) {
    put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (gr + 6 < roofY - 1 && ((x * 7 + z * 2) % 13) === 0) {
    put(x, gr + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- 5. roof plant room, set back inside the parapet --------------------
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 6 || x > 15 || z < 8 || z > 18) continue;
  put(x, roofY + 1, z, "light_gray_concrete");
  put(x, roofY + 2, z, "light_gray_concrete");
  put(x, roofY + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
