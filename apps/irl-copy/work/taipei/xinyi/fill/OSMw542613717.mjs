import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542613717";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward face of a perimeter cell: first missing neighbour (front = south, z+1).
function face(x, z) {
  if (!has(x, z + 1)) return { dir: "south", nx: 0, nz: 1, axis: "x", idx: x };
  if (!has(x, z - 1)) return { dir: "north", nx: 0, nz: -1, axis: "x", idx: x };
  if (!has(x + 1, z)) return { dir: "east", nx: 1, nz: 0, axis: "z", idx: z };
  if (!has(x - 1, z)) return { dir: "west", nx: -1, nz: 0, axis: "z", idx: z };
  return null;
}

// Entrance: middle of the south (front) frontage.
const frontXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const pane = (axis) => (axis === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const b = gr + 1;
  const f = face(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab on every footprint cell.
  put(x, b, z, "polished_andesite");

  if (f) {
    const isEntrance = f.dir === "south" && x === entranceX;
    const isPier = f.idx % 3 === 0;

    if (isEntrance) {
      put(x, b + 1, z, "oak_door", { facing: f.dir, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing: f.dir, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (isPier) {
      for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "light_gray_concrete");
    } else {
      put(x, b + 1, z, "light_blue_stained_glass_pane", pane(f.axis));
      put(x, b + 2, z, "light_blue_stained_glass_pane", pane(f.axis));
      put(x, b + 3, z, "white_concrete");
    }

    // Storey line and upper floor edge.
    put(x, b + 4, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");

    // Upper storey windows.
    if (isPier) {
      for (let y = b + 6; y <= b + 8; y++) put(x, y, z, "light_gray_concrete");
    } else {
      put(x, b + 6, z, "light_blue_stained_glass_pane", pane(f.axis));
      put(x, b + 7, z, "light_blue_stained_glass_pane", pane(f.axis));
      put(x, b + 8, z, "white_concrete");

      // Warm light behind every third window, in the interior cell next to it.
      if (f.idx % 3 === 1) {
        const ix = x - f.nx, iz = z - f.nz;
        if (has(ix, iz) && ground.get(`${ix},${iz}`) === gr && face(ix, iz) === null) {
          put(ix, b + 7, iz, "glowstone");
        }
      }
    }

    // Cornice and parapet.
    put(x, b + 9, z, "smooth_stone");
    put(x, b + 10, z, "white_concrete");
  } else {
    // Interior: upper floor slab and roof slab, no walls.
    put(x, b + 5, z, "gray_concrete");
    put(x, b + 9, z, "gray_concrete");

    // Small rooftop plant block inside the parapet line.
    if (x >= 6 && x <= 8 && z >= 3 && z <= 4) put(x, b + 10, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
