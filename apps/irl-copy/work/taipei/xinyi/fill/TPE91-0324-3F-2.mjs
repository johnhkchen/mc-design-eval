import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE91-0324-3F-2: 2002 three-storey tiled commercial block, white tiled facade,
// tinted glazing, red signage band at street level, recessed entrance bay with
// stone canopy, stone cornice and plant parapet. Storeys are 5 blocks; roof deck
// at ground+15, parapet to ground+16.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0324-3F-2";
const W = 39, H = 28, D = 4;
const STOREY = 5;
const STOREYS = 3;
const ROOF_OFF = STOREY * STOREYS;      // 15: roof deck / cornice
const PARAPET_OFF = ROOF_OFF + 1;       // 16: parapet top
const ENTRANCE_X = [17, 18, 19, 20, 21];
const ENTRANCE_MID = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const PANE_FB = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_END = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const LANTERN_UP = { hanging: "false", waterlogged: "false" };
const LANTERN_DOWN = { hanging: "true", waterlogged: "false" };

const isEntranceBay = (x, z, k) => z === 0 && k === 0 && ENTRANCE_X.includes(x);

// 1. Foundation, floor slabs, roof deck for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let k = 0; k < STOREYS; k++) put(x, gr + k * STOREY, z, "smooth_stone");
  put(x, gr + ROOF_OFF, z, "light_gray_concrete");
}

// 2. Facade, cornice, parapet on exterior cells
for (const [x, z, gr] of cells) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const exterior = front || back || west || east;
  if (!exterior) continue;

  const face = front ? "front" : back ? "back" : "end";
  const cornerZ = z === 0 || z === D - 1;
  const isCorner = (west || east) && (front || back);

  for (let k = 0; k < STOREYS; k++) {
    const base = gr + k * STOREY;
    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (isEntranceBay(x, z, k)) continue;          // recessed doorway left open
      const mullion = isCorner ||
        (face === "end" ? cornerZ : x % 3 === 0);
      if (mullion) put(x, y, z, "quartz_pillar", { axis: "y" });
      else if (face === "end") put(x, y, z, "light_blue_stained_glass_pane", PANE_END);
      else put(x, y, z, "light_blue_stained_glass_pane", PANE_FB);
    }

    const spandrelY = base + 4;
    if (isEntranceBay(x, z, k)) {
      put(x, spandrelY, z, "stone_bricks");           // entrance canopy
    } else if (face === "front" && k === 0) {
      put(x, spandrelY, z, "red_concrete");          // street-level signage band
    } else if (face === "end") {
      put(x, spandrelY, z, "light_gray_concrete");   // darker end spandrel for relief
    } else {
      put(x, spandrelY, z, "white_concrete");
    }
  }

  // cornice and parapet
  put(x, gr + ROOF_OFF, z, "stone_bricks");
  put(x, gr + PARAPET_OFF, z, "white_concrete");
}

// 3. Entrance glazing set back one block behind the street wall
for (const [x, z, gr] of cells) {
  if (z !== 1 || !has(x, 0)) continue;
  if (!ENTRANCE_X.includes(x)) continue;
  for (let r = 1; r <= 3; r++) put(x, gr + r, 1, "glass");
}

// 4. Hanging entrance lantern under the canopy
if (has(ENTRANCE_MID, 0)) {
  put(ENTRANCE_MID, ground.get(`${ENTRANCE_MID},0`) + 3, 0, "lantern", LANTERN_DOWN);
}

// 5. Roof plant on interior roof cells
for (const [x, z, gr] of cells) {
  const interior = has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
  if (interior && x % 6 === 2 && z >= 1 && z <= 2) {
    put(x, gr + PARAPET_OFF, z, "iron_block");
  }
}

// 6. Warm interior lanterns behind the street-front glazing
for (const [x, z, gr] of cells) {
  if (z !== 1 || !has(x, 0)) continue;
  if (x % 3 === 0 || ENTRANCE_X.includes(x)) continue;
  for (let k = 0; k < STOREYS; k++) {
    if ((x * 7 + k) % 4 === 0) {
      put(x, gr + k * STOREY + 1, 1, "lantern", LANTERN_UP);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
