import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752107";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 6 x 10 footprint, roof top at y = 11 (about 2 storeys of 5 blocks plus cornice).
const W = 6, H = 23, D = 10, TOP = 11;
const GLASS = "light_blue_stained_glass";
const WALL = "white_terracotta";

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
// Only writes on footprint cells, inside the box.
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations, floors, walls, cornice, roof deck.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr >= TOP) continue;

  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  // Ground-floor slab / second-storey floor slab (interior and perimeter).
  if (gr < 5) put(x, 5, z, "smooth_stone");

  // Roof deck (interior ceiling of storey 2, sits on perimeter walls).
  if (!perim && gr < 10) put(x, 10, z, "smooth_stone");

  if (perim) {
    // Base course at ground level, walls up to y 10.
    put(x, gr, z, "polished_andesite");
    for (let y = gr + 1; y <= TOP - 1; y++) put(x, y, z, WALL);
    // Storey line between floors.
    if (5 > gr) put(x, 5, z, "smooth_quartz");
    // Cornice cap at the roof line.
    put(x, TOP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: upper-storey windows with warm lights behind some of them.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (gr >= 6) continue;

  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };

  for (const f of Object.keys(faces)) {
    if (!faces[f]) continue;
    let t, corner, inX, inZ;
    if (f === "N" || f === "S") {
      t = x;
      corner = x === 0 || x === W - 1;
      inX = x;
      inZ = f === "N" ? z + 1 : z - 1;
    } else {
      t = z;
      corner = z === 0 || z === D - 1;
      inZ = z;
      inX = f === "W" ? x + 1 : x - 1;
    }
    if (corner || t % 2 !== 1) continue;

    // Window: glass band y 6..8 with the wall frame around it.
    for (let y = 6; y <= 8; y++) put(x, y, z, GLASS);
    // Sill and lintel frame.
    put(x, 5, z, "smooth_quartz");
    put(x, 9, z, WALL);

    // Warm shroomlight just behind the glass, in some windows.
    if (t === 1 || t === 4) {
      put(inX, 7, inZ, "shroomlight");
    }
  }
}

// Pass 3: shopfront on the street (north, z = 0) face, ground storey.
for (let x = 0; x < W; x++) {
  if (!has(x, 0)) continue;
  const gr = G.get(`${x},0`);
  if (gr >= 4) continue;

  // Red fascia / canopy band over the shopfronts.
  put(x, 4, 0, "red_terracotta");

  // Glass shopfronts, with the entrance door in the middle.
  if (x === 1 || x === 3 || x === 4 || x === 2) {
    for (let y = gr + 1; y <= 3; y++) {
      if (x === 2 && gr <= 2 && (y === gr + 1 || y === gr + 2)) continue;
      put(x, y, 0, GLASS);
    }
  }
}

// Entrance door at x = 2 (only where it fits above the base course).
if (has(2, 0) && G.get("2,0") <= 2) {
  const gr = G.get("2,0");
  put(2, gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, gr + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Pass 4: rooftop water tank / equipment block near the centre.
for (const [tx, tz] of [[2, 5], [3, 5], [2, 6], [3, 6]]) {
  if (!has(tx, tz)) continue;
  for (let y = TOP; y <= TOP + 2; y++) put(tx, y, tz, "copper_block");
  put(tx, TOP + 3, tz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
