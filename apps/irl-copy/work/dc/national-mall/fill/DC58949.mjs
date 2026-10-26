import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC58949";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 11 x 19. Late-20th-century Washington office block:
// pale precast cladding, light glazing, stone base and cornice.
const W = 11, D = 19, H = 31;

const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, { gr: Math.max(0, Math.round(c[2])), ro: c[3] });

// Smooth lidar noise: one building-wide roof level, per-cell deviation kept only if real (>= 4 blocks).
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

// Common storey grid: floor lines sit on the same absolute heights on every cell,
// so the facade does not step where the ground changes.
const baseG = Math.min(...[...cellMap.values()].map((c) => c.gr));

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isFloorLine = (y) => (y - baseG) % 2 === 0;

// Pass 1: massing, foundations, storeys, facades
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cellMap.get(`${x},${z}`);
    if (!c) continue;

    const ground = c.gr;
    const roof = Math.abs(c.ro - medRoof) >= 4 ? c.ro : medRoof;

    // Top on the common storey grid, at least two storeys above this cell's ground
    let top = Math.round(roof);
    if (isFloorLine(top) === false) top += 1;
    top = Math.min(top, H - 3);
    if (top < ground + 2) top = ground + 2;

    // Foundation: solid from y0 up to this cell's ground
    for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

    const perim = isPerim(x, z);

    // Inward neighbour, for lights behind the glass
    let ix = x, iz = z;
    if (z === 0) iz = 1;
    else if (z === D - 1) iz = D - 2;
    else if (x === 0) ix = 1;
    else if (x === W - 1) ix = W - 2;

    for (let y = ground; y < top; y++) {
      const floorLine = isFloorLine(y);

      if (!perim) {
        // Interior: floor slabs on the common grid, air between them
        if (floorLine && y < top - 1) put(x, y, z, "light_gray_concrete");
        if (y === top - 1) put(x, y, z, "light_gray_concrete"); // roof deck
        continue;
      }

      // Perimeter facade
      if (y === top - 1) {
        put(x, y, z, "polished_andesite"); // cornice cap
      } else if (y === ground) {
        put(x, y, z, "stone_bricks"); // base course at grade
      } else if (floorLine) {
        put(x, y, z, "smooth_sandstone"); // spandrel / floor line
      } else {
        // Window row: pillars on even bays, glass on odd bays
        const along = (x === 0 || x === W - 1) ? z : x;
        if (along % 2 === 0) {
          put(x, y, z, "smooth_sandstone");
        } else {
          const alongX = (z === 0 || z === D - 1);
          const props = alongX
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          put(x, y, z, "light_blue_stained_glass_pane", props);

          // Warm light: a shroomlight on the interior floor slab, directly behind a sparse set of panes
          if ((x + z + y) % 7 === 0 && (ix !== x || iz !== z)) {
            const supported = isFloorLine(y - 1) && y - 1 < top - 1 && y - 1 >= ground;
            if (supported) put(ix, y, iz, "shroomlight");
          }
        }
      }
    }

    // Parapet on the perimeter, standing on the cornice
    if (perim && top < H) put(x, top, z, "stone_brick_wall");

    // Mechanical penthouse on the central bay of the tallest tier, standing on the roof deck
    if (!perim && x >= 4 && x <= 6 && z >= 7 && z <= 11 && top >= medRoof - 1) {
      put(x, top, z, "smooth_sandstone");
      put(x, top + 1, z, "smooth_sandstone");
    }
  }
}

// Pass 2: ground-floor lobby on the street (z = 0) face
for (let x = 3; x <= 7; x++) {
  const c = cellMap.get(`${x},0`);
  if (!c) continue;
  put(x, c.gr, 0, "light_blue_stained_glass");
}
const door = cellMap.get("5,0");
if (door) {
  put(5, door.gr, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(5, door.gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
