import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1454365466";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 10, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const has = (x, z) => cellMap.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Mid-century Taipei commercial block: cream concrete with quartz storey bands,
// stone base, shopfront glass at ground, two-bay window rhythm with piers,
// flat roof with parapet and a small rooftop plant enclosure.
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const gy = gr;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");

  if (faces.length === 0) {
    // Interior cell: floor slabs, roof deck, no interior fit-out
    put(x, gy, z, "smooth_stone");
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 10, z, "smooth_stone");
    if (x >= 4 && x <= 5 && z >= 4 && z <= 5) {
      put(x, gy + 11, z, "light_gray_concrete");
      put(x, gy + 12, z, "light_gray_concrete");
    }
    if (x === 4 && z === 4) put(x, gy + 13, z, "lightning_rod");
    continue;
  }

  // Perimeter cell: facade
  const corner = faces.length >= 2;
  const onNS = faces.includes("N") || faces.includes("S");
  const p = onNS ? x : z;
  const bayIsWindow = !corner && [1, 2, 4, 5, 7, 8].includes(p);
  const isDoor = !corner && faces.includes("S") && p === 4;

  // Inward neighbour (for glowstone behind glass)
  let inX = x, inZ = z;
  if (faces.includes("E")) inX = x - 1;
  if (faces.includes("W")) inX = x + 1;
  if (faces.includes("S")) inZ = z - 1;
  if (faces.includes("N")) inZ = z + 1;

  const paneProps = onNS ? PANE_NS : PANE_EW;

  for (let r = 0; r <= 12; r++) {
    const y = gy + r;
    let block = "white_concrete";
    let props = undefined;

    if (r === 0) {
      block = "polished_granite";
    } else if (r >= 1 && r <= 3) {
      if (isDoor && r === 1) {
        block = "oak_door";
        props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && r === 2) {
        block = "oak_door";
        props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && r === 3) {
        block = "smooth_quartz";
      } else if (bayIsWindow) {
        block = "gray_stained_glass_pane";
        props = paneProps;
      } else {
        block = "stone_bricks";
      }
    } else if (r === 4) {
      block = "smooth_quartz";
    } else if (r >= 5 && r <= 8) {
      if (bayIsWindow) {
        block = "light_blue_stained_glass_pane";
        props = paneProps;
      } else {
        block = "white_concrete";
      }
    } else if (r === 9) {
      block = "smooth_quartz";
    } else if (r === 10) {
      block = "smooth_quartz";
    } else if (r === 11) {
      block = "white_concrete";
    } else if (r === 12) {
      block = "smooth_quartz_slab";
      props = { type: "bottom", waterlogged: "false" };
    }

    put(x, y, z, block, props);
  }

  // Warm light behind some upper-storey windows (interior air cell)
  if (bayIsWindow && (p === 2 || p === 7) && has(inX, inZ) && (inX !== x || inZ !== z)) {
    put(inX, gy + 6, inZ, "glowstone");
  }
}

g.save(`${dir}/${id}.nbt`);
