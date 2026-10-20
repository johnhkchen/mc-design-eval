import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011425";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 9;
const ROOF = 11;          // roof level above lowest ground (lidar record)
const STRING = 5;         // floor line between storeys
const CORNICE = 10;       // top of second storey / cornice band
const GROUND_TOP = 4;     // last block of the ground storey (shopfront)

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), Math.min(Math.max(0, Math.round(gr)), ROOF - 1));
const has = (x, z) => gmap.has(key(x, z));
const groundAt = (x, z) => gmap.get(key(x, z));

const minZ = Math.min(...cells.map((c) => c[1]));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const isFront = (x, z) => !has(x, z - 1);
// glass pane orientation: runs along the wall it sits in
const paneProps = (x, z) => {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};
const slabBottom = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, walls, storey lines, shopfront, windows, roof
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gr = groundAt(x, z);
  const perim = isPerim(x, z);
  const corner = perim && isCorner(x, z);
  const front = perim && isFront(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // storey band / floor slab on every footprint cell
  if (gr <= STRING) g.set(x, STRING, z, perim ? "smooth_stone" : "smooth_stone");

  // ground storey
  for (let y = gr; y <= GROUND_TOP; y++) {
    if (!perim) continue; // interior: air behind the glass
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (front) {
      if (y === gr) g.set(x, y, z, "polished_andesite");
      else if (y === GROUND_TOP) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "glass_pane", paneProps(x, z));
    } else {
      g.set(x, y, z, "light_gray_concrete");
    }
  }

  // second storey: windows between floor line and cornice
  if (perim) {
    for (let y = STRING + 1; y <= 9; y++) {
      if (y === 9) { g.set(x, y, z, "white_concrete"); continue; } // lintel
      if (corner) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "glass_pane", paneProps(x, z));
    }
  }

  // ceiling / cornice band
  if (perim) g.set(x, CORNICE, z, "stone_brick_slab", slabBottom);
  else g.set(x, CORNICE, z, "smooth_stone");

  // roof: parapet on the perimeter, tiled roof surface inside
  if (perim) g.set(x, ROOF, z, "white_concrete");
  else g.set(x, ROOF, z, "stone_brick_slab", slabBottom);
}

// Pass 2: front entrance door (dark oak) under the shopfront
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!(isPerim(x, z) && isFront(x, z) && !isCorner(x, z))) continue;
  if (x !== 2 && x !== 3) continue;
  const gr = groundAt(x, z);
  if (gr + 1 > GROUND_TOP - 1) continue;
  if (x !== 2) continue; // single entrance on the front centre-left bay
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr, z, "dark_oak_door", { ...doorProps, half: "lower" });
  g.set(x, gr + 1, z, "dark_oak_door", { ...doorProps, half: "upper" });
  // canopy-style lintel directly above the door
  g.set(x, GROUND_TOP, z, "dark_oak_planks");
}

// Pass 3: warm light behind some upper windows (inside the air gap)
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if ((x + z) % 2 !== 0) continue;
  // inward neighbour that is an interior footprint cell
  const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(
    ([nx, nz]) => has(nx, nz) && !isPerim(nx, nz),
  );
  if (!inward) continue;
  const [ix, iz] = inward;
  if (groundAt(x, z) > 7) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Pass 4: roof plant on one interior roof cell
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if (x !== 2 || z !== Math.max(...cells.map((c) => c[1])) - 2) continue;
  g.set(x, ROOF + 1, z, "iron_block");
  g.set(x, ROOF + 2, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
