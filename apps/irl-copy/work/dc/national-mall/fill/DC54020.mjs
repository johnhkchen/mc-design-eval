import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC54020";
const W = 6, D = 11, H = 28, STORY = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Flat massing: one roof level (mean of lidar), storey lines on a global grid.
const G = Math.min(...cells.map(c => c[2]));
const T = Math.min(H - 4, Math.round(cells.reduce((s, c) => s + c[3], 0) / cells.length));

const isCore = (x, z) => x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3;

// Facade bay layout for non-corner perimeter cells
const bayKind = (x, z) => {
  if (z === 0 || z === D - 1) return (x === 1 || x === W - 2) ? "pier" : "window";
  return (z % 3 === 0) ? "pier" : "window";
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perimX = x === 0 || x === W - 1;
  const perimZ = z === 0 || z === D - 1;
  const perim = perimX || perimZ;
  const corner = perimX && perimZ;

  for (let y = gr; y < T; y++) {
    const rel = y - G;
    const r = ((rel % STORY) + STORY) % STORY;
    const k = Math.floor(rel / STORY);
    const isTop = y === T - 1;

    // Solid core keeps the mass tight; the ring of air just inside the glass is the gap
    if (!perim) {
      if (isCore(x, z)) {
        put(x, y, z, isTop ? "gray_concrete" : "light_gray_concrete");
      } else {
        // air gap behind the glass, floor slab per storey, roof deck on top
        if (isTop) put(x, y, z, "gray_concrete");
        else if (r === 0) put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Parapet / cornice
    if (isTop) {
      put(x, y, z, corner ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Double-door entrance on the south (street) face, centre bays
    if (z === D - 1 && (x === 2 || x === 3)) {
      if (y === gr) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: x === 2 ? "left" : "right", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: x === 2 ? "left" : "right", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    }

    // Base course and floor lines
    if (r === 0) { put(x, y, z, rel === 0 ? "stone_bricks" : "smooth_stone"); continue; }

    if (corner) { put(x, y, z, "white_concrete"); continue; }

    if (bayKind(x, z) === "pier") { put(x, y, z, "white_concrete"); continue; }

    // Window bay: spandrel below, glass in two rows, frame at the top of the glass
    if (r === 3) { put(x, y, z, "light_gray_concrete"); continue; }
    if (r === 2) { put(x, y, z, "white_concrete"); continue; } // head frame
    put(x, y, z, "light_blue_stained_glass_pane");

    // Warm light in the air gap behind some glass
    if (r === 1 && k % 3 === 1) {
      if (z === D - 1 && x === 3) put(x, y, D - 2, "glowstone");
      if (x === 0 && z === 2) put(1, y, z, "glowstone");
      if (z === 0 && x === 2) put(x, y, 1, "glowstone");
    }
  }
}

// Rooftop plant: penthouse box on the core and hatches on the roof deck
for (let y = T; y < Math.min(H, T + 2); y++) {
  for (let x = 2; x <= 3; x++) for (let z = 4; z <= 5; z++) {
    put(x, y, z, y === T ? "light_gray_concrete" : "white_concrete");
  }
}
put(1, T, 7, "iron_block");
put(4, T, 7, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
