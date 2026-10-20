import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0209-1F";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 6, H = 24, D = 9;
const cells = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  cells.set(`${x},${z}`, gr);
}

const g = new Voxels([W, H, D]);
const has = (x, z) => cells.has(`${x},${z}`);
const ground = (x, z) => cells.get(`${x},${z}`);
// perimeter cell: at least one side open
const edge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
// corner cell: open on one horizontal axis and one depth axis
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const gr = ground(x, z);
    const e = edge(x, z);
    const c = corner(x, z);
    const front = z === 0;                       // street facade
    const entrance = front && (x === 2 || x === 3);
    const canopy = front && x >= 1 && x <= 4;    // entrance canopy span

    // foundation up to the cell's ground, then plinth course
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
    put(x, gr, z, "smooth_stone");

    // ground floor shopfront (gr+1 .. gr+3)
    if (e) {
      if (c) {
        for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_andesite");
      } else if (entrance) {
        // recessed glass doorway, lintel band above
        put(x, gr + 1, z, "glass");
        put(x, gr + 2, z, "glass");
        if (front && x === 2) put(x, gr + 3, z, "lantern", { hanging: "true" });
        if (front && x === 3) put(x, gr + 3, z, "lantern", { hanging: "true" });
      } else if (front && (x === 1 || x === 4)) {
        // doorway jambs beside the entrance
        for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_andesite");
      } else {
        put(x, gr + 1, z, "polished_blackstone_bricks"); // dark bulkhead
        put(x, gr + 2, z, "glass");
        put(x, gr + 3, z, "glass");
      }
    }

    // fascia / entrance canopy band at gr+4
    if (e) {
      if (c) put(x, gr + 4, z, "polished_andesite");
      else if (canopy) put(x, gr + 4, z, "light_gray_concrete");
      else put(x, gr + 4, z, "smooth_quartz");
    }

    // storey line / floor slab at gr+5
    put(x, gr + 5, z, e ? "smooth_quartz" : "light_gray_concrete");

    // second storey gr+6 .. gr+9
    if (e) {
      if (c || (x + z) % 2 === 1) {
        // mullion / pilaster column
        for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
      } else {
        put(x, gr + 6, z, "white_concrete");     // head frame
        put(x, gr + 9, z, "white_concrete");     // sill frame
        const lit = (x * 2 + z) % 5 === 0;       // a few warm lit windows
        const pane = lit ? "sea_lantern" : "glass";
        put(x, gr + 7, z, pane);
        put(x, gr + 8, z, pane);
      }
    }

    // cornice / roof deck at gr+10
    put(x, gr + 10, z, e ? "smooth_quartz" : "light_gray_concrete");

    // parapet on the perimeter, top surface at gr+12
    if (e) put(x, gr + 11, z, c ? "smooth_quartz" : "white_concrete");

    // roof equipment on one interior cell
    if (!e && x === 2 && z === 4) put(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
