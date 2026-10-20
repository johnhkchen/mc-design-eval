import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951327.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951327.nbt";

const W = 28, H = 23, D = 14;
const FL = 5;      // first floor slab, top of ground storey
const ROOF = 10;   // roof deck layer
const TOP = 11;    // parapet layer, roof surface ~11 above lowest ground

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));

const g = new Voxels([W, H, D]);

const pane = (x, z, y) => {
  // connect glass to neighbouring glass along the face it sits on
  const onZFace = z === 0 || z === D - 1;
  const onXFace = x === 0 || x === W - 1;
  const ew = onZFace || !onXFace;
  const ns = onXFace || !onZFace;
  g.set(x, y, z, "glass_pane", {
    east: String(ew), west: String(ew),
    north: String(ns), south: String(ns),
    waterlogged: "false",
  });
};

const perimeter = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Pass 1: foundations, floors, roof deck, parapet, shell
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.floor(gr));
  const perim = perimeter(x, z);

  // foundation solid from y0 to ground
  for (let y = 0; y < ground && y < H; y++) g.set(x, y, z, "stone_bricks");

  // interior floor at grade, first-floor slab, roof deck
  if (ground < FL) g.set(x, ground, z, perim ? "stone_bricks" : "smooth_stone");
  if (FL > ground) g.set(x, FL, z, "smooth_stone");
  g.set(x, ROOF, z, perim ? "smooth_stone" : "light_gray_concrete");

  if (perim) {
    // parapet ring with cornice
    g.set(x, TOP, z, "stone_bricks");
  }
}

// Pass 2: facades
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.floor(gr));
  if (!perimeter(x, z)) continue;
  const pier = x % 3 === 0;
  const onSouth = z === D - 1;

  // ground storey: shopfront with entrance on the south face
  for (let y = ground; y < FL; y++) {
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }
    if (onSouth && (x === 13 || x === 14) && y <= ground + 2 && y + 1 < FL) {
      const half = y === ground + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: x === 13 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (pier) g.set(x, y, z, "white_concrete");
    else pane(x, z, y);
  }

  // upper storey: window grid with piers and header
  for (let y = FL; y < ROOF; y++) {
    if (y === FL) { // sill course
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === ROOF - 1) { // header
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (pier) g.set(x, y, z, "white_concrete");
    else pane(x, z, y);
  }
}

// Pass 3: warm light behind some upper windows (interior cells beside the glass)
for (const [x, z] of cells) {
  if (perimeter(x, z)) continue;
  if ((z === 1 || z === D - 2) && x % 6 === 2) {
    g.set(x, FL + 2, z, "glowstone");
  }
}

// Pass 4: roof equipment and antenna
for (const [x, z] of cells) {
  if (perimeter(x, z)) continue;
  if (x >= 4 && x <= 8 && z >= 3 && z <= 5) {
    g.set(x, TOP, z, "iron_block");
  }
}
if (has(14, 7)) {
  for (let y = TOP; y <= TOP + 4; y++) {
    g.set(14, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
