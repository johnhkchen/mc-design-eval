import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0160-3F";
const W = 9, H = 28, D = 4;

// Built 2001, roof ~16 above lowest ground: a three-storey (5 blocks each)
// white-tiled commercial block with a ground-floor shopfront, quartz belt
// courses, a parapet and a lit roof deck. All cells share one roof line.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, state) => {
  if (y < 0 || y >= H) return;
  if (state) g.set(x, y, z, id, state);
  else g.set(x, y, z, id);
};

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

const PILLAR = { axis: "y" };
const LANTERN_STAND = { hanging: "false", waterlogged: "false" };
const LANTERN_HANG = { hanging: "true", waterlogged: "false" };

// Facade block for an edge cell at dy above its own ground.
function facadeBlock(x, z, dy) {
  const corner = isCorner(x, z);
  const front = z === 0 || z === D - 1;
  const win = front ? x % 2 === 1 : (z === 1 || z === 2);
  const entrance = z === 0 && (x === 3 || x === 4 || x === 5);

  if (dy === 0) return ["polished_andesite"];
  if (corner) return ["quartz_pillar", PILLAR];
  if (dy === 4 || dy === 5 || dy === 10) return ["smooth_quartz"];

  // Ground storey: shopfront with a quartz door surround on the street face.
  if (dy >= 1 && dy <= 3) {
    if (entrance) {
      if (x === 4) {
        if (dy === 1) return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
        if (dy === 2) return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
        return ["lantern", LANTERN_HANG];
      }
      return ["quartz_pillar", PILLAR];
    }
    return win ? ["glass"] : ["white_concrete"];
  }

  // Upper storeys: three window rows per storey, spandrels between.
  if ((dy >= 6 && dy <= 8) || (dy >= 11 && dy <= 13)) {
    return win ? ["light_blue_stained_glass"] : ["white_concrete"];
  }
  if (dy === 9 || dy === 14) return ["white_concrete"];

  return ["white_concrete"];
}

// Common roof line: lowest ground + 16. Other cells stop at the same line.
const L = Math.min(...cells.map(([, , gr]) => gr));
const R = L + 16;          // parapet top
const DECK = R - 1;        // roof deck

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const base = gr;
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, base, z, edge ? "polished_andesite" : "smooth_stone");

  for (let y = base + 1; y <= R; y++) {
    const dy = y - base;
    if (y === DECK) {
      put(x, y, z, "smooth_quartz");                // roof deck, full footprint
    } else if (y === R) {
      if (edge) put(x, y, z, corner ? "quartz_pillar" : "white_concrete", corner ? PILLAR : undefined); // parapet
      else if (x >= 5 && x <= 6 && z >= 1 && z <= 2) put(x, y, z, "light_gray_concrete"); // roof plant
    } else if (y < DECK) {
      if (edge) {
        const b = facadeBlock(x, z, dy);
        if (b) put(x, y, z, b[0], b[1]);
      } else {
        // Interior: air behind glass, floor slabs at storey lines.
        if (dy === 5 || dy === 10) put(x, y, z, "smooth_stone");
      }
    }
  }

  // Warm lights behind some upper windows (interior side of glass).
  if (!edge) {
    for (const dy of [7, 12]) {
      const y = base + dy;
      if (y >= DECK) continue;
      if (z === 1 && (x === 3 || x === 5)) put(x, y, z, "glowstone");
      if (z === 2 && (x === 3 || x === 5)) put(x, y, z, "glowstone");
    }
  }

  // Parapet corner lanterns.
  if (corner) put(x, R + 1, z, "lantern", LANTERN_STAND);
}

g.save(`${DIR}/${ID}.nbt`);
