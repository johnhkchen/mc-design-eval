import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883597";
const W = 17, H = 23, D = 18;

// Record: low-rise 1990s commercial block, two storeys, flat roof, tiled quartz
// facade, shopfront ground floor, roof about 11 blocks above lowest ground.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(...cells.map((c) => c[2])); // deck level (top of plinth)

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: [name, dx, dz]; inward is the opposite direction.
const faces = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const inwardOf = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Door: centre-most south-face cell.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
const cxSouth = southCells.length
  ? southCells.reduce((a, c) => a + c[0], 0) / southCells.length
  : W / 2;
let doorCell = null;
for (const [x, z] of southCells) {
  if (!doorCell || Math.abs(x - cxSouth) < Math.abs(doorCell[0] - cxSouth)) doorCell = [x, z];
}

// Roof plant positions (interior, away from the parapet).
const acUnits = [];
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
for (const [x, z] of [[minX + 3, minZ + 3], [maxX - 4, maxZ - 4]]) {
  if (has(x, z) && has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1)) {
    acUnits.push([x, z]);
  }
}

// 1. Foundation, plinth, deck, floor slabs and roof slab over the whole footprint.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= B; y++) {
    put(x, y, z, y <= gr ? "stone" : "stone_bricks");
  }
  put(x, B + 5, z, "light_gray_concrete"); // storey-1 floor slab / band
  put(x, B + 10, z, "light_gray_concrete"); // roof slab / cornice band
}

// 2. Facades: walls, window bays, shopfront, door, lanterns, parapet.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const face = faces.find(([, dx, dz]) => !has(x + dx, z + dz));
  if (!face) continue; // interior cell: no facade
  const [name] = face;
  const k = name === "north" || name === "south" ? x : z;
  const pier = ((k % 3) + 3) % 3 === 0;

  // Storey 1 (ground shopfront) rows B+1..B+4, storey 2 rows B+6..B+9.
  for (const [base, upper] of [[1, false], [6, true]]) {
    for (let local = 0; local <= 3; local++) {
      const y = B + base + local;
      let id;
      if (local === 3) {
        id = upper ? "light_gray_concrete" : "gray_concrete"; // lintel / fascia
      } else if (upper && local === 0) {
        id = "light_gray_concrete"; // sill
      } else if (pier) {
        id = "smooth_quartz";
      } else {
        id = "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }
  }

  // Parapet cap on the roof edge.
  put(x, B + 11, z, "gray_concrete");

  // Door on the centre-most south cell (ground storey, two blocks high).
  if (doorCell && x === doorCell[0] && z === doorCell[1] && name === "south") {
    put(x, B + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, "light_gray_concrete"); // door canopy / transom
  }

  // Warm lanterns standing on the floor just inside some window bays.
  if (!pier && ((k % 6) + 6) % 6 === 1) {
    const [ix, iz] = inwardOf[name];
    const lx = x + ix, lz = z + iz;
    if (has(lx, lz)) {
      put(lx, B + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
      put(lx, B + 6, lz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3. Roof plant: two AC / equipment blocks on the roof slab.
for (const [x, z] of acUnits) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(x + dx, B + 11, z + dz, "light_gray_concrete");
  }
  put(x, B + 12, z, "smooth_stone");
  put(x + 1, B + 12, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
