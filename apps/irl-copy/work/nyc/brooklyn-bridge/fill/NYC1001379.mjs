import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1001379.cells.json`, "utf8"));

const W = 5, H = 26, D = 12;
const g = new Voxels([W, H, D]);

// Ground and roof per cell. Roof is quantised to 2-block courses so the
// massing reads as clean tiers rather than lidar noise.
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.round(gr));
  let r = Math.round(Math.round(roof) / 2) * 2;
  r = Math.min(H - 4, Math.max(r, ground + 10));
  map.set(`${x},${z}`, { x, z, g: ground, r });
}
const has = (x, z) => map.has(`${x},${z}`);

// Classify an exterior cell's face: front (street, x=0), rear, or side (z ends).
function faceOf(x, z) {
  if (!has(x - 1, z)) return { face: "front", idx: z };
  if (!has(x + 1, z)) return { face: "rear", idx: z };
  if (!has(x, z - 1)) return { face: "side", idx: x };
  if (!has(x, z + 1)) return { face: "side", idx: x };
  return null;
}

// Window bays: front/rear windows in pairs along z, side windows at x=1 and x=3.
function isWindow(face, idx) {
  if (face === "side") return idx === 1 || idx === 3;
  return idx >= 1 && idx <= 10 && (idx % 4 === 1 || idx % 4 === 2);
}

const WIN = "light_blue_stained_glass_pane";
const DOOR = { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const c of map.values()) {
  const { x, z, g: gr, r } = c;

  // 1. Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // 2. Interior: air, floor slabs each storey, roof deck
  for (let y = gr + 3; y < r - 1; y += 3) g.set(x, y, z, "stone_bricks");
  g.set(x, r - 1, z, "stone");

  const ext = faceOf(x, z);
  if (!ext) continue;

  // 3. Exterior walls
  for (let y = gr; y <= r - 1; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / 3);
    const within = rel % 3;
    let id = "bricks";
    let props;

    if (y === gr) {
      id = "stone_bricks"; // base course
    } else if (y === r - 2) {
      id = "smooth_stone"; // cornice band
    } else if (y === r - 1) {
      id = "bricks";
    } else if (within === 0) {
      id = "stone_bricks"; // storey line: sill and lintel band
    } else if (ext.face === "front" && k === 0 && ext.idx === 1) {
      // Street entrance: two-block door
      if (within === 1) { id = "oak_door"; props = DOOR; }
      else { id = "oak_door"; props = DOOR_UP; }
    } else if (ext.face === "front" && k === 0 && (ext.idx === 0 || ext.idx === 2)) {
      id = "stone_bricks"; // door surround pilasters
    } else if (y < r - 2 && isWindow(ext.face, ext.idx)) {
      id = WIN;
    }

    g.set(x, y, z, id, props);
  }

  // 4. Parapet: a low coping slab on top of the perimeter
  g.set(x, r, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// 5. Entrance hood: a stone lintel band across the door bay above the sill line
for (const c of map.values()) {
  if (c.x === 0 && c.z >= 0 && c.z <= 2) {
    const y = c.g + 3;
    if (y < c.r - 2) g.set(c.x, y, c.z, "smooth_stone");
  }
}

// 6. Roof bulkhead (stair housing), one block above the coping
for (const c of map.values()) {
  if (c.x >= 1 && c.x <= 3 && c.z >= 4 && c.z <= 7) {
    g.set(c.x, c.r, c.z, "stone_bricks");
  }
}

// 7. Warm light behind some front windows (interior air, one block back)
for (const c of map.values()) {
  if (c.x !== 1) continue;
  if (![1, 5, 9].includes(c.z)) continue;
  for (let k = 0; k <= 2; k++) {
    const y = c.g + 3 * k + 1;
    if (k === 0 && c.z === 1) continue; // keep the entrance clear
    if (y < c.r - 2) g.set(c.x, y, c.z, "glowstone");
  }
}

g.save(`${dir}/NYC1001379.nbt`);
