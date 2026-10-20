import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683418";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Two-storey (5 blocks each) concrete-and-tile commercial block, 1960s-80s Taipei:
// stone-base shopfront with a central entrance on the north (street) face,
// quartz-tile upper walls with glass bays, cornice band and parapet, roof deck and a small tank.
const ENTRANCE = Math.floor(W / 2); // 7

// Returns [blockId, props?] for a face wall cell at relative row rel (1..9).
function faceBlock(face, x, z, rel) {
  const i = (face === "n" || face === "s") ? x : z;
  const ground = rel <= 4;

  if (ground && face === "n") {
    if (i === ENTRANCE) {
      if (rel <= 2) return ["door", rel === 1 ? "lower" : "upper"];
      if (rel === 3) return ["glass_pane"];
      return ["dark_oak_planks"]; // fascia / canopy over the entrance
    }
    if (rel === 1) return ["polished_andesite"]; // shopfront plinth
    if (rel === 4) return ["dark_oak_planks"];    // shop fascia
    if (i % 3 === 0) return ["smooth_quartz"];    // mullion
    return ["glass_pane"];
  }

  if (rel === 1 && ground) return ["stone_bricks"];         // base course
  const rows = ground ? [2, 3] : [7, 8];
  if (rel === rows[0] || rel === rows[1]) {
    if (i % 3 === 0) return ["smooth_quartz"];               // mullion
    if (rel === rows[1] && i % 4 === 1) return ["glowstone"]; // warm light behind glass
    return ["glass_pane"];
  }
  return ["smooth_quartz"]; // spandrel / wall
}

for (const [x, z, gy] of cells) {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const faces = [];
  if (missN) faces.push("n");
  if (missS) faces.push("s");
  if (missW) faces.push("w");
  if (missE) faces.push("e");
  const edge = faces.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line and the roof deck.
  put(x, gy, z, edge ? "stone_bricks" : "smooth_stone");
  put(x, gy + 5, z, "smooth_stone");
  put(x, gy + 11, z, "light_gray_concrete");

  if (!edge) continue;

  // Cornice band and parapet.
  put(x, gy + 10, z, "stone_bricks");
  put(x, gy + 12, z, "smooth_quartz");

  const isCorner = faces.length >= 2;
  for (const rel of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const y = gy + rel;
    if (isCorner) {
      put(x, y, z, "quartz_pillar");
      continue;
    }
    // Prefer the street (north) face when a cell is exposed on more than one side.
    const face = faces[0];
    const [id, state] = faceBlock(face, x, z, rel);
    if (id === "door") {
      put(x, y, z, "oak_door", {
        facing: "south", half: state, hinge: "left", open: "false", powered: "false",
      });
    } else {
      put(x, y, z, id);
    }
  }
}

// Rooftop water tank on a small central block, if the footprint allows it.
for (const [x, z, gy] of cells) {
  const interiorBlock =
    has(x, z) && has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1) &&
    x >= 5 && x <= 7 && z >= 4 && z <= 6;
  if (!interiorBlock || x !== 6 || z !== 5) continue;
  if (gy + 14 >= H) continue;
  for (const [tx, tz] of [[6, 5], [7, 5], [6, 6], [7, 6]]) {
    if (!has(tx, tz)) continue;
    put(tx, gy + 12, tz, "stone_bricks");
    put(tx, gy + 13, tz, "stone_bricks");
    put(tx, gy + 14, tz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
