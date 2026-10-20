import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993153";
const W = 12, H = 23, D = 18;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exterior faces: outward normal (dx, dz).
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Deterministic pseudo-random for lit windows.
const lit = (x, y, z) => ((x * 73 + y * 41 + z * 17) % 5) === 0;

// Per-cell exposed faces.
const exposedOf = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));

for (const [x, z, gr] of cells) {
  const ex = exposedOf(x, z);
  const ring = ex.length > 0;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof level: flat at y 10 for normal terrain; stays above steep ground.
  const roofY = Math.max(10, gr + 2);

  // Storey floors every 5 blocks from this cell's ground up to the roof.
  const bounds = [];
  for (let b = gr; b < roofY; b += 5) bounds.push(b);

  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i];
    const nb = i + 1 < bounds.length ? bounds[i + 1] : roofY;

    // Floor slab for the storey (also the storey line on the facade).
    put(x, b, z, "smooth_stone");

    if (!ring) continue;

    for (let y = b + 1; y <= nb - 1; y++) {
      const rel = y - b;
      const last = y === nb - 1;

      // Corners: solid concrete pillar.
      if (ex.length >= 2) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      const f = ex[0];
      const u = f.dx === 0 ? x : z;
      const pillar = u % 3 === 0;

      if (i === 0) {
        // Ground storey: granite base course, shopfront glass, header band.
        if (rel === 1) put(x, y, z, "polished_granite");
        else if (last) put(x, y, z, "white_concrete");
        else put(x, y, z, pillar ? "light_gray_concrete" : "glass");
      } else {
        // Upper storeys: spandrels top and bottom, window grid between.
        if (rel === 1 || last) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, pillar ? "light_gray_concrete" : "glass_pane");
          // Warm light just inside some window bays.
          if (!pillar && u % 3 === 2 && lit(x, y, z)) {
            const ix = x - f.dx, iz = z - f.dz;
            if (has(ix, iz)) put(ix, y, iz, "glowstone");
          }
        }
      }
    }
  }

  if (ring) {
    // Cornice, parapet and capping course around the roof edge.
    put(x, roofY, z, "light_gray_concrete");
    put(x, roofY + 1, z, "white_concrete");
    put(x, roofY + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior roof deck.
    put(x, roofY, z, "smooth_stone");
  }
}

// Entrance on the north face, centred, with a lintel above the door.
const doorX = 6, doorZ = 0;
if (has(doorX, doorZ)) {
  const gr = ground.get(`${doorX},${doorZ}`);
  const nb = gr + 5;
  if (nb - 1 >= gr + 2) {
    put(doorX, gr + 1, doorZ, "dark_oak_door",
      { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, gr + 2, doorZ, "dark_oak_door",
      { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (let x = doorX - 2; x <= doorX + 2; x++) {
    if (has(x, doorZ) && x !== doorX) put(x, gr + 3, doorZ, "light_gray_concrete");
  }
}

// Roof equipment: small AC plant boxes on the roof deck.
const plant = [[3, 4], [4, 5], [7, 11], [8, 12]];
for (const [x, z] of plant) {
  if (!has(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  const roofY = Math.max(10, gr + 2);
  put(x, roofY + 1, z, "smooth_stone");
  put(x, roofY + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
