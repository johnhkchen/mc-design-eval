import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456412";
const W = 21, H = 23, D = 22;

// Two-storey, flat-roofed concrete shophouse (late 20th century Taipei):
// stone foundation, white rendered walls, light-grey storey bands,
// shopfront with dark-oak fascia on the north (street) face, glass windows
// with concrete sills, parapet with cap, water tank and AC units on the roof.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const OUT = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// First exterior neighbour direction, or null for interior cells.
function outward(x, z) {
  for (const [f, [dx, dz]] of Object.entries(OUT)) {
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
}
const isWall = (x, z) => outward(x, z) !== null;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true" };
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false" };

const doorCands = [];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);

  if (out === null) {
    // Interior: floor slabs only (air above, no interiors).
    for (let y = gr; y <= 10; y++) {
      if (y === gr || y === 5) put(x, y, z, "smooth_stone");
      else if (y === 10) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior wall cell.
  const along = out === "north" || out === "south";
  const k = along ? x : z;
  const front = out === "north";
  const [ox, oz] = OUT[out];
  const ix = -ox, iz = -oz; // inward step
  const paneProps = along ? PANE_ALONG_X : PANE_ALONG_Z;

  for (let y = gr; y <= 10; y++) {
    const glassRow = y === 2 || y === 3 || y === 7 || y === 8;
    const sillRow = y === 1 || y === 6;
    let id = "white_concrete";
    let props = null;

    if (y === 10 || y === 4 || y === 5 || y === 9) {
      id = "light_gray_concrete"; // roof edge and storey lines
    } else if (y === gr) {
      id = "smooth_stone"; // base course
    } else if (front && y <= 3) {
      if (y === 3 || k % 3 === 0) id = "dark_oak_planks"; // fascia and mullions
      else id = "glass"; // shopfront glazing
    } else if (glassRow && k % 3 !== 0) {
      id = "light_blue_stained_glass_pane";
      props = paneProps;
    } else if (sillRow && k % 3 !== 0) {
      id = "light_gray_concrete";
    }

    put(x, y, z, id, props);

    // Warm light behind some windows, inside the air gap.
    if (y === 7 && !front && k % 6 === 1 && has(x + ix, z + iz) && !isWall(x + ix, z + iz)) {
      put(x + ix, 7, z + iz, "glowstone");
    }
    if (y === 2 && front && k % 6 === 1 && has(x + ix, z + iz) && !isWall(x + ix, z + iz)) {
      put(x + ix, 2, z + iz, "glowstone");
    }
  }

  // Parapet and cap.
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  if (front) doorCands.push({ x, z, k, gr });
}

// Entrance: middle front bay, on a ground level low enough for a two-high door.
if (doorCands.length) {
  const ks = doorCands.map((c) => c.k);
  const midK = Math.floor((Math.min(...ks) + Math.max(...ks)) / 2);
  const d = doorCands.reduce((best, c) => (Math.abs(c.k - midK) < Math.abs(best.k - midK) ? c : best));
  if (d.gr <= 1) {
    const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(d.x, d.gr + 1, d.z, "oak_door", { ...doorBase, half: "lower" });
    put(d.x, d.gr + 2, d.z, "oak_door", { ...doorBase, half: "upper" });
  }
}

// Roof plant on the deck at y = 11.
const cx = 10, cz = 11;
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!has(x, z) || isWall(x, z)) continue;
    const corner = dx !== 0 && dz !== 0;
    if (!corner) {
      for (let y = 11; y <= 13; y++) put(x, y, z, "light_gray_concrete");
    }
    put(x, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// AC condensers on the roof.
for (const [x, z] of [[4, 5], [5, 5], [15, 16], [16, 16]]) {
  if (has(x, z) && !isWall(x, z)) put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
