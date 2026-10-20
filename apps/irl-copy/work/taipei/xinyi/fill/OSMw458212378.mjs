import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw458212378.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw458212378.nbt";

// 醫學檢驗暨生物技術學系大樓B: 1990s-2000s university block, reinforced concrete frame,
// white concrete walls, light-grey bands and cornice, blue-tinted glazing (typical of Taipei campuses),
// two storeys of ~5 blocks plus a parapet, flat roof with a central mechanical penthouse.
const W = 20, H = 23, D = 26;

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));

let minG = Infinity, maxG = -Infinity;
for (const gr of ground.values()) { minG = Math.min(minG, gr); maxG = Math.max(maxG, gr); }

// Flat roof about 11 blocks above the lowest ground; never lower than the highest ground plus two storey-ish tiers.
const R = Math.max(minG + 11, maxG + 6);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);
const alongOk = (x, z, dir) =>
  (dir === "north" || dir === "south") ? (has(x - 1, z) && has(x + 1, z)) : (has(x, z - 1) && has(x, z + 1));
const alongCoord = (x, z, dir) => (dir === "north" || dir === "south") ? x : z;

// Entrance: a single-exposure, non-corner north-facing wall cell nearest the middle of the front.
const xs = [...ground.keys()].map(k => +k.split(",")[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorX = null, doorZ = null, best = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length !== 1 || ex[0] !== "north" || !alongOk(x, z, "north")) continue;
  const d = Math.abs(x - midX);
  if (d < best) { best = d; doorX = x; doorZ = z; }
}

const paneProps = (dir) =>
  (dir === "north" || dir === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const isWinRow = (r) => (r >= 1 && r <= 3) || (r >= 6 && r <= 8);

// Pass 1: foundations, interior floors, perimeter facades.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: ground floor slab, storey floor, roof deck. Air between (no interiors).
    put(x, gr, z, "smooth_stone");
    if (gr + 5 < R - 2) put(x, gr + 5, z, "light_gray_concrete");
    if (R - 2 > gr) put(x, R - 2, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: plinth course at ground level.
  put(x, gr, z, "stone_bricks");

  const dir = ex[0];
  const corner = ex.length >= 2 || !alongOk(x, z, dir);
  const pier = corner || (alongCoord(x, z, dir) % 3 === 0);
  const isDoor = x === doorX && z === doorZ;

  for (let y = gr + 1; y <= R - 1; y++) {
    const r = y - gr;

    if (y === R - 1) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (y === R - 2) { put(x, y, z, "light_gray_concrete"); continue; }   // cornice / roof deck edge

    if (isDoor && (r === 1 || r === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: dir,
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && r === 3) { put(x, y, z, "light_blue_stained_glass_pane", paneProps(dir)); continue; }
    if (isDoor && r === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    if (r === 5) { put(x, y, z, "light_gray_concrete"); continue; }        // storey line

    if (!pier && isWinRow(r)) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(dir));
      continue;
    }

    put(x, y, z, corner ? "light_gray_concrete" : "white_concrete");       // piers and spandrels
  }
}

// Pass 2: warm light behind some upper-storey windows (glowstone in the interior cell just inside).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const dir = ex[0];
  if (!alongOk(x, z, dir)) continue;
  if (alongCoord(x, z, dir) % 3 === 0) continue;
  if (!((x + z) % 3 === 0)) continue;
  const [dx, dz] = DIRS[dir];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz).length) continue;
  const gr2 = ground.get(`${ix},${iz}`);
  const y = gr2 + 7;
  if (y <= R - 3) put(ix, y, iz, "glowstone");
}

// Pass 3: central mechanical penthouse on the roof, only over interior cells.
const cells = [...ground.keys()].map(k => k.split(",").map(Number));
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
const sizes = [[3, 4], [2, 3], [1, 2]];
for (const [hx, hz] of sizes) {
  let ok = true;
  const box = [];
  for (let x = cx - hx; x <= cx + hx && ok; x++) {
    for (let z = cz - hz; z <= cz + hz; z++) {
      if (!has(x, z) || exposed(x, z).length) { ok = false; break; }
      box.push([x, z]);
    }
  }
  if (!ok || R + 2 >= H) continue;
  for (const [x, z] of box) {
    const edge = x === cx - hx || x === cx + hx || z === cz - hz || z === cz + hz;
    for (let y = R - 1; y <= R + 1; y++) {
      if (edge) put(x, y, z, "light_gray_concrete");
    }
    put(x, R + 2, z, "smooth_stone");
  }
  break;
}

g.save(OUT);
