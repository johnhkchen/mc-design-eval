import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280247";
const W = 7, H = 33, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Only writes inside the grid and on footprint cells
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exposed faces of a footprint cell (neighbour missing from footprint)
const exposed = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Interior neighbour one step inward from an exposed face
const inward = (x, z, face) => {
  if (face === "N") return [x, z + 1];
  if (face === "S") return [x, z - 1];
  if (face === "W") return [x + 1, z];
  return [x - 1, z];
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const FLOORS = 4;      // four storeys of 5 blocks
const STOREY = 5;
const ROOF_OFFSET = 21; // roof about 21 blocks above the cell's ground

for (const [x, z, gr] of cells) {
  const base = gr;

  // 1. Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // 2. Floor slabs per storey and roof slab
  for (let k = 0; k < FLOORS; k++) put(x, base + STOREY * k, z, "white_concrete");
  put(x, base + 20, z, "gray_concrete");

  // 3. Perimeter walls, windows, shopfront, storey bands
  const fc = exposed(x, z);
  if (fc.length > 0) {
    const corner = fc.length >= 2;
    const face = fc[0];
    const alongN_S = face === "N" || face === "S";
    const t = alongN_S ? x : z;
    const last = alongN_S ? W - 1 : D - 1;
    const win = !corner && t > 0 && t < last && t % 2 === 1;
    const frontN = face === "N" && !corner;
    const door = frontN && x === 3;
    const paneProps = alongN_S ? PANE_NS : PANE_EW;

    for (let k = 0; k < FLOORS; k++) {
      const yb = base + STOREY * k;

      if (k === 0) {
        // Ground storey: commercial shopfront on the street (north) face
        if (frontN) {
          if (door) {
            put(x, yb + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
            put(x, yb + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
            put(x, yb + 3, z, "light_gray_concrete");
          } else {
            put(x, yb + 1, z, "polished_andesite");
            put(x, yb + 2, z, "light_blue_stained_glass");
            put(x, yb + 3, z, "light_blue_stained_glass");
          }
        } else {
          put(x, yb + 1, z, "gray_concrete");
          for (const dy of [2, 3]) {
            if (win) put(x, yb + dy, z, "light_blue_stained_glass_pane", paneProps);
            else put(x, yb + dy, z, "gray_concrete");
          }
        }
      } else {
        // Upper storeys: white concrete frame with window bands
        put(x, yb + 1, z, "white_concrete");
        for (const dy of [2, 3]) {
          if (win) put(x, yb + dy, z, "light_blue_stained_glass_pane", paneProps);
          else put(x, yb + dy, z, "white_concrete");
        }
      }

      // Storey line / spandrel band
      put(x, yb + 4, z, "smooth_stone");

      // Warm light on the interior floor behind some windows
      if (win && (t + k) % 3 === 0) {
        const [ix, iz] = inward(x, z, face);
        if (has(ix, iz)) put(ix, yb + 1, iz, "glowstone");
      }
    }

    // Cornice and parapet
    put(x, base + 20, z, "smooth_stone");
    put(x, base + 21, z, "smooth_stone");
  }

  // 4. Roof plant: a small cooling housing in the middle of the roof
  if (fc.length === 0 && x >= 2 && x <= 4 && z >= 8 && z <= 11) {
    put(x, base + 21, z, "light_gray_concrete");
    put(x, base + 22, z, "light_gray_concrete");
  }

  // Lightning rod on top of the plant housing
  if (x === 3 && z === 9) {
    put(x, base + 23, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
