import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333818117";
const W = 26, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const base = Math.max(0, ...cells.map((c) => c[2]));

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// outward face with priority N, S, W, E
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
};

// unit step pointing into the building from a given facade face
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// 1. Foundation: solid from y 0 up to the building base under every footprint cell
for (const [x, z] of cells) {
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
}

// 2. Full-footprint floor slabs at base, first-floor line, second-floor line, roof deck
for (const [x, z] of cells) {
  put(x, base, z, "smooth_stone");
  put(x, base + 5, z, "smooth_stone");
  put(x, base + 10, z, "smooth_stone");
}

// Entrance: middle of the south-facing edge
const southXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : Math.floor(W / 2);
let doorZ = -1;
for (const [x, z] of cells) if (x === doorX && z > doorZ) doorZ = z;

// 3. Facade on edge cells
for (const [x, z] of cells) {
  if (!edge(x, z)) continue;
  const face = faceOf(x, z);
  const i = face === "N" || face === "S" ? x : z; // position along the facade
  const isDoor = x === doorX && z === doorZ;
  const mullion = i % 3 === 0;

  // Base course
  put(x, base, z, "polished_granite");

  // Ground floor: shopfront glass with white tile piers
  for (let dy = 1; dy <= 3; dy++) {
    const y = base + dy;
    if (isDoor) {
      if (dy === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (dy === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "light_blue_stained_glass");
    } else if (mullion) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  // Ground-floor fascia
  put(x, base + 4, z, "smooth_stone");

  // Upper floor: window grid with white tile piers and a stone sill line
  for (let dy = 6; dy <= 8; dy++) {
    put(x, base + dy, z, mullion ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, base + 9, z, "white_concrete");

  // Cornice and parapet
  put(x, base + 10, z, "smooth_stone");
  put(x, base + 11, z, "quartz_block");
}

// 4. Warm light behind selected upper windows, two cells in so an air gap remains behind the glass
for (const [x, z] of cells) {
  if (!edge(x, z)) continue;
  const face = faceOf(x, z);
  const i = face === "N" || face === "S" ? x : z;
  if (i % 3 === 0) continue;
  if (i % 6 !== 1) continue;
  const [dx, dz] = inward[face];
  const ix = x + 2 * dx, iz = z + 2 * dz;
  if (!has(ix, iz) || edge(ix, iz)) continue;
  put(ix, base + 7, iz, "glowstone");
}

// 5. Roof plant: a neat row of mechanical units on interior roof cells
for (const [x, z] of cells) {
  if (edge(x, z)) continue;
  if (x % 4 === 2 && z === Math.floor(D / 2)) {
    put(x, base + 11, z, "iron_block");
  }
}

// 6. Lanterns under the entrance fascia, inside the footprint
for (const lx of [doorX, doorX - 3, doorX + 3]) {
  if (doorZ >= 0 && has(lx, doorZ - 1) && !edge(lx, doorZ - 1)) {
    put(lx, base + 3, doorZ - 1, "lantern", { hanging: "true" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
