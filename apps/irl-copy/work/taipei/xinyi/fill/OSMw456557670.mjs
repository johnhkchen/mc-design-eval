import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557670";
const W = 104, H = 33, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Lowest ground is the datum; roof sits ~21 blocks above it (4 storeys of 5 + roof slab).
const b = Math.min(...ground.values());
const STOREY = 5, STOREYS = 4;
const ROOF = b + STOREYS * STOREY; // roof slab layer; roof top surface ~21 above datum

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const pane = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Returns [id, props?] for a facade block of a given storey row r (0..4) and storey s (0..3).
function facadeBlock({ x, z, s, r, alongX, northFace }) {
  const idx = alongX ? x : z;
  const pierEvery = alongX ? 3 : 3;
  const isPier = idx % pierEvery === 0;

  if (s === 0) {
    if (r === 0) return ["polished_granite"];
    if (r === 4) return ["polished_andesite"];
    // Entrance bay on the street (north) face.
    if (northFace && alongX && idx % 24 === 12) {
      if (r === 1) return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (r === 2) return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (r === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    if (idx % 4 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass_pane", pane(alongX)];
  }

  if (r === 0) return ["white_concrete"];          // floor band
  if (r === 4) {
    if (s === STOREYS - 1) return ["smooth_quartz"]; // top cornice
    return ["light_gray_concrete"];                  // spandrel
  }
  if (isPier) return ["white_concrete"];
  return ["light_blue_stained_glass_pane", pane(alongX)];
}

for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const zEdge = !has(x, z - 1) || !has(x, z + 1);   // street / rear facade (runs along x)
  const xEdge = !has(x - 1, z) || !has(x + 1, z);   // end wall (runs along z)
  const alongX = zEdge;
  const isFacade = zEdge || xEdge;
  const northFace = !has(x, z - 1);

  // Walls and floors.
  for (let y = gy; y < ROOF; y++) {
    const rel = y - b;
    const s = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (isFacade) {
      const [id, p] = facadeBlock({ x, z, s, r, alongX, northFace });
      put(x, y, z, id, p);
    } else {
      // Interior: floor slabs only, air behind the glass.
      if (y === gy || r === 0) put(x, y, z, "smooth_stone");
    }

    // Warm lights set back behind the glazing (inside the air gap).
    if (isFacade && alongX && s > 0 && r === 2 && z === 0 && has(x, 1) && x % 9 === 4) {
      put(x, y, 1, "glowstone");
    }
    if (isFacade && alongX && s === 0 && r === 2 && z === 0 && has(x, 1) && x % 12 === 6) {
      put(x, y, 1, "shroomlight");
    }
    if (isFacade && alongX && s === 0 && r === 2 && z === D - 1 && has(x, D - 2) && x % 12 === 6) {
      put(x, y, D - 2, "shroomlight");
    }
  }

  // Roof: parapet cap on the edge, roof slab everywhere.
  if (gy <= ROOF) {
    if (isFacade) put(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    else put(x, ROOF, z, "light_gray_concrete");
  }
}

// Roof plant: modest mechanical boxes on the interior of the roof.
for (const [x, z] of cells) {
  if (has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z)) {
    const roofInner = z >= 4 && z <= 7 && x % 10 >= 2 && x % 10 <= 6 && x >= 16 && x <= 88;
    if (roofInner && ROOF + 2 < H) {
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
