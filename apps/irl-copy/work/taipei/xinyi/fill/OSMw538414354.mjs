import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block: two storeys over a glazed shopfront, white
// cladding with quartz mullions, stone cornice and parapet, flat roof with
// plant boxes. Front (street) faces north (z = 0).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414354";
const W = 32, H = 23, D = 19;
const ROOF = 11;            // roof level above the lowest ground (y 0)

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Which outward faces a footprint cell has (missing neighbour = exterior).
function exteriorFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

const pane = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = gAt(x, z);
  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces.includes("N") ? "N" : faces.includes("S") ? "S" : faces[0];
  const axisX = face === "N" || face === "S";
  const u = axisX ? x : z;
  const pillar = corner || u % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slabs at ground and storey 2, roof slab on top, air between.
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Exterior shell.
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite");                  // base course
    } else if (y === ROOF) {
      put(x, y, z, "smooth_stone");                       // parapet cap
    } else if (y === ROOF - 1) {
      put(x, y, z, "smooth_stone");                       // cornice
    } else if (y <= 4) {
      // Ground floor: shopfront glazing with mullions; entrance on north face.
      const isDoorCol = face === "N" && u === 16;
      if (isDoorCol && (y === gr + 1 || y === gr + 2) && gr + 2 <= 4) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (pillar && !isDoorCol) {
        put(x, y, z, "quartz_block");
      } else {
        put(x, y, z, "glass");
      }
    } else if (y === 5 || y === 6 || y === 9) {
      // Storey line and spandrels.
      put(x, y, z, y === 5 ? "smooth_stone" : "white_concrete");
    } else {
      // Storey 2 window band (y 7 and 8).
      if (pillar) put(x, y, z, "quartz_block");
      else put(x, y, z, "glass_pane", pane(axisX ? "x" : "z"));
    }
  }

  // Warm light behind a few upper-floor windows (interior cell just inside).
  if (!corner && !pillar && (y => true)(0)) {
    const inX = face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1]
      : face === "W" ? [x + 1, z] : [x - 1, z];
    const [ix, iz] = inX;
    if (has(ix, iz) && exteriorFaces(ix, iz).length === 0 && u % 6 === 1) {
      put(ix, 7, iz, "shroomlight");
    }
  }
}

// Roof plant: a couple of mechanical boxes on the roof slab.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (x < 5 || x > 8 || z < 5 || z > 7) continue;
  if (exteriorFaces(x, z).length) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
