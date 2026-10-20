import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block (white tiled concrete, light-grey bands,
// glazed shopfront), flat roof with a 1-block parapet, roof-top plant and a stair bulkhead.
// Roof/parapet top sits at y 11 (about 11 blocks above the lowest ground); storeys are 5 blocks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121686";
const W = 20, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------------
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const pane = (x, z) => ({
  north: has(x, z - 1) ? "true" : "false",
  south: has(x, z + 1) ? "true" : "false",
  east: has(x + 1, z) ? "true" : "false",
  west: has(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

// ---- entrance: middle of the front (lowest z) face ---------------------------
const minZ = Math.min(...cells.map(([, z]) => z));
const frontCells = cells.filter(([x, z]) => z === minZ && isEdge(x, z));
const frontNonCorner = frontCells.filter(([x, z]) => !isCorner(x, z));
const pool = frontNonCorner.length ? frontNonCorner : frontCells;
const meanX = pool.reduce((s, [x]) => s + x, 0) / pool.length;
const doorCell = pool.reduce((best, c) =>
  Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best
);
const door = { x: doorCell[0], z: doorCell[1] };

// ---- roof-top plant placement -------------------------------------------------
const cx = Math.round(cells.reduce((s, [x]) => s + x, 0) / cells.length);
const cz = Math.round(cells.reduce((s, [, z]) => s + z, 0) / cells.length);

// ---- main pass -----------------------------------------------------------------
for (const [x, z, gy] of cells) {
  // foundation up to ground, floor surface at ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, gy, z, "polished_granite");

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 3 === 0;

  if (edge) {
    for (let y = gy + 1; y <= 11; y++) {
      if (y === 11) {
        put(x, y, z, "smooth_stone"); // parapet
      } else if (y === 10) {
        put(x, y, z, "light_gray_concrete"); // cornice
      } else if (y === 9 || y === 6 || y === 5) {
        put(x, y, z, "light_gray_concrete"); // spandrels and floor belt course
      } else if (y === 7 || y === 8) {
        if (pier) {
          put(x, y, z, "white_concrete");
        } else if ((x * 3 + z * 5) % 11 === 0 && y === 7) {
          put(x, y, z, "glowstone"); // warm lit room behind the glass
        } else {
          put(x, y, z, "glass_pane", pane(x, z));
        }
      } else if (y <= 4) {
        if (y === 4) {
          put(x, y, z, "light_gray_concrete"); // shopfront lintel
        } else if (pier) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "glass_pane", pane(x, z));
        }
      }
    }

    // entrance: double door under lintel, hanging lantern
    if (x === door.x && z === door.z && gy + 2 <= 3) {
      const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gy + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
      put(x, gy + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
      if (gy + 3 < 4) put(x, gy + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // interior: floor slabs at storey lines only, air elsewhere
    if (gy < 5) put(x, 5, z, "smooth_stone");
    if (gy < 10) put(x, 10, z, "gray_concrete"); // roof deck

    // roof-top equipment and stair bulkhead
    const inBulk = Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1;
    if (inBulk) {
      for (let y = 11; y <= 13; y++) put(x, y, z, "stone_bricks");
      put(x, 13, z, "chiseled_stone_bricks");
    } else if ((x * 5 + z * 3) % 7 === 0) {
      put(x, 11, z, "iron_block"); // AC plant
    }
  }
}

// lightning rod on top of the bulkhead, if the centre is a real roof cell
if (has(cx, cz) && !isEdge(cx, cz)) {
  put(cx, 14, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
