import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340538537";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 49, H = 19, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => G.has(`${x},${z}`);

// Roof sits 7 blocks above the lowest ground: a single storey of about 5 blocks
// with a cornice and a low parapet band.
const ROOF = minG + 7;

// Exterior face normals (dx, dz, name); east/west faces run along z, north/south along x.
const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];

// Entrance on the south (z max) street frontage, centred on x = 24.
const ENT_X0 = 21, ENT_X1 = 27;

const PILLAR_EVERY = 4;
const SHROOM_EVERY = 8;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Floor slab on which the storey stands.
  g.set(x, gr, z, "smooth_stone");

  // Roof slab, carried by every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  const ext = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (ext.length === 0) continue; // interior: air gap, no interior fit-out

  const [dx, dz] = ext[0];
  const t = dx !== 0 ? z : x; // coordinate running along the face
  const isFront = dz === 1 && x >= ENT_X0 && x <= ENT_X1;
  const pillar = t % PILLAR_EVERY === 0;

  for (let y = gr + 1; y <= ROOF - 1; y++) {
    if (y === ROOF - 1) {
      // Cornice course
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else if (isFront && y <= gr + 3) {
      // Recessed glass entrance
      g.set(x, y, z, "glass");
    } else if (y === gr + 1) {
      // Base course
      g.set(x, y, z, "stone_bricks");
    } else if (pillar) {
      // Quartz pilasters framing the bays
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (y <= gr + 3) {
      // Shopfront / window band
      g.set(x, y, z, "light_blue_stained_glass");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Warm light behind some of the window glass (inside the air gap).
  if (!pillar && !isFront && t % SHROOM_EVERY === 2 && gr + 2 <= ROOF - 2) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) g.set(ix, gr + 2, iz, "shroomlight");
  }

  // Warm lantern standing on the floor just inside the entrance.
  if (isFront && t === 24 && has(x, z - 1)) {
    g.set(x, gr + 1, z - 1, "lantern", { hanging: "false" });
  }
}

// Rooftop mechanical plant: three boxes sitting on the roof slab.
const plant = [[9, 8], [30, 13], [40, 9]];
for (const [px, pz] of plant) {
  let ok = true;
  for (let ax = 0; ax < 3; ax++) for (let az = 0; az < 2; az++) {
    if (!has(px + ax, pz + az)) ok = false;
  }
  if (!ok) continue;
  for (let ax = 0; ax < 3; ax++) for (let az = 0; az < 2; az++) {
    g.set(px + ax, ROOF + 1, pz + az, "iron_block");
    g.set(px + ax, ROOF + 2, pz + az, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
