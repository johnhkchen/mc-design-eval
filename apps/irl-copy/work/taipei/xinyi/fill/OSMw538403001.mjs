import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-district shophouse, c. 1980s: white-tiled concrete frame,
// stone-clad storefront base, ribbon windows with grey mullions, flat parapet roof
// with plant boxes. Two storeys of 5 blocks plus a 1-block parapet (roof 11 above ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403001";
const W = 29, D = 8, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, h] of cells) ground.set(`${x},${z}`, h);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Front (street) facade, z = 0
function frontBlock(x, r) {
  const pil = x % 4 === 0;
  if (r === 0) return ["stone_bricks"];
  if (r <= 4) {
    if (pil) return ["stone_bricks"];
    if (x === 14) {
      if (r === 1) return ["oak_door", doorLower];
      if (r === 2) return ["oak_door", doorUpper];
      return ["light_gray_concrete"];
    }
    if (r === 4) return ["light_gray_concrete"];
    return ["glass"];
  }
  if (r === 5) return [x % 3 === 0 ? "gray_concrete" : "white_concrete"];
  if (r <= 8) return [x % 3 === 0 ? "gray_concrete" : "glass"];
  if (r === 9) return ["light_gray_concrete"];
  return ["smooth_stone"]; // parapet
}

// Back facade, z = D-1
function backBlock(x, r) {
  if (r === 0) return ["stone_bricks"];
  if (r === 4 || r === 9) return ["light_gray_concrete"];
  if (r === 10) return ["smooth_stone"];
  if (r <= 3) return [x % 4 === 2 ? "glass" : "white_concrete"];
  if (r >= 6 && r <= 8) return [x % 3 === 0 ? "gray_concrete" : "glass"];
  return ["white_concrete"];
}

// End walls, x = 0 or W-1 (z in 1..6)
function endBlock(z, r) {
  if (r === 0) return ["stone_bricks"];
  if (r === 4 || r === 9) return ["light_gray_concrete"];
  if (r === 10) return ["smooth_stone"];
  if (r >= 6 && r <= 8 && (z === 3 || z === 4)) return ["glass"];
  return ["white_concrete"];
}

function facade(x, z, r) {
  if (z === 0) return frontBlock(x, r);
  if (z === D - 1) return backBlock(x, r);
  return endBlock(z, r);
}

for (const [x, z, gh] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const b = gh;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  if (!perimeter) {
    // Interior: floor slabs, roof deck, air gap behind the glass
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 10, z, "gray_concrete");

    // Warm lights behind front glazing (z = 1)
    if (z === 1 && x % 8 === 2 && x >= 1 && x <= W - 2) put(x, b + 2, z, "glowstone");
    if (z === 1 && x % 6 === 1 && x % 3 !== 0) put(x, b + 7, z, "glowstone");

    // Roof equipment on the deck
    if (((x === 6 || x === 7) && (z === 2 || z === 3)) ||
        ((x === 20 || x === 21) && (z === 4 || z === 5))) {
      put(x, b + 11, z, "iron_block");
    }
    continue;
  }

  // Perimeter: full wall from ground to parapet, no gaps
  for (let r = 0; r <= 10; r++) {
    const [id, props] = facade(x, z, r);
    put(x, b + r, z, id, props);
  }
}

g.save(`${DIR}/${ID}.nbt`);
