import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099774";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 25;
const ROOF = 11;   // roof deck, about 11 blocks above lowest ground
const CAP = 12;    // parapet / rooftop plant level
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const hash = (x, z) => (x * 31 + z * 17 + x * z) % 97;

// Perimeter = any footprint cell with a missing 4-neighbour
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const slabBottom = { type: "bottom", waterlogged: "false" };
const pane = (x, y, z, alongX, alongZ) => {
  // connect along the face so the glazing reads as a continuous grid
  const props = {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
  put(x, y, z, "light_blue_stained_glass_pane", props);
};

// Rooftop plant enclosure: one deliberate block set on the roof deck, centred on the footprint
const PLANT = { x0: 9, x1: 15, z0: 9, z1: 15 };
const inPlant = (x, z) => x >= PLANT.x0 && x <= PLANT.x1 && z >= PLANT.z0 && z <= PLANT.z1;
const plantEdge = (x, z) => x === PLANT.x0 || x === PLANT.x1 || z === PLANT.z0 || z === PLANT.z1;

for (const [xr, zr, grRaw] of cells) {
  const x = xr, z = zr;
  const gr = Math.round(grRaw);
  const perim = isPerim(x, z);
  const alongX = !has(x, z - 1) || !has(x, z + 1); // wall runs east-west
  const alongZ = !has(x - 1, z) || !has(x + 1, z); // wall runs north-south
  const corner = alongX && alongZ;
  const mull = corner || (alongX && x % 4 === 0) || (alongZ && z % 4 === 0);
  const h = hash(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // South-face entrance on the middle bay
  const entrance = perim && alongX && !corner && x === 12 && !has(x, z + 1);
  const doorFacing = "south";

  for (let y = gr + 1; y <= CAP; y++) {
    // Roof deck and parapet
    if (y === ROOF) {
      put(x, y, z, perim ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (y === CAP) {
      if (perim) put(x, y, z, "smooth_stone_slab", slabBottom);
      else if (inPlant(x, z)) {
        // plant enclosure walls rise from the deck; interior stays open to the sky
        if (plantEdge(x, z)) put(x, y, z, "light_gray_concrete");
      }
      continue;
    }
    // Storey floor slab (second-floor level)
    if (y === 5) {
      put(x, y, z, perim ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    // Spandrel band below the roof
    if (y === 10) {
      if (perim) put(x, y, z, "white_concrete");
      continue;
    }
    // Frame heads over the ground floor and upper storey
    if (y === 4 || y === 9) {
      if (perim) put(x, y, z, "smooth_quartz");
      continue;
    }
    // Glazed window rows: ground storey (gr+1..3) and upper storey (6..8)
    const isWin = (y >= 6 && y <= 8) || (y <= 3);
    if (!isWin) continue;
    if (!perim) continue; // interior air behind glass

    if (entrance && (y === gr + 1 || y === gr + 2) && y <= 4) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (mull) {
      put(x, y, z, "smooth_quartz");
    } else {
      pane(x, y, z, alongX, alongZ);
    }
  }

  // Plant enclosure: walls to y=13, solid roof slab at y=14, interior floor on the deck
  if (!perim && inPlant(x, z)) {
    if (plantEdge(x, z)) {
      put(x, CAP + 1, z, "light_gray_concrete");
      put(x, CAP + 2, z, "smooth_stone");
    } else {
      put(x, CAP, z, "gray_concrete");
    }
    put(x, CAP + 2, z, "smooth_stone_slab", slabBottom);
  }

  // Warm lights behind some perimeter windows
  if (perim) {
    const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
      .find(([nx, nz]) => has(nx, nz) && !isPerim(nx, nz));
    if (inward) {
      const [ix, iz] = inward;
      const igr = ground.get(`${ix},${iz}`);
      const isMullion = corner || (alongX && x % 4 === 0) || (alongZ && z % 4 === 0);
      const isDoor = entrance;
      if (!isMullion && !isDoor) {
        if (h % 5 === 0 && igr <= 5) put(ix, 6, iz, "glowstone");
        else if (h % 7 === 3 && igr <= 1) put(ix, 2, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
