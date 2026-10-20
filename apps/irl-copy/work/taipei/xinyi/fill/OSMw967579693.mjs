import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579693";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 22 x 23 x 29: roof parapet at y 11, headroom above for roof plant.
const W = 22, H = 23, D = 29;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => gmap.has(`${x},${z}`);

// Street-facing side is the south (max z) face. Door sits on the median south-facing x.
const southXs = [];
for (const [x, z] of cells) if (!has(x, z + 1)) southXs.push(x);
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Facade block for an edge cell at height y on face `face`, bay index `i`.
function facadeBlock(face, i, y, gr, x, z) {
  const front = face === "S";
  if (y === 5) return { id: "light_gray_concrete" };
  if (y === 9) return { id: "white_concrete" };
  if (y <= 4) {
    // Ground floor shopfronts
    if (front) {
      if (x === doorX && (y === gr || y === gr + 1)) {
        return { id: "dark_oak_door", props: {
          facing: "south", half: y === gr ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false" } };
      }
      if (x === doorX && y === gr + 2) return { id: "white_concrete" };
      if (i % 4 === 0) return { id: "smooth_stone" };
      return { id: "glass" };
    }
    return (i % 3 === 1) ? { id: "glass" } : { id: "white_concrete" };
  }
  // Upper storey (y 6..8)
  if (i % 3 === 0) return { id: "smooth_quartz" };
  if (i % 3 === 1) {
    if (y === 7 && (i * 5 + x + z) % 7 === 0) return { id: "glowstone" };
    return { id: "light_blue_stained_glass" };
  }
  return { id: "white_concrete" };
}

for (const [xr, zr, grRaw] of cells) {
  const x = xr, z = zr, gr = Math.round(grRaw);
  // Foundation course from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const edge = fs.length > 0;

  // Storey line at y 5 and roof deck at y 10 on every cell (no air gaps under tiers).
  if (gr <= 5) g.set(x, 5, z, "light_gray_concrete");
  if (gr <= 10) g.set(x, 10, z, edge ? "smooth_quartz" : "light_gray_concrete");

  if (edge) {
    const face = fs[0];
    const i = (face === "N" || face === "S") ? x : z;
    for (let y = gr; y <= 9; y++) {
      if (y === 10) continue;
      const b = facadeBlock(face, i, y, gr, x, z);
      g.set(x, y, z, b.id, b.props);
    }
    // Parapet course at roof level.
    g.set(x, 11, z, "white_concrete");
  } else {
    // Interior: roof plant boxes on the deck.
    if (x % 6 === 2 && z % 7 === 3) {
      g.set(x, 11, z, "light_gray_concrete");
      g.set(x, 12, z, "light_gray_concrete");
    }
  }
}

// Entrance lantern hung in the lobby behind the door.
if (doorX >= 0 && has(doorX, zDoorMinus())) {
  const gr = gmap.get(`${doorX},${southZ()}`) ?? 0;
  g.set(doorX, gr + 3, southZ() - 1, "lantern", { hanging: "true" });
}

function southZ() {
  let zMax = -1;
  for (const [x, z] of cells) if (x === doorX && z > zMax) zMax = z;
  return zMax;
}
function zDoorMinus() { return southZ() - 1; }

g.save(`${DIR}/${ID}.nbt`);
