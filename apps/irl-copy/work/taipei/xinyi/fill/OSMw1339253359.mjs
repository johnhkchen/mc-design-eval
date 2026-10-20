import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253359";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 7, H = 19, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);

const lowest = Math.min(...cells.map((c) => c[2]));
const ROOF = lowest + 7;               // roof surface about 7 blocks above lowest ground
const topOf = (gr) => Math.max(ROOF, gr + 5); // at least one 5-block storey per cell

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const glassProps = (alongX) => ({
  north: alongX ? "false" : "true",
  south: alongX ? "false" : "true",
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  waterlogged: "false",
});

// Pass 1: body, foundations, floors, windows, doors
for (const [x, z, gr] of cells) {
  const n = !fp.has(key(x, z - 1));
  const s = !fp.has(key(x, z + 1));
  const w = !fp.has(key(x - 1, z));
  const e = !fp.has(key(x + 1, z));
  const edge = n || s || w || e;
  const corner = (n || s) && (w || e);
  const front = n;                       // street face is the north (z = 0) side
  const alongX = n || s;

  const top = topOf(gr);
  const total = top - gr;
  const deckR = total - 2;
  const parR = total - 1;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let r = 0; r < total; r++) {
    const y = gr + r;

    // base course / ground slab
    if (r === 0) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // roof deck over the whole footprint
    if (r === deckR) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // parapet ring on the perimeter only
    if (r === parR) {
      if (edge) put(x, y, z, "smooth_stone");
      continue;
    }
    // interior: only floor slabs at each storey line, otherwise air
    if (!edge) {
      if (r % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // storey bands: ground lintel at r=4, floor lines every 5 above
    const m = r >= 5 ? (r - 5) % 5 : -1;
    if (r === 4 || m === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // spandrel under upper floor lines
    if (m === 4) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // window rows: ground storey r 1..3, upper storeys m 1..3
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (front && x === 3 && r <= 2) {
      // entrance door, centred on the street front
      const props = (half) => ({
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      put(x, y, z, "oak_door", props(r === 1 ? "lower" : "upper"));
      continue;
    }
    if ((x + z) % 3 === 0) {
      put(x, y, z, "light_gray_concrete"); // pier between window bays
      continue;
    }
    put(x, y, z, "glass_pane", glassProps(alongX));
  }
}

// Warm light behind some street-front ground windows (air gap at z = 1)
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  if (x % 3 !== 1) continue;
  if (!fp.has(key(x, 1))) continue;
  put(x, gr + 2, 1, "glowstone");
}

// Roof equipment: small water tank on the lowest roof
const tankCells = [[2, 4], [3, 4], [2, 5], [3, 5]];
if (tankCells.every(([x, z]) => fp.has(key(x, z)))) {
  for (const [x, z] of tankCells) {
    const gr = fp.get(key(x, z));
    const top = topOf(gr);
    put(x, top - 1, z, "gray_concrete");
    put(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
