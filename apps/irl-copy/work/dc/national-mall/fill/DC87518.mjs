import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87518.cells.json`, "utf8"));

// 1325 G St NW: Commercial-Office-Large, c.1920s-30s stone-faced office block,
// 5-6 storeys of 4-block bays, shopfront ground floor, cornice, rooftop penthouses.
const W = 40, H = 31, D = 27;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const M = new Map();
for (const [x, z, gr, r] of cells) M.set(`${x},${z}`, { g: gr, r: Math.round(r) });
const has = (x, z) => M.has(`${x},${z}`);

const outs = (x, z) => {
  const o = [];
  if (!has(x - 1, z)) o.push([-1, 0]);
  if (!has(x + 1, z)) o.push([1, 0]);
  if (!has(x, z - 1)) o.push([0, -1]);
  if (!has(x, z + 1)) o.push([0, 1]);
  return o;
};

// entrance: centre of the south (+z) exposed face
const southCells = cells.filter(([x, z]) => outs(x, z).some(([ox, oz]) => ox === 0 && oz === 1));
let doorX = -1, doorZ = -1;
if (southCells.length) {
  const avg = southCells.reduce((s, c) => s + c[0], 0) / southCells.length;
  let best = Infinity;
  for (const [x, z] of southCells) {
    if (Math.abs(x - avg) < best) { best = Math.abs(x - avg); doorX = x; doorZ = z; }
  }
}

const glow = new Set();
const equip = [];

for (const [x, z, gr, rr] of cells) {
  const R = Math.max(Math.round(rr), gr + 6);
  const os = outs(x, z);
  const perim = os.length > 0;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // storey levels: ground floor 5 tall (shopfront), then 4-block bays
  const arr = [gr];
  let lv = gr + 5;
  while (lv < R) { arr.push(lv); lv += 4; }

  if (perim) {
    const corner = os.length >= 2;
    const along = os[0][0] !== 0 ? z : x;
    const pier = corner || along % 3 === 0;
    const isDoor = x === doorX && z === doorZ;

    for (let y = gr; y < R; y++) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }                 // base course
      if (y === R - 1) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; } // cornice
      if (y === R - 2) { put(x, y, z, "calcite"); continue; }                   // cornice band under slab

      let i = 0;
      while (i + 1 < arr.length && arr[i + 1] <= y) i++;
      const base = arr[i];
      const rel = y - base;

      if (i === 0) {
        if (isDoor && rel === 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (isDoor && rel === 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (isDoor && rel === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
        if (rel === 4) { put(x, y, z, "calcite"); continue; }
        put(x, y, z, pier ? "smooth_quartz" : "glass_pane", pier ? undefined : { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
        continue;
      }

      if (rel === 0 || rel === 3) { put(x, y, z, "calcite"); continue; }
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "glass_pane", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
      if (rel === 1 && (x * 31 + z * 17 + y) % 5 === 0) {
        const ix = x - os[0][0], iz = z - os[0][1];
        if (has(ix, iz)) glow.add(`${ix},${iz},${base + 1}`);
      }
    }
  } else {
    // interior: floor slabs per storey, light roof deck on top, air otherwise
    for (let y = gr; y < R; y++) {
      if (y === R - 1) put(x, y, z, "smooth_stone");
      else if (arr.includes(y)) put(x, y, z, "smooth_stone");
    }
    if (x % 10 === 5 && z % 8 === 4) equip.push([x, R, z]);
  }
}

for (const k of glow) {
  const [x, z, y] = k.split(",").map(Number);
  put(x, y, z, "glowstone");
}

// rooftop penthouses: 2x2, two blocks tall, calcite walls with a glass cap
for (const [x, R, z] of equip) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(x + dx, R, z + dz, "calcite");
    put(x + dx, R + 1, z + dz, "calcite");
  }
}

g.save(`${DIR}/DC87518.nbt`);
