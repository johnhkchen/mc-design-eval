import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690454";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 18;
const ROOF = 11;        // roof/parapet top, about 11 blocks above lowest ground
const UPPER = 5;        // storey line between ground floor and upper floor
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup: key "x,z" -> ground height (clamped so storeys still fit)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(UPPER - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

// front (street) row = lowest z among footprint cells
const minZ = Math.min(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const perim = out.n || out.s || out.w || out.e;
  const corner = (out.n || out.s) && (out.w || out.e);
  const alongX = out.n || out.s;
  const idx = alongX ? x : z;   // position along the facade
  const front = out.n;          // street face

  if (!perim) {
    // interior: floor slab at storey line and flat roof deck, air elsewhere
    put(x, UPPER, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // ground floor storey: plinth, shopfronts, sign band
  put(x, gr, z, "stone_bricks");
  for (let y = gr + 1; y < UPPER; y++) {
    let id = "quartz_block";
    if (!corner && (y === gr + 1 || y === gr + 2)) {
      id = idx % 2 === 0 ? "light_blue_stained_glass" : "black_concrete"; // shop glass, mullions
    }
    if (front && y === gr + 3) id = "red_concrete";                      // sign band
    if (y === gr + 3 && !front) id = "quartz_block";
    put(x, y, z, id);
  }
  if (gr + 3 >= UPPER) put(x, UPPER - 1, z, "red_concrete");

  // storey line
  put(x, UPPER, z, "chiseled_quartz_block");

  // upper storey: window grid with frames and a few warm lights
  for (let y = UPPER + 1; y <= ROOF - 3; y++) {
    let id = "quartz_block";
    if (!corner) {
      if (idx % 2 === 1 && y >= UPPER + 1 && y <= ROOF - 3) {
        id = (y === 7 && idx % 4 === 1) ? "glowstone" : "glass";
      }
      if (idx % 2 === 0 && y === UPPER + 2) id = "black_concrete"; // spandrel frame
    }
    put(x, y, z, id);
  }

  // cornice band, parapet
  put(x, ROOF - 2, z, "chiseled_quartz_block");
  put(x, ROOF - 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  put(x, ROOF, z, "smooth_quartz");
}

// entrance on the street face: double-height door under a canopy
for (const x of [entranceX]) {
  const gr = ground.get(`${x},${minZ}`);
  if (gr === undefined) continue;
  put(x, gr + 1, minZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, minZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, minZ, "red_concrete");
  // polished frame either side of the door
  for (const dx of [-1, 1]) {
    if (has(x + dx, minZ)) put(x + dx, gr + 1, minZ, "smooth_stone");
  }
}

// rooftop water tank on a 2x2 footprint, standing on the roof deck
const tankCells = [[3, 6], [4, 6], [3, 7], [4, 7]];
if (tankCells.every(([x, z]) => has(x, z))) {
  for (const [x, z] of tankCells) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "spruce_planks");
    put(x, ROOF + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
