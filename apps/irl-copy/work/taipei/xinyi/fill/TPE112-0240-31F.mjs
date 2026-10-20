import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE112-0240-31F: 2023 two-storey Xinyi retail/office block, white stone and
// glass, shopfront ground floor, cyan glazed upper floor, plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE112-0240-31F";
const W = 30, H = 23, D = 52;
const ROOF = 11;          // roof slab level above lowest ground (lidar: ~11)
const SHOP_TOP = 5;       // storey line between floors
const SHOP_GLASS = "light_blue_stained_glass_pane";
const UPPER_GLASS = "cyan_stained_glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Which sides of this cell face outside the footprint
const faceList = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const isPerim = (x, z) => faceList(x, z).length > 0;

// Glass pane connection state so panes read as continuous glazing in each wall
const pane = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance bays on the north face (index measured from minX)
const ENTRY_FIRST = 12, ENTRY_LAST = 16, DOOR_BAY = 14;

// Pass 1: foundations, floors, walls, parapets, roof plant
for (const [x, z, g0] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  if (g0 >= ROOF) continue;

  const f = faceList(x, z);
  if (f.length === 0) {
    // interior: floor slabs per storey, air between, roof deck
    put(x, g0, z, "light_gray_concrete");
    if (SHOP_TOP > g0) put(x, SHOP_TOP, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");

    // rooftop plant: a box and a smaller housing on top of it
    if (x >= minX + 6 && x <= maxX - 6 && z >= minZ + 8 && z <= maxZ - 8) {
      put(x, ROOF + 1, z, "light_gray_concrete");
    }
    if (x >= minX + 10 && x <= maxX - 10 && z >= minZ + 14 && z <= maxZ - 14) {
      put(x, ROOF + 2, z, "smooth_stone");
    }
    continue;
  }

  // perimeter facade
  const face = f[0];
  const corner = f.length > 1;
  const index = face === "N" || face === "S" ? x - minX : z - minZ;
  const mull = corner || index % 4 === 0;
  const inEntry = face === "N" && !corner && index >= ENTRY_FIRST && index <= ENTRY_LAST;

  for (let y = g0; y <= ROOF - 1; y++) {
    // single door at the entrance bay, only where it fits under the canopy
    const isDoor =
      face === "N" && !corner && index === DOOR_BAY && g0 + 2 <= 3 && (y === g0 + 1 || y === g0 + 2);
    if (isDoor) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === g0 + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let b;
    let p = null;
    if (y === g0) {
      b = "polished_andesite";                       // base course
    } else if (y < 4) {
      if (mull) b = "smooth_quartz";
      else { b = SHOP_GLASS; p = pane(face); }        // shopfront glazing
    } else if (y === 4) {
      // entrance canopy band in dark oak, plain lintel elsewhere
      if (inEntry) b = "dark_oak_slab";
      else b = "white_concrete";
      if (inEntry) {
        put(x, y, z, b, { type: "top", waterlogged: "false" });
        continue;
      }
    } else if (y === SHOP_TOP) {
      b = "light_gray_concrete";                      // storey line
    } else if (y === 6 || y === 10) {
      b = "white_concrete";                           // spandrels
    } else {
      if (mull) b = "white_concrete";                 // mullions
      else { b = UPPER_GLASS; p = pane(face); }       // upper glazing
    }
    put(x, y, z, b, p);
  }

  // parapet and cornice at roof level
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: warm light just behind the glass (interior cells only)
for (const [x, z, g0] of cells) {
  if (g0 >= ROOF) continue;
  const f = faceList(x, z);
  if (f.length === 0 || f.length > 1) continue;
  const face = f[0];
  const index = face === "N" || face === "S" ? x - minX : z - minZ;
  const [ix, iz] = INWARD[face];
  const tx = x + ix, tz = z + iz;
  if (!has(tx, tz) || isPerim(tx, tz)) continue;

  // vestibule lantern behind the entrance door
  if (face === "N" && index === DOOR_BAY && g0 + 1 <= 3) {
    put(tx, g0 + 1, tz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // lanterns standing on the ground-floor slab behind the shopfront glass
  else if (index % 8 === 5 && g0 + 1 <= 3) {
    put(tx, g0 + 1, tz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // glowstone on the upper-floor slab behind the glazing
  if (index % 12 === 6 && SHOP_TOP > g0) {
    put(tx, 6, tz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
