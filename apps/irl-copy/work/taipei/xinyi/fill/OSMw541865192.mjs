import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 福佑宮 (Fuyou Temple), Taipei: a two-storey Taiwanese temple hall with red brick walls,
// yellow terracotta bands, grey tile hip roof with a yellow ridge and gold finials,
// and a lit interior seen through the glass at dusk.
const cells = JSON.parse(
  readFileSync(
    "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865192.cells.json",
    "utf8"
  )
);

const W = 8;   // x
const D = 23;  // z
const H = 23;  // y
const g = new Voxels([W, H, D]);

const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, gr);
const minG = Math.min(...cells.map((c) => c[2]));

// Storey geometry, all keyed to the lowest ground so the roof sits ~11 blocks above it.
const storeyLine = minG + 5;   // yellow band between the two storeys
const eave = minG + 8;         // top of the walls
const ridge = minG + 11;       // top of the roof (eave + 3)

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Window grid on the perimeter. Two bands: ground storey and upper storey.
const inBand = (y) =>
  (y >= minG + 2 && y <= minG + 3) || (y >= minG + 6 && y <= minG + 7);

const windowAt = (x, y, z) => {
  if (!inBand(y)) return false;
  if (x === 0 || x === W - 1) {
    return z >= 2 && z <= 20 && (z - 2) % 4 < 2;
  }
  if (z === 0 || z === D - 1) {
    return x === 1 || x === 2 || x === 5 || x === 6;
  }
  return false;
};

// Lit cells just inside the glass (glowstone behind some windows).
const litInside = (x, y, z) =>
  (x === 1 || x === W - 2) && y === minG + 6 && (z === 4 || z === 10 || z === 16 || z === 18);

for (const [x, z, gr] of cells) {
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const d = Math.min(x, W - 1 - x, z, D - 1 - z);

  // Foundation from y 0 to ground, then a stone base course at ground level.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks");

  if (edge) {
    // Walls from the first course above ground up to the eave.
    for (let y = gr + 1; y <= eave; y++) {
      let id = "red_terracotta";
      if (y === gr + 1) id = "polished_andesite";          // base course
      else if (y === storeyLine && storeyLine > gr) id = "yellow_terracotta"; // storey line
      else if (y === eave) id = "yellow_terracotta";       // cornice
      else if (windowAt(x, y, z)) id = "glass_pane";
      put(x, y, z, id);
    }
  } else {
    // Interior: floor slab at the storey line, ceiling slab at the eave; air between.
    if (storeyLine > gr) put(x, storeyLine, z, "smooth_stone");
    put(x, eave, z, "smooth_stone");
    if (litInside(x, 0, z) === false && storeyLine > gr && (x === 1 || x === W - 2)) {
      // glowstone one block inside the glass
      if (litInside(x, minG + 6, z)) put(x, minG + 6, z, "glowstone");
    }
  }

  // Roof: hip profile stepping up from the eave to the ridge, standing on the ceiling/walls.
  const top = eave + 1 + Math.min(2, d);
  for (let y = eave + 1; y <= top; y++) {
    let id = "gray_concrete";
    if (y === top && d >= 2 && (x === 3 || x === 4)) id = "yellow_concrete"; // ridge line
    put(x, y, z, id);
  }
}

// Front (z = 0) entrance: twin dark oak doors with a yellow lintel.
for (const x of [3, 4]) {
  const gr = groundAt.get(`${x},0`) ?? minG;
  put(x, gr + 1, 0, "dark_oak_door", {
    facing: "north",
    half: "lower",
    hinge: x === 3 ? "left" : "right",
    open: "false",
    powered: "false",
  });
  put(x, gr + 2, 0, "dark_oak_door", {
    facing: "north",
    half: "upper",
    hinge: x === 3 ? "left" : "right",
    open: "false",
    powered: "false",
  });
  if (gr + 3 <= eave) put(x, gr + 3, 0, "yellow_terracotta");
}

// Hanging lanterns beside the entrance, under the lintel line.
for (const x of [1, 6]) {
  const gr = groundAt.get(`${x},0`) ?? minG;
  if (gr + 3 <= eave - 1) {
    put(x, gr + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Gold finials at the two ends of the ridge.
if (ridge + 1 < H) {
  put(3, ridge + 1, 3, "gold_block");
  put(4, ridge + 1, 19, "gold_block");
}

g.save(
  "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865192.nbt"
);
