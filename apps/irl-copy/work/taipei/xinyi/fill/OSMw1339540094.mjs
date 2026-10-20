import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339540094";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 19, D = 5;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const set = new Set(cells.map(([x, z]) => key(x, z)));
const lo = Math.min(...cells.map(([, , gr]) => Math.round(gr)));

const ROOF = 7;                       // roof plane height above lowest ground
const SLAB = { type: "bottom", waterlogged: "false" };
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Shopfront and upper facade on the street (z = min) face.
function frontSpec(x, y) {
  if (y === 4) return x >= 5 && x <= 7 ? ["gold_block"] : ["red_concrete"];
  if (y <= 3) {
    if (x === 0 || x === 12) return ["smooth_quartz"];
    if (x === 4 || x === 8) return ["black_concrete"];
    if (x === 6) {
      if (y === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    return ["glass"];
  }
  // y 5..6 upper windows
  if (x === 0 || x === 12) return ["smooth_quartz"];
  if (x === 4 || x === 8) return ["black_concrete"];
  if (y === 6) return ["black_concrete"];
  return ["glass_pane", PANE_EW];
}

// Back (max z) face: plain quartz with a few upper windows.
function backSpec(x, y) {
  if (y === 4) return ["red_concrete"];
  if (y <= 3) return ["smooth_quartz"];
  if (y === 5 && (x === 2 || x === 6 || x === 10)) return ["glass_pane", PANE_EW];
  return ["smooth_quartz"];
}

// Side faces (min or max x).
function sideSpec(y, z) {
  if (y === 4) return ["red_concrete"];
  if (y <= 3) return ["smooth_quartz"];
  if (y === 5 && z >= 1 && z <= 3) return ["glass_pane", PANE_NS];
  if (y === 6 && z >= 1 && z <= 3) return ["black_concrete"];
  return ["smooth_quartz"];
}

for (const [x, z, gr] of cells) {
  const G = Math.round(gr) - lo;
  const top = Math.max(ROOF, G + 2);
  const front = !set.has(key(x, z - 1));
  const back = !set.has(key(x, z + 1));
  const sideW = !set.has(key(x - 1, z));
  const sideE = !set.has(key(x + 1, z));
  const edge = front || back || sideW || sideE;

  for (let y = 0; y < H; y++) {
    let s = null;

    if (y < G) {
      s = ["stone_bricks"];                              // foundation down to ground
    } else if (y === top) {
      s = ["gray_concrete"];                             // roof membrane
    } else if (y > top) {
      if (edge && y === top + 1) s = ["smooth_quartz"];  // parapet
      else if (edge && y === top + 2) s = ["smooth_stone_slab", SLAB]; // cap
      else if (!edge && y === top + 1 && x >= 2 && x <= 4 && z >= 1 && z <= 3)
        s = ["iron_block"];                              // rooftop AC units
    } else if (!edge) {
      // interior: air gap, floor slabs, warm lights
      if (y === G) s = ["smooth_stone"];
      else if (y === 4) s = ["smooth_quartz"];
      else if (z === 1 && (x === 2 || x === 6 || x === 10) && y === 5) s = ["shroomlight"];
      else if (z === 1 && (x === 2 || x === 10) && y === G + 1 && y <= 3) s = ["glowstone"];
    } else {
      // edge walls
      if (y === G) s = ["polished_andesite"];           // base course
      else if (front) s = frontSpec(x, y);
      else if (back) s = backSpec(x, y);
      else s = sideSpec(y, z);
    }

    if (s) put(x, y, z, s[0], s[1]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
