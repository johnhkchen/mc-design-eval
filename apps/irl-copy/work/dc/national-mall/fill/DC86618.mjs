import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86618";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 25, D = 19;
const g = new Voxels([W, H, D]);

const WALL = "bricks";
const BASE = "stone_bricks";
const TRIM = "smooth_stone";
const GLASS = "glass";

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => has.has(key(x, z));

// Smooth the lidar roof: one main tier at the median, with a stepped tower only where clearly higher.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const mainTop = Math.min(Math.max(median, 8), 20);

const info = new Map();
for (const [x, z, ground, roof] of cells) {
  const gr = Math.round(ground);
  let top = mainTop;
  if (Math.round(roof) >= median + 4) top = Math.min(Math.round(roof), 22);
  top = Math.max(top, gr + 6);
  top = Math.min(top, 22);
  info.set(key(x, z), { x, z, g: gr, T: top });
}

for (const c of info.values()) {
  const { x, z, g: gr, T } = c;
  const faceW = !inF(x - 1, z);
  const faceE = !inF(x + 1, z);
  const faceN = !inF(x, z - 1);
  const faceS = !inF(x, z + 1);
  const per = faceW || faceE || faceN || faceS;

  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  for (let y = gr; y < T; y++) {
    const rel = y - gr;
    if (y === T - 1) { g.set(x, y, z, TRIM); continue; }
    if (rel % 3 === 0) { g.set(x, y, z, TRIM); continue; }
    if (!per) continue;
    if (y === T - 2) { g.set(x, y, z, TRIM); continue; }

    let glass = false;
    if (faceW || faceE) glass = (z % 2 === 1);
    if (faceN || faceS) glass = (x === 1 || x === 4);

    // Doorways: north end at x=2, south end at x=3, ground storey.
    if (faceN && x === 2 && rel <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (faceS && x === 3 && rel <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "right", open: "false", powered: "false" });
      continue;
    }
    if ((faceN && x === 3 || faceS && x === 2) && rel === 1) {
      g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (glass && (rel % 3 === 1 || rel % 3 === 2)) { g.set(x, y, z, GLASS); continue; }
    let block = WALL;
    if (rel % 3 === 2 && !glass) block = TRIM;
    g.set(x, y, z, block);
  }

  // Parapet: slab caps on the perimeter.
  if (per && T < H) g.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Canopies over both entrances: a dark oak slab course on the first storey lintel line.
for (const c of info.values()) {
  const { x, z, g: gr, T } = c;
  const faceN = !inF(x, z - 1);
  const faceS = !inF(x, z + 1);
  const lintel = gr + 3;
  if (lintel >= T - 2) continue;
  if (faceN && x >= 1 && x <= 4) {
    g.set(x, lintel, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  if (faceS && x >= 1 && x <= 4) {
    g.set(x, lintel, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm light behind the side glass.
for (const c of info.values()) {
  const { x, z, g: gr, T } = c;
  if ((x === 1 || x === 4) && z % 4 === 1 && T - 2 > gr + 1) g.set(x, gr + 1, z, "glowstone");
}

// Crowning pinnacle over the central bays.
for (const c of info.values()) {
  const { x, z, T } = c;
  if ((x === 2 || x === 3) && z >= 8 && z <= 10 && T + 1 < H) g.set(x, T, z, "blue_terracotta");
}

g.save(`${DIR}/${ID}.nbt`);
