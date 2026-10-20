import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1188120075";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 15, D = 8;
const g = new Voxels([W, H, D]);

const at = new Map();
for (const [x, z, gr] of cells) at.set(`${x},${z}`, gr);
const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 3;

const has = (x, z) => at.has(`${x},${z}`);
const edgeCell = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const pane = (ns, ew) => ({
  north: ns ? "true" : "false",
  south: ns ? "true" : "false",
  east: ew ? "true" : "false",
  west: ew ? "true" : "false",
  waterlogged: "false",
});

for (const [x, z, gr] of cells) {
  const top = Math.max(roofY, gr + 3);
  const edge = edgeCell(x, z);

  // foundation is implicit below gr; base course / floor slab at gr
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // walls, one storey, up to the roof deck
  for (let y = gr + 1; y <= top - 2; y++) {
    if (!edge) continue; // air gap behind the glass
    const first = y === gr + 1;
    if (z === 0 && first) {
      if (x === 0 || x === W - 1) put(x, y, z, "stone_bricks");
      else if (x === 9 || x === 10) { /* entrance opening */ }
      else put(x, y, z, "glass_pane", pane(false, true));
    } else if (z === 0 && y === gr + 2 && x >= 8 && x <= 11) {
      put(x, y, z, "stone_bricks"); // lintel over entrance
    } else if (z === D - 1 && first && x % 2 === 1) {
      put(x, y, z, "glass_pane", pane(false, true));
    } else if ((x === 0 || x === W - 1) && first && z > 0 && z < D - 1 && z % 2 === 0) {
      put(x, y, z, "glass_pane", pane(true, false));
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // cornice / parapet cap on the perimeter, roof deck inside
  if (edge) put(x, top - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  else put(x, top - 1, z, "smooth_stone");

  // warm lights behind the street-front glass
  if (!edge && z === 1 && gr + 1 <= top - 2 && x % 4 === 2) {
    put(x, gr + 1, z, "shroomlight");
  }

  // a few roof units on the deck
  if (!edge && x % 6 === 3 && z === 3 && top < H) {
    put(x, top, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
