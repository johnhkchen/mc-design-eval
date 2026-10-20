import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458219";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 10 x 14 footprint, roof ~11 blocks above lowest ground.
// Reading: a low, two-storey reinforced-concrete commercial block of the
// 1980s-90s Xinyi fabric: white concrete frame, grey base course, strip
// windows in aluminium-framed glass, a shopfront at street level, a parapet
// cornice and rooftop plant. Two storeys of about 5 blocks each.
const W = 10, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const ROOF = 11;     // roof slab top line
const FLOOR2 = 5;    // storey line between floors
const PARAPET = 12;  // parapet course
const CAP = 13;      // coping slab

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

let minZ = Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z] of cells) {
  minZ = Math.min(minZ, z);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const doorX = Math.round((minX + maxX) / 2);

function outFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

function paneProps(of) {
  const alongNS = of.includes("north") || of.includes("south");
  return alongNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  const of = outFaces(x, z);
  const perim = of.length > 0;
  const corner = of.length >= 2;
  const primary = of.includes("north") || of.includes("south") ? "ns" : "ew";
  const idx = primary === "ns" ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) {
    if (y < gr) g.set(x, y, z, "stone_bricks");
    else g.set(x, y, z, perim ? "polished_andesite" : "light_gray_concrete");
  }

  // Floor slab at the storey line and roof slab, spanning every cell.
  if (FLOOR2 > gr) g.set(x, FLOOR2, z, "smooth_stone");
  if (ROOF > gr) g.set(x, ROOF, z, "light_gray_concrete");

  if (!perim) {
    // Interior: air, with lanterns standing on the first-floor slab and
    // rooftop plant on the roof.
    if (FLOOR2 > gr && (x + z) % 4 === 0) {
      g.set(x, FLOOR2 + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    if (x % 3 === 1 && z % 4 === 1) {
      g.set(x, PARAPET, z, "iron_block");
    }
    continue;
  }

  // Walls on the perimeter: ground storey band.
  for (let y = gr + 1; y < FLOOR2; y++) {
    const isDoorCell = x === doorX && z === minZ && of.includes("north");
    if (isDoorCell && y <= gr + 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (y === gr + 3 || y === FLOOR2 - 1) {
      // Lintel / fascia row over the shopfront.
      g.set(x, y, z, "light_gray_concrete");
    } else if (corner) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (idx % 2 === 0 && y <= gr + 2) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(of));
    }
  }

  // Storey line course.
  if (FLOOR2 > gr) g.set(x, FLOOR2, z, "smooth_stone");

  // Upper storey: window bands with mullions and a warm glow.
  for (let y = FLOOR2 + 1; y < ROOF; y++) {
    if (y <= gr) continue;
    if (corner) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (idx % 3 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(of));
    }
  }

  // Parapet and coping on the perimeter.
  g.set(x, PARAPET, z, "light_gray_concrete");
  g.set(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
