import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown-era mid-rise commercial block, Xinyi district, c. 1990s:
// 2 storeys of ~5 blocks, cream tile and white concrete piers, blue glass bands,
// shopfront at ground, flat parapet roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859940";
const W = 25, H = 23, D = 16;
const ROOF_Y = 10;      // parapet top block, ~11 blocks above lowest ground
const STOREY_Y = 5;     // floor line between storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const low = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = Math.floor((minX + maxX) / 2);   // entrance column on the south (max z) front

const paneNS = { east: "true", west: "true", north: "false", south: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false" };

for (const [x, z, gr0] of cells) {
  const gy = gr0 - low;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const ex = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const count = ex.n + ex.s + ex.w + ex.e;

  // interior cells: floor slabs and roof deck only, air between
  if (count === 0) {
    put(x, gy, z, "stone_bricks");
    if (STOREY_Y > gy) put(x, STOREY_Y, z, "smooth_stone");
    if (ROOF_Y >= gy) put(x, ROOF_Y, z, "gray_concrete");
    // plant and cooling equipment standing on the roof deck
    if (x % 7 === 3 && z % 5 === 2) {
      put(x, ROOF_Y + 1, z, "iron_block");
    }
    if (x >= cx + 3 && x <= cx + 4 && z >= 5 && z <= 7) {
      put(x, ROOF_Y + 1, z, "light_gray_concrete");
      put(x, ROOF_Y + 2, z, "light_gray_concrete");
    }
    // warm glowstone behind the shopfront glass
    if (gy + 1 <= 4 && x % 6 === 0) {
      // handled below via shell inward cells; nothing here
    }
    continue;
  }

  // shell (facade) cells
  const corner = count >= 2;
  const onNS = ex.n || ex.s;
  const p = onNS ? x : z;
  const paneProps = onNS ? paneNS : paneEW;
  const pier = corner || p % 4 === 0 || p % 4 === 3;
  const isFront = ex.s && z === maxZ;
  const inward = ex.n ? [x, z + 1] : ex.s ? [x, z - 1] : ex.w ? [x + 1, z] : [x - 1, z];

  for (let y = gy; y <= ROOF_Y; y++) {
    // base course at ground level
    if (y === gy) {
      put(x, y, z, "polished_andesite");
      continue;
    }
    // parapet / cornice
    if (y === ROOF_Y) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // storey line
    if (y === STOREY_Y) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // ground floor: shopfront
    if (y <= 4) {
      if (isFront && x === cx && y === gy + 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isFront && x === cx && y === gy + 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isFront && Math.abs(x - cx) <= 2 && y === gy + 3) {
        // entrance canopy on the facade
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        continue;
      }
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
        if (!corner && y === gy + 1 && (inward[0] !== x || inward[1] !== z) && has(inward[0], inward[1])) {
          // glowstone behind the shopfront glass, some bays
          if (p % 6 === 1) put(inward[0], y, inward[1], "glowstone");
        }
      }
      continue;
    }
    // upper storey windows
    if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      // warm light in some upper windows, placed in the air gap behind the glass
      if (!corner && y === 7 && p % 8 === 1 && has(inward[0], inward[1])) {
        put(inward[0], y, inward[1], "shroomlight");
      }
    }
  }

  // roof deck on shell cells sits on the parapet line; nothing above it except equipment
  if (gy <= ROOF_Y && !corner && pier) {
    // keep piers topped with a quartz cap on the parapet
  }
}

g.save(`${DIR}/${ID}.nbt`);
