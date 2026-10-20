import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292942";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 38, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
const cellList = [];
for (const [x, z, gr0] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  if (ground.has(key(x, z))) continue;
  const gr = Math.round(gr0);
  ground.set(key(x, z), gr);
  cellList.push([x, z, gr]);
}
if (cellList.length === 0) throw new Error("no footprint cells");

const base = Math.min(...cellList.map((c) => c[2]));
const top = base + 25;   // last body course (cornice / roof deck)
const R = base + 26;     // roof plane: 5 storeys of 5 blocks + 1 parapet course

const has = (x, z) => ground.has(key(x, z));
const edgeX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const edgeZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main entrance: middle of the south (max z) face.
const southCells = cellList
  .filter(([x, z]) => !has(x, z + 1) && (edgeX(x, z) || edgeZ(x, z)))
  .sort((a, b) => a[0] - b[0]);
const door = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

for (const [x, z, gr] of cellList) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perimeter = edgeX(x, z) || edgeZ(x, z);
  // Along-face coordinate for the facade rhythm.
  const u = edgeZ(x, z) ? x : z;
  const isDoor = door && door[0] === x && door[1] === z;

  for (let y = gr; y <= top; y++) {
    if (!perimeter) {
      // Interior: floor slab per storey and roof deck, air otherwise.
      if (y === top) put(x, y, z, "light_gray_concrete");
      else if (y === gr || (y - base) % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top) {
      put(x, y, z, "smooth_stone"); // cornice
      continue;
    }

    const rel = y - base;
    const k = Math.floor(rel / 5);
    const o = rel % 5;

    if (isDoor && y === gr) {
      put(x, y, z, "dark_oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 1) {
      put(x, y, z, "dark_oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    const pier = u % 3 === 0;
    const lit = !pier && o >= 1 && o <= 3 && (u * 7 + k * 5 + o * 3) % 13 === 0;

    let id;
    if (k === 0) {
      if (o === 0) id = "polished_granite";          // base course
      else if (o === 3) id = "light_gray_concrete";  // shopfront fascia
      else if (o === 4) id = "white_concrete";       // upper band under storey line
      else id = pier ? "quartz_block" : lit ? "glowstone" : "glass";
    } else {
      if (o === 0) id = "light_gray_concrete";       // spandrel at storey line
      else if (o === 4) id = "white_concrete";
      else id = pier ? "quartz_block" : lit ? "glowstone" : "glass";
    }
    put(x, y, z, id);
  }
}

// Plant room on the roof, centred, standing on the interior roof deck.
const isInterior = (x, z) => has(x, z) && !(edgeX(x, z) || edgeZ(x, z));
for (let x = 7; x <= 14; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!isInterior(x, z)) continue;
    const rim = x === 7 || x === 14 || z === 6 || z === 13;
    if (rim) {
      put(x, R, z, "light_gray_concrete");
      put(x, R + 1, z, "light_gray_concrete");
    }
    put(x, R + 2, z, "gray_concrete");
  }
}
if (isInterior(10, 9)) put(10, R + 3, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Warm lanterns at the roof corners.
for (const [x, z] of [[2, 2], [W - 3, 2], [2, D - 3], [W - 3, D - 3]]) {
  if (isInterior(x, z)) put(x, R, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
