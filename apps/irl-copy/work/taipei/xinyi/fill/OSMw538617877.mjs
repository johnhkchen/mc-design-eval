import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617877";
const W = 6, D = 9, H = 23;
const TOP = 11;      // roof level, about 11 blocks above the lowest ground
const BAND = 5;      // storey line height (blocks per storey)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Number(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Exterior faces of a cell (faces with no neighbour in the footprint)
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Facade block for a perimeter cell at height y.
// Mid-century Xinyi style: white tiled/concrete frame, quartz piers,
// blue-tinted glazing, red fascia over the ground-floor shopfront on the south (street) side.
function facade(face, x, z, y, b) {
  const isNS = face === "N" || face === "S";
  const i = isNS ? x : z;
  const last = isNS ? W - 1 : D - 1;
  const pier = i === 0 || i === last || i % 3 === 0;

  if (y >= 10) {
    // parapet band above the upper storey
    return pier ? "quartz_block" : "white_concrete";
  }

  const isLower = y < BAND;
  const lo = isLower ? b : BAND;
  const hi = isLower ? BAND : 10;

  // lintel row over each storey window band
  if (y === hi - 1) {
    return isLower && face === "S" ? "red_terracotta" : "white_concrete";
  }

  // ground-floor shopfront on the street face
  if (isLower && face === "S") {
    if (i === 0 || i === last) return "quartz_block";
    return "light_blue_stained_glass";
  }

  if (pier) return "quartz_block";
  if (y > lo && y < hi - 1) return "light_blue_stained_glass";
  return "white_concrete";
}

const glowSpots = [];

for (const [key, b0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const b = Math.max(0, Math.min(b0, TOP - 2));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const face = faces.includes("S") ? "S" : faces[0];

  for (let y = b; y <= TOP; y++) {
    let id = null;
    if (y === b) {
      id = perim ? "polished_andesite" : "smooth_stone";            // base course / floor slab
    } else if (y === TOP) {
      id = perim ? "smooth_stone" : "light_gray_concrete";           // coping / roof slab
    } else if (y === BAND || y === 10) {
      id = "smooth_stone";                                           // storey line / floor slab
    } else if (perim) {
      id = facade(face, x, z, y, b);
    }
    if (!id) continue;
    g.set(x, y, z, id);

    // remember window cells that get a warm light behind them
    if (perim && id === "light_blue_stained_glass" && (x * 5 + z * 3 + y) % 5 === 0) {
      let ix = x, iz = z;
      if (face === "N") iz = z + 1;
      else if (face === "S") iz = z - 1;
      else if (face === "W") ix = x + 1;
      else if (face === "E") ix = x - 1;
      if (has(ix, iz)) glowSpots.push([ix, y, iz]);
    }
  }
}

// Entrance door on the street face, with the ground-floor shopfront around it
if (has(2, 8)) {
  const b = ground.get("2,8");
  if (b + 2 < BAND) {
    g.set(2, b + 1, 8, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(2, b + 2, 8, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light behind selected windows (glowstone in the interior air gap)
for (const [x, y, z] of glowSpots) g.set(x, y, z, "glowstone");

// Roof plant box and lightning rod on interior roof cells
const interiorRoof = (x, z) => has(x, z) && facesOf(x, z).length === 0;
for (let x = 2; x <= 3; x++) {
  for (let z = 3; z <= 5; z++) {
    if (interiorRoof(x, z)) g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}
if (interiorRoof(1, 1)) {
  g.set(1, TOP + 1, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
