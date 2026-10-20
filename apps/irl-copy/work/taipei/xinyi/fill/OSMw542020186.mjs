import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020186";
const W = 23, H = 23, D = 7;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const lowest = Math.min(...ground.values());

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const inFp = (x, z) => ground.has(`${x},${z}`);
const neighbours = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
const isEdge = (x, z) => neighbours(x, z).some(([a, b]) => !inFp(a, b));
const interiorNeighbour = (x, z) => {
  for (const [a, b] of neighbours(x, z)) if (inFp(a, b) && !isEdge(a, b)) return [a, b];
  return null;
};

// Read as a 1960s-80s Taipei mid-rise shophouse: white-tiled concrete frame,
// ground-floor shopfront with pilasters, two storeys of punched windows,
// smooth-stone storey lines and a cornice cap, with a small rooftop plant box.
for (const [x, z, gr] of cells) {
  const b = Math.round(gr) - lowest;      // storey base (floor slab) for this cell
  const edge = isEdge(x, z);
  const front = edge && z === 0;

  // Foundation: solid from y 0 up to the slab
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab
  put(x, b, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey lines and interior slabs at b+5 and b+10
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_stone");

  if (edge) {
    // Ground floor (shopfront): y b+1..b+4
    for (let y = b + 1; y <= b + 4; y++) {
      if (y === b + 4) {
        // transom / fascia band, awning ledge on the front
        put(x, y, z, front ? "dark_oak_slab" : "white_concrete",
          front ? { type: "top", waterlogged: "false" } : undefined);
        continue;
      }
      if (x % 4 === 0) {
        put(x, y, z, "polished_andesite");          // pilaster
      } else if (front && x === 3 && y <= b + 2) {
        // entrance door (lower and upper halves)
        put(x, y, z, "oak_door", {
          facing: "north", half: y === b + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else {
        put(x, y, z, "glass_pane", {
          east: "false", west: "false", north: "false", south: "false", waterlogged: "false",
        });
      }
    }

    // Upper floor: y b+6..b+9 with punched window grid
    for (let y = b + 6; y <= b + 9; y++) {
      if (x % 3 === 1) {
        put(x, y, z, "glass_pane", {
          east: "false", west: "false", north: "false", south: "false", waterlogged: "false",
        });
      } else if (x % 3 === 0) {
        put(x, y, z, "light_gray_concrete");       // frame / pier
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Parapet line and cornice cap
    put(x, b + 11, z, "smooth_stone");
  } else {
    // Interior cell: air gap, cap roof
    put(x, b + 11, z, "light_gray_concrete");
  }
}

// Warm light behind some upper-floor windows (glowstone in the interior cell)
for (const [x, z] of cells.map(([cx, cz, gr]) => [cx, cz, gr])) {
  const b = Math.round(ground.get(`${x},${z}`)) - lowest;
  if (!isEdge(x, z) || x % 3 !== 1) continue;
  if ((x * 7 + z) % 2 !== 0) continue;
  const inner = interiorNeighbour(x, z);
  if (!inner) continue;
  const [ix, iz] = inner;
  put(ix, b + 7, iz, "glowstone");
}

// Rooftop plant box and lightning rod, on interior cells near the middle
for (const [x, z, gr] of cells) {
  const b = Math.round(gr) - lowest;
  if (isEdge(x, z)) continue;
  if (x >= 9 && x <= 13 && z === 3) put(x, b + 12, z, "gray_concrete");
  if (x === 11 && z === 3) put(x, b + 13, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
