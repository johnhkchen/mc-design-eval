import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109959";
const W = 23, H = 33, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
if (!Number.isFinite(minG)) minG = 0;

// Roof: about 21 blocks above the lowest ground. ROOF is the y of the parapet course.
const ROOF = Math.min(H - 6, minG + 21);

const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z),
});
const isBoundary = (x, z) => {
  const e = exposed(x, z);
  return e.n || e.s || e.w || e.e;
};

// Centre of the footprint, used to place the entrance and penthouse.
let sx = 0, sz = 0, cnt = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  sx += x; sz += z; cnt++;
}
const cx = cnt ? sx / cnt : W / 2;
const cz = cnt ? sz / cnt : D / 2;

// Entrance: a north-facing boundary cell nearest the middle of the north edge.
let door = null;
{
  let best = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!exposed(x, z).n) continue;
    const d = Math.abs(x - cx);
    if (d < best) { best = d; door = [x, z]; }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  const topK = ROOF - 1 - gr;      // k index of the parapet/roof row
  const boundary = isBoundary(x, z);
  const b = x + z;                 // bay index along any exposed face

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF - 1; y++) {
    const kk = y - gr;
    const s = Math.floor(kk / 5);
    const r = kk % 5;

    if (!boundary) {
      // Interior: floor slabs and roof deck only, air between (no interiors).
      if (kk === topK || (kk % 5 === 0 && kk < topK)) {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Boundary wall cells.
    if (kk === topK) {
      put(x, y, z, "smooth_stone"); // parapet cap
      continue;
    }
    if (kk === 0) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (kk % 5 === 0) {
      put(x, y, z, "smooth_stone"); // storey line
      continue;
    }

    // Entrance door on the north face.
    if (door && x === door[0] && z === door[1] && s === 0 && (r === 1 || r === 2)) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (s === 0) {
      if (r === 4) {
        put(x, y, z, "red_terracotta"); // shopfront fascia
      } else if (b % 3 === 0) {
        put(x, y, z, "stone_bricks"); // shopfront pier
      } else {
        put(x, y, z, "light_blue_stained_glass"); // shopfront glazing
      }
      continue;
    }

    if (r === 4) {
      put(x, y, z, "white_concrete"); // spandrel
      continue;
    }

    // Window band, r in 1..3.
    if (b % 3 === 1) {
      const warm = r === 2 && ((x * 31 + z * 17 + y * 7) % 9 === 0);
      put(x, y, z, warm ? "glowstone" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof row (interior deck and parapet) at ROOF-1 for cells with topK
  // already handled above; boundary parapet is the topK row.

  // Roof equipment: scattered AC units on the deck.
  if (!boundary && (x + z) % 5 === 0) {
    put(x, ROOF, z, "iron_block");
  }
}

// Mechanical penthouse on the central interior of the roof.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isBoundary(x, z) && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) {
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
