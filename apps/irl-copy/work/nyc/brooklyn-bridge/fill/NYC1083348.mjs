import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083348.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083348.nbt";

const W = 15, H = 65, D = 18;
const g = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(CELLS, "utf8"));

// Cell records: [x, z, ground, roof]
const cellMap = new Map();
for (const [x, z, gr, roof] of raw) {
  const ground = Math.max(0, Math.round(gr));
  let R = 2 * Math.round(roof / 2);
  R = Math.min(60, Math.max(R, ground + 4));
  cellMap.set(`${x},${z}`, { x, z, ground, R });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street-facing (min z) entrance on the cell nearest the middle of that edge
let minZ = Infinity;
for (const c of cellMap.values()) minZ = Math.min(minZ, c.z);
let doorCell = null;
for (const c of cellMap.values()) {
  if (c.z !== minZ) continue;
  if (!doorCell || Math.abs(c.x - W / 2) < Math.abs(doorCell.x - W / 2)) doorCell = c;
}
const isDoor = (x, z) => doorCell && x === doorCell.x && z === doorCell.z;
// cells flanking the door along the street edge (for the lintel)
const isDoorFlank = (x, z) =>
  doorCell && z === minZ && Math.abs(x - doorCell.x) === 1;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Position along the facade (z on x-facing walls, x on z-facing walls)
const along = (x, z) => {
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  return xFace ? z : x;
};

for (const c of cellMap.values()) {
  const { x, z, ground: gr, R } = c;
  const per = isPerimeter(x, z);
  const a = along(x, z);

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab
  put(x, gr, z, per ? "polished_granite" : "light_gray_concrete");

  // Shopfront row at gr+1
  if (per) {
    if (isDoor(x, z)) {
      put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    } else if (isDoorFlank(x, z)) {
      put(x, gr + 1, z, "polished_granite");
    } else if (a % 3 === 0) {
      put(x, gr + 1, z, "polished_granite");
    } else {
      put(x, gr + 1, z, "light_blue_stained_glass");
    }
  }

  // Granite lintel over the entrance (door cell and flanks, first storey line)
  if (per && (isDoor(x, z) || isDoorFlank(x, z))) {
    put(x, gr + 2, z, "polished_granite");
  }

  // Upper storeys: floor/spandrel rows and window rows, 2 blocks per storey
  for (let y = gr + 2; y <= R - 2; y++) {
    if (per && (isDoor(x, z) || isDoorFlank(x, z)) && y === gr + 2) continue; // lintel already placed
    const rel = (y - (gr + 2)) % 2;
    if (rel === 0) {
      put(x, y, z, "light_gray_concrete");
    } else if (per) {
      if (a % 3 === 0) {
        put(x, y, z, "bricks");
      } else if (((Math.floor(a / 3) + Math.floor(y / 2)) % 4 === 0) && (a % 3 === 1)) {
        put(x, y, z, "glowstone"); // sparse lit windows in clusters
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Roof slab
  put(x, R - 1, z, "light_gray_concrete");

  // Parapet with a stone cornice on the perimeter
  if (per) {
    put(x, R, z, "bricks");
    put(x, R + 1, z, "stone_bricks");
  }
}

// Mechanical bulkhead on the roof, set back from the perimeter
for (const c of cellMap.values()) {
  const { x, z, R } = c;
  if (x < 4 || x > 10 || z < 5 || z > 12) continue;
  const edge = x === 4 || x === 10 || z === 5 || z === 12;
  if (R + 3 >= H) continue;
  if (edge) {
    for (let y = R; y <= R + 2; y++) put(x, y, z, "light_gray_concrete");
  }
  put(x, R + 3, z, "light_gray_concrete");
}

g.save(OUT);
