import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Xinyi office block: pale tiled stone base, white-mullioned
// blue-glass curtain wall with spandrel bands, corner piers, a glazed-door
// entrance on the north edge, a flat roof with parapet and a central plant
// penthouse with a mast. Roof slab at y=31, parapet to y=32.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588110312";
const OUT = `${DIR}/${ID}.nbt`;

const W = 40, H = 43, D = 36;
const TOP = 31;          // roof slab level (about 31 blocks above lowest ground)
const STOREY = 5;        // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint: (x,z) -> ground y
const ground = new Map();
for (const [x, z, g0] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP - 1, Math.round(g0))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const missing = (x, z) =>
  [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].filter(([a, b]) => !has(a, b)).length;
const exposed = (x, z) => missing(x, z) > 0;
const adjacentToWall = (x, z) =>
  [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => has(a, b) && exposed(a, b));

const g = new Voxels([W, H, D]);

// lowest exposed cell on each x column (north edge = smallest z)
const minZ = new Map();
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!minZ.has(x) || z < minZ.get(x)) minZ.set(x, z);
}

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = exposed(x, z);
  const corner = missing(x, z) >= 2;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slab per storey, air gap, warm light behind some windows
    g.set(x, gy, z, "light_gray_concrete");
    for (let y = gy + STOREY; y < TOP; y += STOREY) {
      g.set(x, y, z, "light_gray_concrete");
    }
    if (adjacentToWall(x, z)) {
      for (let y = gy + 2; y < TOP; y += STOREY) {
        const storeyIdx = Math.floor((y - gy) / STOREY);
        if ((x * 7 + z * 3 + storeyIdx) % 4 === 0) g.set(x, y, z, "glowstone");
      }
    }
    // roof slab
    g.set(x, TOP, z, "light_gray_concrete");
    continue;
  }

  // exterior envelope
  for (let y = gy; y < TOP; y++) {
    const rel = y - gy;
    const s = rel % STOREY;
    let id;
    if (rel === 0) id = "stone_bricks";                 // base course
    else if (corner) id = "white_concrete";             // corner piers
    else if (s === 0) id = "white_concrete";            // storey line
    else if (s === STOREY - 1) id = "light_gray_concrete"; // spandrel
    else if ((x + z) % 3 === 0) id = "white_concrete";  // mullion
    else id = "light_blue_stained_glass_pane";          // glazing
    g.set(x, y, z, id);
  }

  // roof slab and parapet
  g.set(x, TOP, z, "white_concrete");
  g.set(x, TOP + 1, z, corner ? "white_concrete" : "light_gray_concrete");
}

// north entrance: two glazed doors on the lowest-z edge, two storeys tall
for (const x of [19, 20]) {
  const z = minZ.get(x);
  if (z === undefined) continue;
  const gy = ground.get(`${x},${z}`);
  const hinge = x === 19 ? "left" : "right";
  g.set(x, gy + 1, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge, open: "false", powered: "false",
  });
  g.set(x, gy + 2, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge, open: "false", powered: "false",
  });
  // transom glazing above the doors
  g.set(x, gy + 3, z, "light_blue_stained_glass_pane");
}

// central plant penthouse with louvred band and mast
for (let x = 12; x <= 27; x++) {
  for (let z = 11; z <= 24; z++) {
    if (!has(x, z)) continue;
    const rim = x === 12 || x === 27 || z === 11 || z === 24;
    if (rim) {
      for (let y = TOP + 1; y <= TOP + 3; y++) {
        const louvre = y === TOP + 2 && (x + z) % 2 === 0;
        g.set(x, y, z, louvre ? "light_blue_stained_glass_pane" : "white_concrete");
      }
    }
    g.set(x, TOP + 4, z, "light_gray_concrete");
  }
}
for (let y = TOP + 5; y <= TOP + 8; y++) g.set(20, y, 17, "iron_bars");

g.save(OUT);
