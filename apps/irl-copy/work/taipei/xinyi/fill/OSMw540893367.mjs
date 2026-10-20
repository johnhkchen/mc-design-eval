import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no reference. Read as a 2-storey, 19 x 19 post-war / 1980s Xinyi-type
// commercial block: stone-bricks plinth, quartz-tile piers and spandrels, glass
// shopfront at ground, a 3-tall glass band upstairs, stone cornice, parapet, and
// a rooftop plant box. Storeys are 5 blocks; roof of storey 2 at y=10, parapet at y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893367";
const W = 19, H = 23, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));

// footprint: "x,z" -> ground offset above the lowest ground (clamped so the 2 storeys fit)
const foot = new Map();
for (const [x, z, gr] of raw) foot.set(`${x},${z}`, Math.min(4, gr - minG));

const has = (x, z) => foot.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr === 0) put(x, 0, z, "smooth_stone"); // base slab on the lowest ground

  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = miss.length > 0;
  const corner = miss.length >= 2;

  if (!edge) {
    // Interior: no rooms, just the storey floor slabs and the roof deck.
    put(x, 5, z, "smooth_stone");
    put(x, 10, z, "smooth_stone");
    // Rooftop plant box in the middle of the roof.
    if (x >= 7 && x <= 11 && z >= 7 && z <= 11) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Outward normal: prefer the front (+z) face, then +x, -z, -x.
  const pick =
    miss.find(([dx, dz]) => dz === 1) ||
    miss.find(([dx]) => dx === 1) ||
    miss.find(([dx, dz]) => dz === -1) ||
    miss[0];
  const nx = pick[0], nz = pick[1];

  const t = nz !== 0 ? x : z;          // index along the wall
  const runX = nz !== 0;               // wall runs along x
  const pane = runX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const pier = corner || t % 6 === 0 || t === 18;
  const front = nz === 1;
  const doorCell = front && x === 9 && z === 18;
  const inX = x - nx, inZ = z - nz;
  const lo = Math.max(gr, 1);

  for (let y = lo; y <= 11; y++) {
    let b, p;
    if (y === 11) {
      // parapet
      b = corner ? "quartz_pillar" : "smooth_quartz";
      p = corner ? { axis: "y" } : undefined;
    } else if (y === 10) {
      // cornice
      b = "stone_bricks";
    } else if (y === 5) {
      // storey line; red sign band over the entrance
      b = front && t >= 8 && t <= 10 ? "red_terracotta" : "stone_bricks";
    } else if (y <= 4) {
      // ground storey: shopfront
      if (corner) { b = "quartz_pillar"; p = { axis: "y" }; }
      else if (pier) b = "smooth_quartz";
      else if (y === 1) b = "stone_bricks";          // plinth
      else { b = "glass_pane"; p = pane; }
      if (doorCell && y <= 2) {
        b = "oak_door";
        p = { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      }
    } else if (y === 6) {
      // spandrel under the upper windows
      b = corner ? "quartz_pillar" : "smooth_quartz";
      p = corner ? { axis: "y" } : undefined;
    } else {
      // upper storey windows (y 7..9)
      if (pier) b = "smooth_quartz";
      else { b = "glass_pane"; p = pane; }
    }
    put(x, y, z, b, p);
  }

  // Warm lights hung from the ceilings behind some glass bays.
  if (!pier && t % 6 === 3 && has(inX, inZ)) {
    const inEdge = DIRS.some(([dx, dz]) => !has(inX + dx, inZ + dz));
    if (!inEdge) {
      put(inX, 4, inZ, "lantern", { hanging: "true", waterlogged: "false" });
      put(inX, 9, inZ, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
