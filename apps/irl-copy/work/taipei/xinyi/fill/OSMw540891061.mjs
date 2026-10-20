import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891061.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891061.nbt";

// 12 x 20 footprint, roof about 11 blocks above lowest ground.
// Two storeys of about 5 blocks, concrete frame with quartz storey lines,
// tiled-look parapet, shopfront on the street (z = 0) face.
const W = 12, H = 23, D = 20;
const LINE_2 = 5;     // storey line / upper floor level
const DECK = 9;       // cornice line and roof deck
const ROOF = 10;      // top block of parapet (roof surface sits at y = 11)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  if (!perimeter) {
    // Interior: floor slabs and roof deck only; the rest is air behind glass.
    for (const y of [gr, LINE_2, DECK]) {
      if (y >= gr && y <= DECK) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const onStreet = z === 0;
  const edgeX = x === 0 || x === W - 1;
  const edgeZ = z === 0 || z === D - 1;
  const corner = edgeX && edgeZ;
  const along = edgeZ ? x : z;           // index along the face
  const pier = corner || along % 3 === 0;

  // Inward direction for placing warm light behind windows.
  let inX = 0, inZ = 0;
  if (x === 0) inX = 1; else if (x === W - 1) inX = -1;
  if (z === 0) inZ = 1; else if (z === D - 1) inZ = -1;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "stone_brick_wall"); continue; }
    if (y === DECK) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === LINE_2) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }

    const groundBand = y >= gr + 1 && y <= gr + 3;
    const groundSpandrel = y === gr + 4;
    const upperBand = y >= 6 && y <= 8;

    if (onStreet && groundBand) {
      // Shopfront: glass with piers, entrance at x = 5.
      if (x === 5) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", powered2: "false" });
        else put(x, y, z, "glass_pane");
        continue;
      }
      put(x, y, z, pier ? "stone_bricks" : "glass_pane");
      continue;
    }

    if (groundSpandrel) { put(x, y, z, "white_concrete"); continue; }

    if (upperBand || (groundBand && !onStreet)) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass_pane");
      // Warm light behind every sixth window on the upper floor.
      if (upperBand && y === 7 && !corner && (along % 6 === 1)) {
        const ix = x + inX, iz = z + inZ;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Plain wall fill (between storey lines, around doors).
    put(x, y, z, "light_gray_concrete");
  }
}

// Rooftop: water tank, air-conditioning plant, lightning rod.
for (let y = ROOF; y <= ROOF + 1; y++) {
  for (const [tx, tz] of [[2, 3], [3, 3], [2, 4], [3, 4]]) put(tx, y, tz, "white_concrete");
}
for (const [ax, az] of [[8, 13], [9, 13], [8, 14], [9, 14]]) put(ax, ROOF, az, "iron_block");
put(1, ROOF + 1, 17, "lightning_rod", { facing: "up", powered: "false" });

g.save(OUT);
