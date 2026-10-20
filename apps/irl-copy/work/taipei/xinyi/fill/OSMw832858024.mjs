import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858024";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const K = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, gr]) => [K(x, z), gr]));
const has = (x, z) => foot.has(K(x, z));
const DV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => {
  const o = [];
  if (!has(x, z - 1)) o.push("north");
  if (!has(x, z + 1)) o.push("south");
  if (!has(x - 1, z)) o.push("west");
  if (!has(x + 1, z)) o.push("east");
  return o;
};
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: median-x cell on the north face (lowest z side of the footprint).
const northCells = cells
  .filter(([x, z]) => outward(x, z).length === 1 && outward(x, z)[0] === "north")
  .sort((a, b) => a[0] - b[0]);
const entrance = northCells.length
  ? northCells[Math.floor(northCells.length / 2)]
  : null;
const entKey = entrance ? K(entrance[0], entrance[1]) : null;

// Foundations, floors, roof.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  // Floor slabs at storey lines and roof deck.
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "smooth_quartz");
}

// Facades.
for (const [x, z, gr] of cells) {
  const ob = outward(x, z);
  if (ob.length === 0) continue;
  const face = ob[0];
  const corner = ob.length >= 2;
  const idx = (face === "north" || face === "south") ? x : z;
  const paneProps = (face === "north" || face === "south") ? PANE_NS : PANE_EW;
  const isEntrance = K(x, z) === entKey;

  // Base course.
  put(x, gr + 1, z, "polished_andesite");

  // Storey 1 and storey 2 window bands.
  const bands = [[gr + 2, gr + 4], [gr + 6, gr + 9]];
  bands.forEach(([y0, y1], bi) => {
    for (let y = y0; y <= y1; y++) {
      const pillar = corner || idx % 3 === 0;
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  });

  // Cornice, roof edge, parapet with cap.
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "smooth_quartz");
  put(x, gr + 12, z, "white_concrete");
  put(x, gr + 13, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Entrance on the north face: open glass doorway with dark frame.
  if (isEntrance) {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass");
    put(x, gr + 4, z, "black_concrete");
  }

  // Warm light behind some windows.
  const inX = x - DV[face][0], inZ = z - DV[face][1];
  const inwardInterior = has(inX, inZ) && outward(inX, inZ).length === 0;
  if (inwardInterior && !corner && idx % 3 !== 0) {
    if (idx % 6 === 1) put(inX, gr + 7, inZ, "glowstone");
    if (idx % 6 === 4) put(inX, gr + 3, inZ, "shroomlight");
  }
}

// Roof plant: a central mechanical block with a stone cap.
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx0 = Math.min(...xs), cx1 = Math.max(...xs);
const cz0 = Math.min(...zs), cz1 = Math.max(...zs);
const mx0 = cx0 + Math.floor((cx1 - cx0) / 3), mx1 = cx1 - Math.floor((cx1 - cx0) / 3);
const mz0 = cz0 + Math.floor((cz1 - cz0) / 3), mz1 = cz1 - Math.floor((cz1 - cz0) / 3);
for (const [x, z, gr] of cells) {
  if (outward(x, z).length !== 0) continue;
  if (x < mx0 || x > mx1 || z < mz0 || z > mz1) continue;
  put(x, gr + 12, z, "light_gray_concrete");
  put(x, gr + 13, z, "light_gray_concrete");
  put(x, gr + 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
