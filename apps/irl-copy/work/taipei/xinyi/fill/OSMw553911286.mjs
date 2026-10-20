import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw553911286.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw553911286.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 28, H = 71, D = 115;
const ROOF = 59;           // roof deck level (about 59 blocks above lowest ground)
const STOREY = 5;          // blocks per storey

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

// outward normals of a footprint cell (directions with no neighbour)
function outward(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x + 1, z)) out.push("east");
  if (!has(x - 1, z)) out.push("west");
  return out;
}
const DELTA = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// ---- per-cell shell: foundation, floor slabs, facade, roof deck ----
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = ground.get(key(x, z));
  const top = Math.min(gr, ROOF - 1);

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // ground-floor slab and interior floor slabs, one per storey
  for (let yy = gr; yy <= ROOF - 1; yy += STOREY) put(x, yy, z, "smooth_stone");

  const edges = outward(x, z);
  if (edges.length) {
    const dir = edges[0];
    const along = dir === "north" || dir === "south" ? x : z;
    for (let y = gr; y <= ROOF - 1; y++) {
      const local = (y - gr) % STOREY;
      if (y === gr) {
        put(x, y, z, "polished_andesite");                 // base course / plinth
      } else if (local === 0) {
        put(x, y, z, "white_concrete");                    // floor band
      } else if (local === 4) {
        put(x, y, z, "light_gray_concrete");               // lintel / spandrel
      } else {
        // windows: glass with white mullions every 4 cells
        if (along % 4 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      }
    }

    // warm light just inside a few windows
    const storeyIdx = Math.floor((ROOF - 1 - gr) / STOREY);
    for (let y = gr + 1; y <= ROOF - 1; y++) {
      const local = (y - gr) % STOREY;
      if (local !== 2 || y === gr) continue;
      const k = Math.floor((y - gr) / STOREY);
      if (((along + k * 3 + storeyIdx) % 7) !== 0) continue;
      if (along % 4 === 0) continue;
      const [dx, dz] = DELTA[OPP[dir]];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && ground.get(key(ix, iz)) < y) {
        put(ix, y, iz, "glowstone");
      }
    }

    // parapet on top of the roof deck
    put(x, ROOF + 1, z, "white_concrete");
  }

  // roof deck at ROOF
  if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");
}

// ---- street entrance on the north end ----
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  if (z !== 0 || x !== 13) continue;
  const gr = ground.get(key(x, z));
  if (!outward(x, z).includes("north")) continue;
  put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "white_concrete");                   // canopy band over door
}

// ---- rooftop plant room, centred on the roof ----
const PX0 = 7, PX1 = 20, PZ0 = 40, PZ1 = 74;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      if (edge) put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF + 5, z, "light_gray_concrete");          // plant room roof
  }
}

// ---- mast on the plant room ----
const mx = 13, mz = 57;
for (let y = ROOF + 5; y <= ROOF + 8; y++) {
  put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
