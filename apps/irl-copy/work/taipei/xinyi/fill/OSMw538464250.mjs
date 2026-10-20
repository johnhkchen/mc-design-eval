import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464250";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const cx = (minX + maxX) / 2;

// Entrance: front row (min z), lowest ground, nearest the centre line
const front = cells
  .filter((c) => c[1] === minZ)
  .sort((a, b) => (a[2] - b[2]) || (Math.abs(a[0] - cx) - Math.abs(b[0] - cx)));
const entrance = front.length ? `${front[0][0]},${front[0][1]}` : null;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Two-storey commercial block, flat roof at minG + 11.
// Bands (r = y - minG): 0 base course, 1-3 shopfront, 4 red awning band,
// 5 storey line, 6-8 upper storey windows, 9 cornice, 10 parapet / roof slab.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    const isEntrance = `${x},${z}` === entrance;
    for (let r = 0; r <= 10; r++) {
      const y = minG + r;
      if (y < gr || y >= H) continue;
      const pillar = x % 3 === 0 || z % 3 === 0;

      if (r === 0) {
        put(x, y, z, "polished_andesite");
      } else if (r >= 1 && r <= 3) {
        if (isEntrance && (r === 1 || r === 2)) {
          const props = { facing: "north", hinge: "left", open: "false", powered: "false", half: r === 1 ? "lower" : "upper" };
          put(x, y, z, "dark_oak_door", props);
        } else if (pillar) {
          put(x, y, z, "smooth_quartz");
        } else {
          put(x, y, z, "glass");
        }
      } else if (r === 4) {
        put(x, y, z, "red_concrete");
      } else if (r === 5) {
        put(x, y, z, "smooth_quartz");
      } else if (r >= 6 && r <= 8) {
        if (pillar) put(x, y, z, "smooth_quartz");
        else if (r === 7 && (x + z) % 5 === 1) put(x, y, z, "glowstone");
        else put(x, y, z, "glass");
      } else if (r === 9) {
        put(x, y, z, "smooth_quartz");
      } else if (r === 10) {
        put(x, y, z, "smooth_stone");
      }
    }
  } else {
    // Interior: air gap behind the glass, one floor slab per storey, roof slab on top
    const y5 = minG + 5;
    if (y5 >= gr) put(x, y5, z, "smooth_quartz");
    const y10 = minG + 10;
    if (y10 >= gr) put(x, y10, z, "gray_concrete");
    // Roof equipment: a few AC plant boxes
    if (x % 4 === 1 && z % 3 === 1 && minG + 11 > gr) {
      put(x, minG + 11, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
