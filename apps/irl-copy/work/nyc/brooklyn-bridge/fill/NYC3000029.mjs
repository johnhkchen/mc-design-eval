import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000029.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000029.nbt";
const W = 20, H = 19, D = 7;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const S = new Map();
for (const [x, z, gr, r] of cells) {
  S.set(key(x, z), { gr: Math.round(gr), r: Number(r) });
}

// Flat roof tier: median lidar roof height, one level for the whole block.
const roofs = [...S.values()].map(c => c.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGr = Math.max(...[...S.values()].map(c => c.gr));
let R = Math.round(medianRoof);
R = Math.max(R, maxGr + 4);
R = Math.min(R, 16);

const isExt = (x, z) => !S.has(key(x - 1, z)) || !S.has(key(x + 1, z)) || !S.has(key(x, z - 1)) || !S.has(key(x, z + 1));

// Entrance on the south face (highest z), at the middle of that face.
const southCells = [...S.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => !S.has(key(x, z + 1)));
let entrance = null;
if (southCells.length) {
  const xs = southCells.map(c => c[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  entrance = southCells.find(c => c[0] === mid) || southCells[0];
}

for (const [k, c] of S) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.gr;
  const ext = isExt(x, z);

  // Foundation to ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground slab / base course.
  put(x, gr, z, ext ? "stone_bricks" : "smooth_stone");

  // Long faces (north/south) use u = x; short faces use u = z.
  const onZFace = !S.has(key(x, z - 1)) || !S.has(key(x, z + 1));
  const u = onZFace ? x : z;

  for (let rel = 1; gr + rel <= R - 2; rel++) {
    const y = gr + rel;
    if (!ext) {
      // Interior: air gap, floor slabs only.
      if (rel % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (rel % 2 === 0) {
      // Spandrels in brick; one stone string course at rel 2 for a storey line.
      put(x, y, z, rel === 2 ? "stone_bricks" : "bricks");
    } else {
      // Window rows: brick piers every third bay, glass panes with pale concrete sills.
      if (u % 3 === 0) {
        put(x, y, z, "bricks");
      } else if (rel === 3 && (u % 9) === 4) {
        put(x, y, z, "glowstone"); // a couple of warm lit windows, sparse
      } else {
        put(x, y, z, "glass_pane");
      }
    }
  }

  // Interior storey slabs.
  for (let rel = 2; gr + rel <= R - 2; rel += 2) {
    put(x, gr + rel, z, "smooth_stone");
  }

  // Roof deck.
  put(x, R - 1, z, "smooth_stone");

  // Parapet coping on the outer ring.
  if (ext) put(x, R, z, "stone_bricks");
}

// Entrance: recessed-looking iron door, stone surround and a lintel course above.
if (entrance) {
  const [ex, ez] = entrance;
  const eg = S.get(key(ex, ez)).gr;
  put(ex, eg + 1, ez, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 2, ez, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-2, -1, 1, 2]) {
    const cx = ex + dx;
    if (!S.has(key(cx, ez))) continue;
    const cg = S.get(key(cx, ez)).gr;
    put(cx, cg + 1, ez, "stone_bricks");
    put(cx, cg + 2, ez, "stone_bricks");
  }
  // Lintel course over the door, supported by the wall around it.
  for (let dx = -2; dx <= 2; dx++) {
    const cx = ex + dx;
    if (!S.has(key(cx, ez))) continue;
    const cg = S.get(key(cx, ez)).gr;
    put(cx, cg + 3, ez, "stone_bricks");
  }
}

// Roof plant: two HVAC boxes and one low penthouse block, all sitting on the deck.
const interior = [...S.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => !isExt(x, z));
const pickRoof = (fx, fz) => {
  let best = null, bd = Infinity;
  for (const [x, z] of interior) {
    const d = Math.abs(x - fx) + Math.abs(z - fz);
    if (d < bd) { bd = d; best = [x, z]; }
  }
  return best;
};
for (const p of [pickRoof(5, 3), pickRoof(12, 3)]) {
  if (p) put(p[0], R, p[1], "light_gray_concrete");
}
const bh = pickRoof(16, 3);
if (bh) {
  put(bh[0], R, bh[1], "stone_bricks");
  put(bh[0] + 1, R, bh[1], "stone_bricks");
  put(bh[0], R, bh[1] + 1, "stone_bricks");
  put(bh[0] + 1, R, bh[1] + 1, "stone_bricks");
}

g.save(OUT);
