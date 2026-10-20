import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw1174740030";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 19, D = 31, H = 23;
const FLOOR2 = 5;   // second-floor line
const ROOF = 11;    // roof slab level (about 11 blocks above lowest ground)
const PARAPET = 12; // parapet course on the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function exteriorFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const g = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";

for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  const faces = exteriorFaces(x, z);
  const edge = faces.length > 0;
  const face = faces.includes("north") ? "north" : faces[0];
  const idx = face === "north" || face === "south" ? x : z;

  // Foundation under each cell, then the ground-level floor or base course
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");

  // Second-floor slab (storey line) across the whole plate
  if (FLOOR2 > gr) g.set(x, FLOOR2, z, "light_gray_concrete");

  // Roof slab across the whole plate
  g.set(x, ROOF, z, "gray_concrete");

  if (!edge) continue;

  // Facade, storey by storey, on the outer ring only
  for (let y = gr + 1; y < ROOF; y++) {
    let b = PIER;
    if (y === FLOOR2) b = "light_gray_concrete";
    else if (y === 10) b = "smooth_stone";
    else if (y === 9) b = PIER;
    else if (y >= 6 && y <= 8) {
      b = idx % 3 === 1 ? GLASS : PIER;
    } else if (y >= gr + 1 && y <= gr + 3 && y <= 4) {
      if (face === "north") {
        const shop = idx >= 2 && idx <= 16 && idx !== 8 && idx !== 10 && idx !== 9;
        b = shop ? GLASS : PIER;
      } else {
        b = idx % 3 === 1 ? GLASS : PIER;
      }
    } else if (face === "north" && y === gr + 4 && y <= 4 && idx >= 1 && idx <= 17) {
      b = "red_terracotta"; // shopfront sign band
    }
    g.set(x, y, z, b);
  }

  // Parapet course on the roof edge
  g.set(x, PARAPET, z, "light_gray_concrete");
}

// Street entrance: centre bay of the north facade
if (has(9, 0) && exteriorFaces(9, 0).includes("north")) {
  const gr = ground.get("9,0");
  if (gr + 1 <= 4) {
    g.set(9, gr + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(9, gr + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light behind the glass (interior only)
for (let z = 1; z < D - 1; z++) {
  if (has(1, z) && exteriorFaces(1, z).length === 0 && z % 6 === 3) {
    g.set(1, 7, z, "shroomlight");
  }
}
for (const x of [5, 13]) {
  if (has(x, 1) && exteriorFaces(x, 1).length === 0) {
    const gr = ground.get(`${x},1`);
    g.set(x, gr + 1, 1, "lantern", { hanging: "false" });
  }
}

// Roof equipment: an air-handling block and a water tank, both standing on the roof slab
for (let x = 5; x <= 7; x++) for (let z = 9; z <= 11; z++) {
  if (!has(x, z)) continue;
  g.set(x, ROOF + 1, z, "light_gray_concrete");
  g.set(x, ROOF + 2, z, "light_gray_concrete");
}
for (let x = 12; x <= 14; x++) for (let z = 20; z <= 22; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
