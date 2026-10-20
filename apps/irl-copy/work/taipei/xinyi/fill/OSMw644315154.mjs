import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw644315154";
const W = 20, H = 23, D = 18;
const R = 11; // common roofline (absolute y), from lidar

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

let minG = Infinity;
for (const [, , gr] of list) minG = Math.min(minG, gr);
const ground = new Map();
for (const [x, z, gr] of list) ground.set(`${x},${z}`, Math.round(gr - minG));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the north (min z) face, median x of the lowest-z exposed cells.
let door = null;
{
  const exposed = cells.filter(([x, z]) => !has(x, z - 1));
  if (exposed.length) {
    const zMin = Math.min(...exposed.map(([, z]) => z));
    const row = exposed.filter(([, z]) => z === zMin).map(([x]) => x).sort((a, b) => a - b);
    const mx = row[Math.floor(row.length / 2)];
    door = { x: mx, z: zMin };
  }
}

// Pass 1: foundations, floor slabs, cornices, roof deck.
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const per = isPerim(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const slabs = [];
  for (let k = 1; gr + 5 * k <= R - 3; k++) slabs.push(gr + 5 * k);
  const floors = [gr, ...slabs];
  for (const f of floors) {
    if (f === gr) put(x, f, z, per ? "stone_bricks" : "smooth_stone");
    else put(x, f, z, per ? "white_concrete" : "smooth_stone");
  }
  put(x, R, z, per ? "white_concrete" : "gray_concrete");
  if (per) {
    put(x, R + 1, z, "smooth_quartz");
    put(x, R + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: facade walls, windows, shopfronts, door, lights.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const gr = gAt(x, z);
  const slabs = [];
  for (let k = 1; gr + 5 * k <= R - 3; k++) slabs.push(gr + 5 * k);
  const floors = [gr, ...slabs];
  const outward = dirs.find(([dx, dz]) => !has(x + dx, z + dz));
  const inner = outward ? [x - outward[0], z - outward[1]] : null;
  const innerOk = inner && has(inner[0], inner[1]) && !isPerim(inner[0], inner[1]);
  const isDoor = door && door.x === x && door.z === z;
  const mull = (x + z) % 3 === 0;
  const litPick = ((x * 5 + z * 3) % 4) === 0;

  for (let y = gr + 1; y <= R - 1; y++) {
    if (floors.includes(y)) continue;
    const lo = Math.max(...floors.filter((f) => f < y));
    const above = floors.filter((f) => f > y);
    const hi = above.length ? Math.min(...above) : R;
    const n = hi - lo - 1;
    const r = y - lo;

    if (n < 3) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (lo === gr) {
      // Ground floor: shopfront with pilasters, glass bays, fascia.
      if (isDoor && r === 1) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && r === 2) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && r === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (r === n) {
        put(x, y, z, "white_concrete");
      } else if (mull) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        if (r === 2 && innerOk && litPick) put(ix(inner), y, iz(inner), "glowstone");
      }
    } else {
      // Upper storeys: window grid with mullions and spandrels.
      if (mull) {
        put(x, y, z, "white_concrete");
      } else if (r === 1 || r === n) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        if (r === 2 && innerOk && litPick) put(inner[0], y, inner[1], "shroomlight");
      }
    }
  }
}

function ix(p) { return p[0]; }
function iz(p) { return p[1]; }

// Rooftop water tank on a fully interior roof cell nearest the centroid.
{
  const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
  const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
  let best = null, bestD = Infinity;
  for (const [x, z] of cells) {
    const ring = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    if (!ring.every(([dx, dz]) => has(x + dx, z + dz))) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = [x, z]; }
  }
  if (best) {
    const [tx, tz] = best;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = tx + dx, z = tz + dz;
      if (!has(x, z)) continue;
      for (let y = R + 1; y <= R + 3; y++) put(x, y, z, "light_gray_concrete");
      put(x, R + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
