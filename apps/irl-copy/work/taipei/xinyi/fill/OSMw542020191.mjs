import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020191";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise mid-century commercial block: two storeys of pale tiled wall,
// a shopfront along the street (west) face, a stone cornice and a parapet.
const W = 6, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const minG = Math.min(...cells.map((c) => c[2]));

const yb = minG;          // ground-floor datum (lowest ground)
const TOP = yb + 11;      // roof slab, about 11 blocks above lowest ground
if (TOP + 1 >= H) throw new Error("roof exceeds volume height");

const inF = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) =>
  inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));
// Outward face of a perimeter cell: street face is west (x = 0 side).
function face(x, z) {
  if (!inF(x - 1, z)) return "W";
  if (!inF(x + 1, z)) return "E";
  if (!inF(x, z - 1)) return "N";
  return "S";
}
const isCorner = (x, z) =>
  (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));

const glassProps = (f) =>
  f === "W" || f === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function wallAt(x, z, y) {
  const f = face(x, z);
  const a = f === "W" || f === "E" ? z : x;   // position along the facade
  const rel = y - yb;

  if (y === TOP - 1) return { id: "stone_bricks" };                 // cornice / parapet cap course
  if (rel <= 0) return { id: "stone_bricks" };                      // base course
  if (rel === 5) return { id: "smooth_stone" };                     // storey line
  if (isCorner(x, z)) return { id: "light_gray_concrete" };         // corner piers

  // Entrance on the street face: one door bay at z = 11, red awning above it.
  const entrance = f === "W" && z === 11;
  if (rel === 4) {
    if (f === "W" && z >= 10 && z <= 12) return { id: "red_concrete" };
    return { id: "white_terracotta" };
  }
  if (entrance && (rel === 1 || rel === 2)) {
    return {
      id: "oak_door",
      props: { facing: "west", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
    };
  }

  const inWindowBand = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 9);
  if (!inWindowBand) return { id: "white_terracotta" };

  // Mullions every third bay; glass elsewhere.
  if (a % 3 === 0) return { id: "light_gray_concrete" };
  if (f === "W" && rel === 3) return { id: "glass_pane", props: glassProps(f) };
  // Warm light behind a few upper windows.
  if (rel >= 6 && a % 6 === 4) return { id: "yellow_stained_glass_pane", props: glassProps(f) };
  return { id: "glass_pane", props: glassProps(f) };
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {
      g.set(x, y, z, perim(x, z) ? "stone_bricks" : "light_gray_concrete"); // roof slab / coping
      continue;
    }
    if (perim(x, z)) {
      const b = wallAt(x, z, y);
      g.set(x, y, z, b.id, b.props);
    } else {
      // Interior: air, with a floor slab at each storey level only.
      if (y === Math.max(gr, yb) || y === yb + 5) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Lantern hanging inside the entrance bay for a warm dusk read at street level.
if (inF(1, 11)) g.set(1, yb + 3, 11, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a small plinth and tank on the interior of the roof.
if (TOP + 2 < H) {
  for (let x = 2; x <= 3; x++) {
    for (let z = 9; z <= 10; z++) {
      if (!inF(x, z) || perim(x, z)) continue;
      g.set(x, TOP + 1, z, "stone_bricks");
      g.set(x, TOP + 2, z, "white_terracotta");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
