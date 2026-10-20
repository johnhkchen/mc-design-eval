import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided from lidar (roof ~11 blocks above lowest ground)
// as a two-storey mid-century Taipei shophouse: stone plinth, white concrete
// walls, glazed shopfront with a red awning band, a stone parapet, and a
// rooftop unit. Two storeys of 5 blocks each, then the parapet course.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011427";
const W = 5, H = 23, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Only writes inside the volume; y is absolute within the volume (0 = lowest ground).
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Exposed faces of a cell: sides whose neighbour is not part of the footprint.
const sides = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const exposed = (x, z) => sides.filter(([, dx, dz]) => !inside(x + dx, z + dz));

// Door on the south (front) face, middle-most exposed south cell.
const southCells = cells
  .filter(([x, z]) => exposed(x, z).some(([n]) => n === "south"))
  .sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr] of cells) {
  const exp = exposed(x, z);
  const isExt = exp.length > 0;

  // Foundation: fill solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / floor slab at ground level, floor slabs and roof deck on every cell.
  put(x, gr, z, isExt ? "stone_bricks" : "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");   // first/second floor line
  put(x, gr + 10, z, "smooth_stone");  // roof deck and cornice course
}

// Facades, lights and door, after the slabs so exterior walls overwrite them.
for (const [x, z, gr] of cells) {
  const exp = exposed(x, z);
  if (!exp.length) continue;
  const [, dx, dz] = exp[0];
  const along = dz !== 0 ? x : z; // position along the face (0..4 on a 5-wide face)
  const isDoor = key(x, z) === doorKey;

  // Ground floor (rel 1..3): glazed shopfront with piers at the ends.
  for (let rel = 1; rel <= 3; rel++) {
    if (isDoor && rel <= 2) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, gr + rel, z, "oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
    } else if (isDoor && rel === 3) {
      put(x, gr + rel, z, "lantern", { hanging: "false" });
    } else if (along >= 1 && along <= 3) {
      put(x, gr + rel, z, "glass_pane");
    } else {
      put(x, gr + rel, z, "white_concrete");
    }
  }
  // Red awning / sign band above the shopfront.
  put(x, gr + 4, z, isDoor ? "red_concrete" : "red_concrete");

  // Upper storey (rel 6..8): window bays on odd positions, white walls between.
  for (let rel = 6; rel <= 8; rel++) {
    put(x, gr + rel, z, along % 2 === 1 ? "glass_pane" : "white_concrete");
  }
  // Storey line above the upper windows.
  put(x, gr + 9, z, "light_gray_concrete");

  // Warm light behind some glass, in the interior cell just inside the face.
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz)) {
    const igr = ground.get(key(ix, iz));
    if (along % 2 === 1 && (x + z) % 2 === 0) put(ix, igr + 7, iz, "glowstone");
    if (along === 2 && !isDoor) put(ix, igr + 2, iz, "shroomlight");
  }
}

// Parapet course on the exterior edge, sitting on the roof deck.
for (const [x, z, gr] of cells) {
  if (exposed(x, z).length) put(x, gr + 11, z, "stone_brick_wall");
}

// Roof equipment: one rooftop unit on an interior cell.
const roofCell = cells.find(([x, z]) => !exposed(x, z).length);
if (roofCell) put(roofCell[0], roofCell[2] + 11, roofCell[1], "iron_block");

vox.save(`${DIR}/${ID}.nbt`);
