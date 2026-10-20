import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520038105";
const W = 16, H = 23, D = 42;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...raw.map(c => Math.round(c[2])));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr) - base]);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const DIRS = [["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

// Entrance: on a west/east (street-facing long side) edge cell nearest the middle.
const edgeCells = cells.filter(([x, z]) => outward(x, z).length > 0);
const ewCells = edgeCells.filter(([x, z]) => outward(x, z).some(d => d[1] !== 0));
const midZ = 21;
let entrance;
if (ewCells.length) {
  entrance = ewCells.reduce((a, b) => Math.abs(a[1] - midZ) <= Math.abs(b[1] - midZ) ? a : b);
} else {
  entrance = edgeCells.reduce((a, b) =>
    (Math.abs(a[0] - 8) + Math.abs(a[1] - midZ)) <= (Math.abs(b[0] - 8) + Math.abs(b[1] - midZ)) ? a : b);
}
const [ex, ez] = entrance;
const entranceDir = outward(ex, ez).find(d => d[1] !== 0) || outward(ex, ez)[0];
const ef = entranceDir[0];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  const f = gr;            // ground surface; floor 1 air starts at f+1
  // Floor slab between storeys and roof slab, all footprint cells.
  put(x, f + 5, z, "smooth_quartz");
  put(x, f + 10, z, "smooth_quartz");

  const o = outward(x, z);
  if (o.length === 0) {
    // Interior cell: roof equipment on some cells.
    if (x % 5 === 2 && z % 7 === 3) {
      put(x, f + 11, z, "light_gray_concrete");
      put(x, f + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge cell: facade.
  const [, dx, dz] = o[0];
  const along = dx !== 0 ? z : x;
  const pillar = along % 3 === 0;
  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  const inX = x - dx, inZ = z - dz;
  const inward = has(inX, inZ);

  // Plinth
  put(x, f + 1, z, "stone_bricks");

  // Shopfront (ground floor) and upper windows
  for (const y of [f + 2, f + 3, f + 4]) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  for (const y of [f + 6, f + 7, f + 8, f + 9]) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }

  // Warm lights behind glass
  if (!pillar && inward) {
    if (along % 6 === 4) put(inX, f + 3, inZ, "glowstone");
    if (along % 6 === 2) put(inX, f + 7, inZ, "shroomlight");
  }

  // Storey line / cornice band and parapet
  put(x, f + 5, z, "smooth_quartz");
  put(x, f + 10, z, "smooth_quartz");
  put(x, f + 11, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Entrance
  if (x === ex && z === ez) {
    put(x, f + 1, z, "oak_door", { facing: ef, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, f + 2, z, "oak_door", { facing: ef, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, f + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
