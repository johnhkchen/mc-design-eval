import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951315";
const W = 21, H = 23, D = 13;

// Record: no building data. Read as a two-storey 1980s-90s Taipei commercial block:
// white-tiled concrete frame, pillared window bays, shopfront at street level,
// red terracotta fascia, stone cornice, parapet, rooftop AC plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const inside = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const glassNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const slabBottom = { type: "bottom", waterlogged: "false" };

// Returns the wall block for a non-corner perimeter tile at row r (y = b + r).
function wallTile(x, z, r, onNS, faceN) {
  const t = onNS ? x : z;
  if (t % 3 === 0) return { id: "light_gray_concrete" };          // pillar / mullion frame
  if (r === 4) return { id: faceN ? "red_terracotta" : "white_concrete" }; // shopfront fascia
  if (r <= 3) {                                                    // ground-floor shopfront
    if (faceN && x === 10) {
      if (r === 1) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (r === 2) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { id: "lantern", props: { hanging: "true", waterlogged: "false" } };
    }
    return { id: "glass_pane", props: onNS ? glassNS : glassEW };
  }
  if (r === 9) return { id: "white_concrete" };                    // storey-2 lintel band
  // storey-2 windows, rows 6..8, some lit warm from behind
  if (r === 7 && t % 6 === 2) return { id: "glowstone" };
  return { id: "glass_pane", props: onNS ? glassNS : glassEW };
}

for (const [x, z, gr] of cells) {
  const b = Math.max(0, Math.round(gr));
  const N = !inside(x, z - 1), S = !inside(x, z + 1);
  const Wf = !inside(x - 1, z), E = !inside(x + 1, z);
  const faces = [N, S, Wf, E].filter(Boolean).length;
  const perim = faces > 0;
  const corner = faces >= 2;
  const onNS = N || S;
  const faceN = N;

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "cobblestone");

  // Ground-storey slab / base course
  put(x, b, z, perim ? "stone_bricks" : "smooth_stone");

  // Storey walls: ground storey rows 1..4, storey two rows 6..9
  if (perim) {
    for (const r of [1, 2, 3, 4, 6, 7, 8, 9]) {
      if (corner) {
        put(x, b + r, z, "light_gray_concrete");
      } else {
        const tile = wallTile(x, z, r, onNS, faceN);
        put(x, b + r, z, tile.id, tile.props);
      }
    }
  }

  // Storey-two floor slab / belt course
  put(x, b + 5, z, "smooth_stone");

  // Roof: cornice and parapet on the perimeter, roof deck inside
  if (perim) {
    put(x, b + 10, z, "stone_brick_slab", slabBottom);
    put(x, b + 11, z, "white_concrete");
  } else {
    put(x, b + 10, z, "light_gray_concrete");
    if (x % 4 === 1 && z % 3 === 1) put(x, b + 11, z, "iron_block");   // AC plant
  }
}

g.save(`${DIR}/${ID}.nbt`);
