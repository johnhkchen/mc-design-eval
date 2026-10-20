import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw839833616: 18 x 19 footprint, roof ~11 above lowest ground.
// Read as a two-storey, late-1980s commercial block in Xinyi: cream tile
// facade, dark-glass bays, a black sign band over a shopfront, a storey line,
// a cornice and parapet, and rooftop plant boxes.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833616.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833616.nbt";

const W = 18, H = 23, D = 19;
const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x * 1000 + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Body datum: highest ground under the footprint, so the body is level.
let B = 0;
for (const [, , gr] of cells) B = Math.max(B, gr);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

// Pre-compute the door bay: median x of the south-facing facade cells.
const southXs = [];
for (const [x, z] of ground.keys() ? cells.map(([cx, cz]) => [cx, cz]) : []) {
  if (!has(x, z + 1)) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to the cell's ground, then plinth to the body datum B.
  for (let y = 0; y < B; y++) {
    put(x, y, z, y < gr ? "stone" : "stone_bricks");
  }

  const faces = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perimeter = faces.length > 0;

  // Floor slab at the datum (ground storey floor) for every cell.
  put(x, B, z, "light_gray_concrete");

  if (!perimeter) {
    // Interior: no walls, floor slabs per storey, roof deck. Air between.
    put(x, B + 5, z, "light_gray_concrete");
    put(x, B + 10, z, "light_gray_concrete");
    continue;
  }

  const [fdx, fdz, fname] = faces[0];
  const useZ = fdz !== 0; // exposed to north/south, so bays run along x
  const i = useZ ? x : z;
  const pillar = i % 3 === 0;
  const isDoor = fname === "south" && i === doorX;

  // rel = height above datum B
  const bay = (rel, glassId, warmRel, warmMod, warmRes) => {
    if (pillar) return "light_gray_concrete";
    if (rel === warmRel && i % warmMod === warmRes) return "glowstone";
    return glassId;
  };

  // Floor slab at the second storey and roof deck already handled as interior
  // only; perimeter cells get the full wall stack here.
  put(x, B + 0, z, "stone_bricks"); // base course

  for (let rel = 1; rel <= 3; rel++) {
    // Ground storey shopfront glass with pillars between bays.
    put(x, B + rel, z, bay(rel, "light_blue_stained_glass", 2, 6, 2));
  }
  put(x, B + 4, z, "black_concrete"); // sign band over shopfront
  put(x, B + 5, z, "smooth_quartz");  // storey line

  for (let rel = 6; rel <= 8; rel++) {
    // Upper storey windows.
    put(x, B + rel, z, bay(rel, "light_blue_stained_glass", 7, 6, 1));
  }
  put(x, B + 9, z, "smooth_quartz");  // spandrel / top band
  put(x, B + 10, z, "smooth_quartz"); // cornice
  put(x, B + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet cap

  // Pillars run up the facade in cream tile: override pillar colour so the
  // bays read as columns rather than wall.
  if (pillar) {
    for (let rel = 1; rel <= 9; rel++) {
      const id = (rel === 4 || rel === 5 || rel === 9) ? null : "light_gray_concrete";
      if (id) put(x, B + rel, z, id);
    }
  }

  // Main entrance on the south facade, centred on the door bay.
  if (isDoor) {
    put(x, B + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, B + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, B + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop plant: two plant boxes on interior cells above the roof deck (B+10).
const plantBoxes = [
  [3, 5, 3, 4],
  [12, 14, 12, 13],
];
for (const [x0, x1, z0, z1] of plantBoxes) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      const isPerim = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
      if (isPerim) continue;
      put(x, B + 11, z, "gray_concrete");
      put(x, B + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(OUT);
