import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121243";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 26, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...ground.values());

// Lidar: roof about 11 blocks above lowest ground. Two storeys of ~5 blocks.
const R = minG + 11;   // roof surface / cap level
const F1 = minG + 5;   // second-floor slab and storey line
const F2 = minG + 10;  // cornice (R - 1)

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Build a 1980s-style white-tiled commercial block: stone plinth, light
// concrete walls, quartz piers, tinted glass panes, cornice and parapet.
let entranceCandidates = { n: [], s: [] };

for (const [x, z, gr] of cells) {
  const eW = !has(x - 1, z), eE = !has(x + 1, z);
  const eN = !has(x, z - 1), eS = !has(x, z + 1);
  const perim = eW || eE || eN || eS;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground surface / base course.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // Interior: floor slabs per storey and roof deck; air otherwise (no interiors).
    if (F1 > gr) put(x, F1, z, "smooth_stone");
    if (R > gr) put(x, R, z, "smooth_stone");
    // Roof equipment: small plant boxes on a grid.
    if (x % 6 === 2 && z % 6 === 2 && R + 2 < H) {
      put(x, R + 1, z, "light_gray_concrete");
      put(x, R + 2, z, "light_gray_concrete");
    }
    continue;
  }

  if (eN) entranceCandidates.n.push([x, z, gr]);
  if (eS) entranceCandidates.s.push([x, z, gr]);

  const xFace = (eW || eE) && !(eN || eS);
  const zFace = (eN || eS) && !(eW || eE);
  const corner = (eW || eE) && (eN || eS);
  const along = xFace ? z : zFace ? x : null;

  for (let y = gr + 1; y < R; y++) {
    const ground = y < F1;
    if (y === F1 || y === F2) {
      put(x, y, z, "smooth_stone");                  // storey line / cornice
      continue;
    }
    if (y === F1 - 1) {
      put(x, y, z, "white_concrete");                // transom over shopfront
      continue;
    }
    const isPier = corner || along === null || along % 3 === 0;
    const winBand = (y > gr && y < F1 - 1) || (y > F1 && y < F2);
    if (isPier) {
      put(x, y, z, ground ? "stone_bricks" : "smooth_quartz");
    } else if (winBand) {
      if (!ground && along % 9 === 4 && y === F1 + 2) {
        put(x, y, z, "shroomlight");                 // warm light in a window
      } else {
        const props = xFace
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet cap on the perimeter.
  put(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Main entrance: centred on the north face (or south if no north face).
let door = null;
const pickCentral = (list) => {
  if (!list.length) return null;
  const mean = list.reduce((s, c) => s + c[0], 0) / list.length;
  return list.reduce((best, c) => (Math.abs(c[0] - mean) < Math.abs(best[0] - mean) ? c : best));
};
if (entranceCandidates.n.length) door = { c: pickCentral(entranceCandidates.n), facing: "north" };
else if (entranceCandidates.s.length) door = { c: pickCentral(entranceCandidates.s), facing: "south" };

if (door) {
  const [dx, dz, dg] = door.c;
  const base = { facing: door.facing, hinge: "left", open: "false", powered: "false" };
  put(dx, dg + 1, dz, "dark_oak_door", { ...base, half: "lower" });
  put(dx, dg + 2, dz, "dark_oak_door", { ...base, half: "upper" });
  // Lanterns flanking the entrance inside the shopfront line.
  const side = door.facing === "north" ? [[dx - 1, dz], [dx + 1, dz]] : [[dx - 1, dz], [dx + 1, dz]];
  for (const [sx, sz] of side) {
    if (has(sx, sz)) put(sx, dg + 3, sz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
