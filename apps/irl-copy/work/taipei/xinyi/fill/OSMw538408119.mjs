import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408119";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Ground per footprint cell, normalised so the lowest ground under the building is y 0.
const ground = new Map();
let gMin = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < gMin) gMin = gr;
}
const inS = (x, z) => ground.has(`${x},${z}`);

// Design: two-storey mid-century concrete commercial block with a shopfront ground floor,
// a banded upper floor of tinted glazing, a white parapet and rooftop plant.
// Storey lines: ground floor y 0..4, upper floor y 5..9, parapet cap y 10, plant y 11.
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const g0 = gr - gMin;
  const perimeter = !inS(x, z - 1) || !inS(x + 1, z) || !inS(x, z + 1) || !inS(x - 1, z);
  const pillar = (x + z) % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  for (let y = g0; y <= 10; y++) {
    if (perimeter) {
      let id;
      if (y === 10) id = "white_concrete";                       // parapet cap
      else if (y === 0) id = "stone_bricks";                     // base course
      else if (y === 4) id = "smooth_stone";                     // ground-floor lintel
      else if (y === 5 || y === 6 || y === 9) id = "light_gray_concrete"; // storey lines and sills
      else if (y < 4) id = pillar ? "white_concrete" : "light_blue_stained_glass"; // shopfront
      else id = pillar ? "white_concrete" : "light_blue_stained_glass";           // upper glazing (y 7-8)

      put(x, y, z, id);

      // Warm light behind some upper-floor glazing.
      if (y === 7 && !pillar && (x * 5 + z * 3) % 9 === 0) put(x, y, z, "shroomlight");
      if (y === 2 && !pillar && (x * 7 + z * 2) % 11 === 0) put(x, y, z, "shroomlight");
    } else {
      // Interior: only floor slabs and the roof deck; air elsewhere (no interiors).
      if (y === 5 || y === 10) put(x, y, z, "light_gray_concrete");
    }
  }

  // Rooftop plant on interior roof cells.
  if (!perimeter && (x % 5 === 2) && (z % 6 === 2)) {
    put(x, 11, z, "iron_block");
  }
}

// Entrance: on the north-facing row of perimeter cells, take the middle cell.
const northRow = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!inS(x, z - 1)) northRow.push([x, z]);
}
if (northRow.length) {
  northRow.sort((a, b) => a[0] - b[0]);
  const [dx, dz] = northRow[Math.floor(northRow.length / 2)];
  const dg = ground.get(`${dx},${dz}`) - gMin;
  const base = Math.max(1, dg);
  put(dx, base, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, base + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the door.
  put(dx, base + 2, dz, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
