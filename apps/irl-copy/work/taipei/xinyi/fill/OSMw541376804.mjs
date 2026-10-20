import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 26 x 13 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey Xinyi-style commercial block of the 1980s. Light
// tiled concrete walls, stone-brick base and parapet, a street-front shopfront
// with glass display windows and a red signage band, and framed upper-floor
// windows with warm glowstone behind some panes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376804";
const W = 26, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inside = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const L0 = Math.min(...cells.map((c) => c[2]));   // lowest ground
const FL = L0 + 5;     // first floor slab (storey line)
const SHOP = L0 + 4;   // top of shopfront / signage band
const TOP = L0 + 10;   // parapet top (roof ~11 blocks above lowest ground)

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward face a perimeter cell sits on, its index along that face,
// whether it is a corner, and the inward offset into the building.
function faceOf(x, z) {
  const n = !inside(x, z - 1), s = !inside(x, z + 1);
  const w = !inside(x - 1, z), e = !inside(x + 1, z);
  const count = [n, s, w, e].filter(Boolean).length;
  const corner = count >= 2;
  if (n) return { face: "N", idx: x, corner, dx: 0, dz: 1 };
  if (s) return { face: "S", idx: x, corner, dx: 0, dz: -1 };
  if (w) return { face: "W", idx: z, corner, dx: 1, dz: 0 };
  if (e) return { face: "E", idx: z, corner, dx: -1, dz: 0 };
  return { face: null, idx: 0, corner: false, dx: 0, dz: 0 };
}

const DOOR_IDX = 3;     // street-face door column
const PIER_EVERY = 6;   // shopfront piers

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge(x, z)) {
    // Interior: floor at ground, storey slab, roof deck. Air between.
    put(x, gr, z, "smooth_stone");
    if (FL >= gr) put(x, FL, z, "smooth_stone");
    if (TOP >= gr) put(x, TOP, z, "gray_concrete");
    // Roof equipment: a couple of small plant units on the roof deck.
    if (x % 7 === 3 && z === 6 && TOP >= gr) put(x, TOP + 1, z, "iron_block");
    // Warm lantern inside the shopfront, behind the glass.
    if (z === 1 && x === 8 && gr + 1 <= SHOP - 1) put(x, gr + 1, z, "lantern", { hanging: "false" });
    continue;
  }

  const { face, idx, corner, dx, dz } = faceOf(x, z);
  const isStreet = face === "N";
  const winCol = !corner && face !== null && idx > 0 && [1, 2].includes(idx % 4);

  // Wall shell, white tiled concrete from ground to parapet.
  for (let y = gr; y <= TOP; y++) put(x, y, z, "white_concrete");

  // Stone base course and parapet.
  put(x, gr, z, "stone_bricks");
  put(x, TOP, z, "stone_bricks");

  // Storey line at the first floor.
  if (FL >= gr && FL < TOP) put(x, FL, z, "smooth_stone");

  // Corners are stone piers the full height.
  if (corner) {
    for (let y = gr; y <= TOP; y++) put(x, y, z, "stone_bricks");
  }

  // Ground floor.
  if (isStreet && !corner) {
    // Shopfront: glass display windows, stone piers, a door, red signage band.
    const pier = idx % PIER_EVERY === 0;
    for (let y = gr + 1; y <= SHOP - 1; y++) {
      if (pier) put(x, y, z, "stone_bricks");
      else put(x, y, z, "glass");
    }
    if (idx === DOOR_IDX && gr + 1 <= SHOP - 1) {
      put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    put(x, SHOP, z, "red_terracotta");
  } else if (!isStreet && winCol) {
    // Side and rear ground-floor glazing.
    for (let y = gr + 1; y <= SHOP - 1; y++) put(x, y, z, "glass_pane", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
  }

  // Upper floor: framed windows, piers in between.
  if (winCol && !isStreet) {
    put(x, L0 + 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // sill
    for (let y = L0 + 7; y <= L0 + 8; y++) put(x, y, z, "glass_pane", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
    put(x, L0 + 9, z, "stone_bricks"); // lintel
    // Warm light behind every few panes.
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !edge(ix, iz) && idx % 8 === 1) {
      put(ix, L0 + 7, iz, "glowstone");
    }
  } else if (isStreet && !corner && winCol) {
    // Upper street face: framed windows as well.
    put(x, L0 + 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    for (let y = L0 + 7; y <= L0 + 8; y++) put(x, y, z, "glass_pane", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
    put(x, L0 + 9, z, "stone_bricks");
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !edge(ix, iz) && idx % 8 === 1) {
      put(ix, L0 + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
