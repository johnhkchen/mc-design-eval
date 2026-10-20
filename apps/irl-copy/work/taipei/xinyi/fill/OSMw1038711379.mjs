import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a 1990s-2000s Xinyi office block: four storeys of
// light concrete with a blue-tinted glass curtain wall, white mullions and a
// stone-clad ground-floor shopfront, a parapet, and a roof plant box with a core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711379";
const W = 26, H = 33, D = 16;
const ROOF = 20;      // roof slab level (top of storey 4)
const PARAPET = 21;   // parapet course on the ring

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const g = new Voxels([W, H, D]);

const inside = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const isRing = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const SLAB = "light_gray_concrete";
const MULL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const SPAN = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const PARA = "white_concrete";

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < Math.round(gr); y++) put(x, y, z, FOUND);
}

// 2. Floor slabs at each storey line (y = 0, 5, 10, 15) and the roof slab (y = 20).
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let k = 0; k <= 4; k++) {
    const y = 5 * k;
    if (y >= gr) put(x, y, z, SLAB);
  }
}

// 3. Perimeter curtain wall: mullions every 3 cells, glass in the window bands,
//    spandrels under each window band, stone-clad lintel course at street level.
for (const [x, z, gr0] of cells) {
  if (!isRing(x, z)) continue;
  const gr = Math.round(gr0);
  const onZEdge = z === 0 || z === D - 1;
  const pos = onZEdge ? x : z;
  const end = onZEdge ? W - 1 : D - 1;
  const mullion = pos % 3 === 0 || pos === end;

  for (let y = gr; y < ROOF; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    if (r === 0) continue; // slab already placed
    if (mullion) put(x, y, z, MULL);
    else if (r === 4) put(x, y, z, k === 0 ? BASE : SPAN);
    else if (k === 0 && r === 3) put(x, y, z, BASE);
    else put(x, y, z, GLASS);
  }
}

// 4. Entrance on the south (z = D-1) face, centre: door flanked by glass.
const doorX = 12;
const doorBase = (() => {
  const gr = groundAt(doorX, D - 1);
  return gr === undefined ? 0 : Math.round(gr);
})();
if (inside(doorX, D - 1)) {
  put(doorX, doorBase + 1, D - 1, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, doorBase + 2, D - 1, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}
for (const x of [11, 13]) {
  const gr = groundAt(x, D - 1);
  if (gr === undefined) continue;
  for (const y of [Math.round(gr) + 1, Math.round(gr) + 2]) put(x, y, D - 1, GLASS);
}

// 5. Warm lights behind the glass: glowstone one cell inside the west and east
//    ring on alternating storeys, in a staggered pattern.
for (let k = 0; k <= 3; k++) {
  const y = 5 * k + 2;
  for (let z = 2; z <= D - 3; z++) {
    if ((z + k) % 4 !== 0) continue;
    for (const x of [1, W - 2]) {
      if (!inside(x, z)) continue;
      const gr = Math.round(groundAt(x, z));
      if (y >= gr) put(x, y, z, "glowstone");
    }
  }
}

// 6. Parapet course around the roof edge.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (isRing(x, z)) put(x, PARAPET, z, PARA);
}

// 7. Roof plant box (louvred walls, smooth cap) and a lift core with a mast.
const BOX = { x0: 8, x1: 17, z0: 5, z1: 10 };
for (let x = BOX.x0; x <= BOX.x1; x++) {
  for (let z = BOX.z0; z <= BOX.z1; z++) {
    const edge = x === BOX.x0 || x === BOX.x1 || z === BOX.z0 || z === BOX.z1;
    for (let y = PARAPET; y <= 23; y++) {
      if (edge) put(x, y, z, "stone_bricks");
    }
    put(x, 24, z, "smooth_stone");
  }
}
for (let x = 12; x <= 13; x++) {
  for (let z = 7; z <= 8; z++) {
    for (let y = 25; y <= 27; y++) put(x, y, z, SLAB);
  }
}
put(12, 28, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
