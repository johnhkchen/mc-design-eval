import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752106";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior face of an edge cell: N (z=0 street front), S, W, E. Null if interior.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

// Two-storey shophouse / low-rise commercial block, cream tile walls,
// red fascia band, shopfront at street face, roof parapet and rooftop plant.
for (const [x, z, gr] of cells) {
  const R = Math.max(11, gr + 7); // roof surface y (about 11 above lowest ground)
  const edge = faceOf(x, z) !== null;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs per storey, air between, roof deck
    put(x, gr + 5, z, "smooth_quartz");
    put(x, R, z, "smooth_quartz");
    continue;
  }

  const f = faceOf(x, z);
  let i, inner;
  if (f === "N") { i = x; inner = [x, z + 1]; }
  else if (f === "S") { i = x; inner = [x, z - 1]; }
  else if (f === "W") { i = z; inner = [x + 1, z]; }
  else { i = z; inner = [x - 1, z]; } // E

  // Exterior wall column for this cell
  for (let y = gr + 1; y <= R; y++) {
    if (y === R) {
      // Parapet coping
      put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (y === gr + 1) { put(x, y, z, "polished_andesite"); continue; } // base course
    if (y === gr + 4) { put(x, y, z, "red_terracotta"); continue; }    // fascia band
    if (y === gr + 5) { put(x, y, z, "polished_andesite"); continue; } // storey line

    const groundStorey = y >= gr + 2 && y <= gr + 3;
    const upperStorey = y >= gr + 7 && y <= R - 2;

    // Street-front shopfront with central entrance
    if (f === "N" && groundStorey) {
      if (i === 3) {
        if (y === gr + 2) {
          put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }
      if (i >= 1 && i <= 5) {
        put(x, y, z, "glass");
        // warm glow inside the shop
        if (i === 2 || i === 4) {
          const [ix, iz] = inner;
          if (has(ix, iz) && y === gr + 2) put(ix, y, iz, "glowstone");
        }
        continue;
      }
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // Side and back facades: ground and upper window bays
    if ((groundStorey || upperStorey) && i % 3 === 1) {
      put(x, y, z, "glass");
      // some rooms lit warm behind the glass
      const [ix, iz] = inner;
      if (upperStorey && (i + y) % 3 === 0 && has(ix, iz)) {
        put(ix, y, iz, "shroomlight");
      }
      continue;
    }

    put(x, y, z, "smooth_quartz");
  }
}

// Rooftop plant: a small water tank / mechanical box on the interior roof
for (const [x, z, gr] of cells) {
  const R = Math.max(11, gr + 7);
  const edge = faceOf(x, z) !== null;
  if (edge) continue;
  if (x >= 2 && x <= 3 && z >= 6 && z <= 7) {
    put(x, R + 1, z, "iron_block");
    if (x === 2 && z === 6) put(x, R + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
