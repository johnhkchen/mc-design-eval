import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey, late-1980s/1990s Xinyi commercial strip: white-tiled walls,
// smooth quartz storey lines and pilasters, light-blue glazing, shopfronts with
// a grey fascia on the street face, a stepped parapet, and rooftop AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541459074";
const W = 39, H = 23, D = 13;
const ROOF = 11;          // roof top, about 11 blocks above the lowest ground
const FOUND = "stone_bricks";
const PIL = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connections so runs of glass join up along the facade they sit on.
function glass(axis) {
  return axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Main massing: foundation, floor slabs, walls, parapet, roof.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const front = !has(x, z + 1);
  const back = !has(x, z - 1);
  const ends = !has(x - 1, z) || !has(x + 1, z);
  const ext = front || back || ends;
  const face = front ? "front" : back ? "back" : ends ? "end" : null;
  const u = face === "end" ? z : x;
  const axis = face === "end" ? "z" : "x";
  const T1 = Math.min(Math.max(gr + 4, 5), 7); // ground-storey slab line

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  for (let y = gr; y <= ROOF; y++) {
    let id = null;
    let props;

    if (y === gr) {
      // base course on the walls, plain floor slab inside
      id = ext ? "stone_bricks" : "smooth_stone";
    } else if (y === ROOF) {
      if (ext) {
        id = "stone_brick_slab";
        props = { type: "top", waterlogged: "false" };
      } else {
        id = "light_gray_concrete";
      }
    } else if (y === 9 || y === T1) {
      // storey lines / floor and ceiling slabs (solid everywhere)
      id = PIL;
    } else if (y === 10) {
      // parapet: white wall with quartz pilasters on the street face
      if (ext) id = front && u % 3 === 0 ? PIL : "white_concrete";
    } else if (ext && y < T1) {
      // ground storey
      if (face === "front") {
        if (u % 3 === 0) {
          id = PIL;
        } else if (y === T1 - 1) {
          id = "gray_concrete"; // shop fascia
        } else if (u % 12 === 4 && (y === gr + 1 || y === gr + 2)) {
          id = "dark_oak_door";
          props = {
            facing: "south",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else {
          id = GLASS;
          props = glass(axis);
        }
      } else {
        if (u % 3 === 1 && y <= T1 - 2) {
          id = GLASS;
          props = glass(axis);
        } else {
          id = "white_concrete";
        }
      }
    } else if (ext && y > T1 && y < 9) {
      // upper storey window grid
      if (u % 3 === 0) {
        id = PIL;
      } else {
        id = GLASS;
        props = glass(axis);
      }
    }

    if (id) put(x, y, z, id, props);
  }
}

// Warm lights: lanterns in the shops, glowstone and shroomlight behind upper glass.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (has(x, z + 1)) continue; // only the street face
  const T1 = Math.min(Math.max(gr + 4, 5), 7);
  if (!has(x, z - 1) || gAt(x, z - 1) !== gr) continue;

  if (x % 9 === 7 && gr + 1 < T1 - 1) {
    put(x, gr + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
  const LY = T1 + 2;
  if (LY < 9 && x % 6 === 1) {
    put(x, LY, z - 1, x % 12 === 7 ? "shroomlight" : "glowstone");
  }
}

// Rooftop AC units standing on the roof slab (only where all four cells exist).
const boxes = [[5, 3], [19, 3], [30, 6]];
for (const [bx, bz] of boxes) {
  const ok = [[bx, bz], [bx + 1, bz], [bx, bz + 1], [bx + 1, bz + 1]].every(([a, b]) => has(a, b));
  if (!ok) continue;
  for (let dx = 0; dx < 2; dx++)
    for (let dz = 0; dz < 2; dz++)
      for (let dy = 0; dy < 2; dy++)
        put(bx + dx, ROOF + 1 + dy, bz + dz, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
