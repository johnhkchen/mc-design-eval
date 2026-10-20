import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245228";

const W = 34, H = 57, D = 17;
const STOREY = 5;
const STOREYS = 9;            // 9 x 5 = 45 blocks to the roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inS = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const g = new Voxels([W, H, D]);

// Only writes inside the footprint and above that cell's foundation.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inS(x, z)) return;
  if (y < gnd(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outer faces a footprint cell sits on.
const faces = (x, z) => {
  const f = [];
  if (!inS(x, z - 1)) f.push("N");
  if (!inS(x, z + 1)) f.push("S");
  if (!inS(x - 1, z)) f.push("W");
  if (!inS(x + 1, z)) f.push("E");
  return f;
};

// Step from a facade cell into the building interior.
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// Entrance on the south (long, street-facing) face.
let doorX = 17;
if (!inS(doorX, D - 1)) {
  let best = null;
  for (const [x, z] of cells) {
    if (z === D - 1 && (best === null || Math.abs(x - 17) < Math.abs(best - 17))) best = x;
  }
  if (best !== null) doorX = best;
}

// Floor plates, facade, storey lines, shopfront, lights.
for (let k = 0; k < STOREYS; k++) {
  const b = k * STOREY;

  // Floor slab at each storey level across the whole footprint.
  for (const [x, z] of cells) put(x, b, z, "light_gray_concrete");

  // Facade rings: glass panes between white concrete mullions, storey lines.
  for (const [x, z] of cells) {
    const f = faces(x, z);
    if (f.length === 0) continue;

    // Spandrel / storey line at the top of each storey.
    put(x, b + 4, z, "white_concrete");

    const corner = f.length >= 2;
    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;
      if (corner) {
        put(x, y, z, "white_concrete");
        continue;
      }
      const face = f[0];
      const idx = face === "N" || face === "S" ? x : z;
      const max = face === "N" || face === "S" ? W - 1 : D - 1;
      if (idx === 0 || idx === max || idx % 3 === 0) {
        put(x, y, z, "white_concrete");
        continue;
      }
      // Entrance door on the south face, ground storey.
      if (k === 0 && face === "S" && x === doorX && (dy === 1 || dy === 2)) {
        const half = dy === 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (k === 0) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    // Warm light just behind some windows, at mid-storey height.
    const f0 = f[0];
    if (!corner && k >= 1) {
      const idx = f0 === "N" || f0 === "S" ? x : z;
      if (idx % 3 !== 0 && (idx + k) % 4 === 1) {
        const [dx, dz] = inward[f0];
        const ix = x + dx, iz = z + dz;
        if (inS(ix, iz) && faces(ix, iz).length === 0 && b + 2 >= gnd(ix, iz)) {
          g.set(ix, b + 2, iz, "shroomlight");
        }
      }
    }
  }
}

// Base course on the lowest storey, plinth at the bottom of the perimeter.
for (const [x, z] of cells) {
  if (faces(x, z).length > 0) put(x, 0, z, "polished_granite");
}

// Roof: cornice over the perimeter, parapet above it.
for (const [x, z] of cells) {
  put(x, 45, z, faces(x, z).length > 0 ? "white_concrete" : "light_gray_concrete");
  if (faces(x, z).length > 0) put(x, 46, z, "white_concrete");
}

// Roof plant enclosure, set back from the edges.
const PX0 = 7, PX1 = 26, PZ0 = 5, PZ1 = 11;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (edge) {
      for (let y = 46; y <= 48; y++) put(x, y, z, "light_gray_concrete");
      put(x, 49, z, "smooth_stone");
    } else {
      put(x, 49, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
