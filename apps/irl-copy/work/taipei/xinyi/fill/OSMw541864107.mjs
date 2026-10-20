import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864107";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, D = 10, H = 23;
const ROOF = 10;     // roof slab level (top of storey 2)
const PARAPET = 11;  // parapet course on top of roof slab
const SLAB = 5;      // storey floor line

// Footprint with per-cell ground level (clamped to a sane range)
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.max(0, Math.min(H - 3, Math.round(gy))));
  }
}
const inF = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const pier = (x, z) => x % 3 === 0 || !inF(x - 1, z) || !inF(x + 1, z);

const g = new Voxels([W, H, D]);

const DOOR_X = 10;
const DOOR_Z = 0;

// Pass 1: foundations, floors, walls, storey lines, roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground, then the floor at ground level
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  // Storey floor line at y=5 across the whole footprint where it sits above ground
  if (gr < SLAB) g.set(x, SLAB, z, "light_gray_concrete");

  // Roof slab across the footprint
  if (gr < ROOF) g.set(x, ROOF, z, "light_gray_concrete");

  if (!perim(x, z)) continue;

  // Perimeter walls, ground to parapet
  for (let y = gr + 1; y <= PARAPET; y++) {
    if (y === SLAB || y === ROOF) {
      g.set(x, y, z, "light_gray_concrete");          // storey line / cornice band
    } else if (y === PARAPET) {
      g.set(x, y, z, "white_concrete");               // parapet
    } else if (y <= 4) {
      // ground storey: shopfront glazing between concrete piers
      g.set(x, y, z, pier(x, z) ? "light_gray_concrete" : "cyan_stained_glass");
    } else {
      // upper storey: window bays between white piers
      g.set(x, y, z, pier(x, z) ? "white_concrete" : "cyan_stained_glass");
    }
  }
}

// Pass 2: entrance door on the street front, with a dark frame above the lintel
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x !== DOOR_X || z !== DOOR_Z || gr > 2) continue;
  g.set(x, gr + 1, z, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 2, z, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Dark lintel over the door
  if (gr + 3 <= 4) g.set(x, gr + 3, z, "gray_concrete");
}

// Pass 3: warm light just behind the glass (interior air gap at z=1)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 1 || perim(x, z)) continue;
  if (x % 6 === 4 && 7 > gr && 7 < ROOF) g.set(x, 7, z, "glowstone");
  if (x % 6 === 1 && 2 > gr && 2 < SLAB) g.set(x, 2, z, "glowstone");
}

// Pass 4: rooftop air-conditioning plant on the roof slab
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x >= 4 && x <= 5 && z >= 4 && z <= 5 && gr < ROOF) {
    g.set(x, PARAPET, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
