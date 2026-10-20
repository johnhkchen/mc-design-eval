import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw1335095045.cells.json`, "utf8"));

const W = 13, H = 19, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Floor plate level: highest ground under the footprint, so every cell sits on fill.
const FL = Math.max(...cells.map((c) => c[2]));
const WALL_BOT = FL + 1;   // first wall course above the base
const CEIL = FL + 5;       // ceiling / roof deck over the storey
const PARA = FL + 6;       // parapet top (roof ~7 blocks above lowest ground)

// Perimeter test: any side without a neighbour in the footprint.
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Pick the exposed face: north (z=0 side) preferred, then south, east, west.
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  return null;
};

const inward = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// 1. Foundation and base course: solid from y0 up to the floor plate under every cell.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < FL; y++) {
    put(x, y, z, y < ground ? "cobblestone" : "stone_bricks");
  }
  // Base course / floor slab at FL.
  put(x, FL, z, "polished_granite");
}

// 2. Storey shell, ceiling deck and parapet.
for (const [x, z] of cells) {
  const edge = isEdge(x, z);
  const face = faceOf(x, z);
  const cornerCell = !has(x, z - 1) && !has(x - 1, z) || !has(x, z - 1) && !has(x + 1, z) ||
                     !has(x, z + 1) && !has(x - 1, z) || !has(x, z + 1) && !has(x + 1, z);
  const idx = face === "north" || face === "south" ? x : z;

  // Ceiling deck over the storey (interior and edge).
  put(x, CEIL, z, edge ? "smooth_quartz" : "gray_concrete");

  if (!edge) {
    // Roof equipment on the deck: a few condenser units.
    if ((x * 3 + z) % 7 === 0) put(x, PARA, z, "iron_block");
    continue;
  }

  // Parapet ring.
  put(x, PARA, z, "smooth_quartz");

  // Exterior walls: concrete shell with glazing bands.
  for (let y = WALL_BOT; y <= FL + 4; y++) {
    let id = "white_concrete";
    const isCorner = cornerCell;
    const mullion = isCorner || idx % 3 === 0;
    if (mullion) {
      id = "smooth_quartz";
    } else if (y <= FL + 2) {
      id = "glass";                 // shopfront glazing
    } else {
      id = "cyan_stained_glass";    // upper glazing band
    }
    put(x, y, z, id);
  }
}

// 3. Street entrance on the north face: double-height door under a lantern.
const doorX = 6;
if (has(doorX, 0) && faceOf(doorX, 0) === "north") {
  put(doorX, WALL_BOT, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, WALL_BOT + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern inside, just behind the door, lighting the entrance.
  if (has(doorX, 1)) put(doorX, WALL_BOT, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. Warm lights behind some upper windows.
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const face = faceOf(x, z);
  if (!face) continue;
  const idx = face === "north" || face === "south" ? x : z;
  if (idx % 3 === 0) continue;               // mullion column
  if (idx % 4 !== 2) continue;               // every fourth bay
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isEdge(ix, iz)) {
    put(ix, FL + 3, iz, "glowstone");
  }
}

g.save(`${dir}/OSMw1335095045.nbt`);
