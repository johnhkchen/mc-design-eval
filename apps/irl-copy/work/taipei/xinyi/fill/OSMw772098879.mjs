import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098879";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup. Ground values are rebased so the lowest ground is y 0.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const minG = Math.min(...cells.map((c) => c[2]));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) - minG;
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const X0 = Math.min(...xs), X1 = Math.max(...xs);
const Z0 = Math.min(...zs), Z1 = Math.max(...zs);
const CX = Math.floor((X0 + X1) / 2); // central entrance column

const ROOF = 10;   // top block of parapet/roof: roof about 11 above lowest ground
const FL2 = 5;     // second-floor slab line
const FASCIA = 4;  // top of shopfront band

// Only write on footprint cells, inside the volume.
function put(x, y, z, id, props) {
  if (y < 0 || y >= H || !inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isPerim = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// Interior structure: ground slab, second-floor slab, roof deck.
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  put(x, gr, z, "smooth_stone");
  put(x, FL2, z, "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");
}

// Perimeter walls.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const gr = gAt(x, z);
  const faces = { N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z) };
  const onNS = faces.N || faces.S;
  const front = faces.N && z === Z0;
  const along = onNS ? x - X0 : z - Z0;
  const span = onNS ? X1 - X0 : Z1 - Z0;
  const pier = along === 0 || along === span || along % 2 === 0;
  const paneProps = onNS
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Plinth.
  put(x, gr, z, "polished_andesite");

  // Ground storey: shopfront on the street face, white wall elsewhere.
  for (let y = gr + 1; y <= 3; y++) {
    if (front) {
      if (x === CX && z === Z0) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else if (along % 3 === 0) {
        put(x, y, z, "smooth_stone");
      } else {
        put(x, y, z, "glass");
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Shopfront fascia band.
  if (FASCIA > gr) {
    put(x, FASCIA, z, front ? "black_concrete" : "white_concrete");
  }

  // Second-floor slab line.
  if (FL2 > gr) put(x, FL2, z, "smooth_stone");

  // Upper storey: window bays on odd columns, piers between.
  if (gr < FL2) {
    if (!pier) {
      put(x, 6, z, "smooth_stone");
      put(x, 7, z, "light_blue_stained_glass_pane", paneProps);
      put(x, 8, z, "light_blue_stained_glass_pane", paneProps);
      put(x, 9, z, "white_concrete");
    } else {
      put(x, 6, z, "white_concrete");
      put(x, 7, z, "white_concrete");
      put(x, 8, z, "white_concrete");
      put(x, 9, z, "white_concrete");
    }
  }

  // Parapet cap.
  if (ROOF > gr) put(x, ROOF, z, "stone_bricks");
}

// Warm lights behind the glass on the front and back interior rows.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  const gr = gAt(x, z);
  const along = x - X0;
  if (z === Z0 + 1 && along % 6 === 1) put(x, gr + 1, z, "glowstone");
  if (z === Z0 + 1 && along % 6 === 4) put(x, 7, z, "shroomlight");
  if (z === Z1 - 1 && along % 6 === 1) put(x, 7, z, "shroomlight");
}

// Roof equipment: stair housing, water tank, rooftop AC units.
for (let x = X0 + 2; x <= X0 + 3; x++)
  for (let z = Z0 + 2; z <= Z0 + 3; z++) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "white_concrete");
    put(x, ROOF + 3, z, "smooth_stone");
  }

for (let x = X0 + 6; x <= X0 + 8; x++)
  for (let z = Z0 + 10; z <= Z0 + 12; z++) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 4, z, "smooth_stone");
  }

put(X0 + 5, ROOF + 1, Z0 + 5, "iron_block");
put(X0 + 5, ROOF + 1, Z0 + 7, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
