import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001471.cells.json`, "utf8"));

const W = 7, H = 20, D = 5;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (b == null) return;
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Footprint records: [x, z, ground, roof]
const C = cells.map(([x, z, gr, rf]) => ({ x, z, gr: Math.round(gr), rf: Math.round(rf) }));
const key = (x, z) => `${x},${z}`;
const occ = new Set(C.map((c) => key(c.x, c.z)));
const has = (x, z) => occ.has(key(x, z));

// Storey datum is the lowest ground. The roof is one flat level about 8 above it,
// smoothed from lidar, and never lower than the highest ground plus a usable wall.
const L = Math.min(...C.map((c) => c.gr));
const maxG = Math.max(...C.map((c) => c.gr));
const rfSorted = C.map((c) => c.rf).sort((a, b) => a - b);
const medRoof = rfSorted[Math.floor(rfSorted.length / 2)];
const roofTarget = Math.min(L + 9, Math.max(L + 7, medRoof));
const roofY = Math.min(H - 1, Math.max(roofTarget, maxG + 6)); // top of parapet
const deckY = roofY - 2;                                        // roof deck surface

// Perimeter classification
const missing = (c) => [has(c.x - 1, c.z), has(c.x + 1, c.z), has(c.x, c.z - 1), has(c.x, c.z + 1)]
  .filter((b) => !b).length;
const isEdge = (c) => missing(c) > 0;
const isFace = (c) => missing(c) === 1;

// Front door: centre of the cells whose north neighbour is missing (street side at low z)
const frontCells = C.filter((c) => !has(c.x, c.z - 1)).sort((a, b) => a.x - b.x);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const isDoor = (c) => doorCell && c.x === doorCell.x && c.z === doorCell.z;

// Body: foundation to grade, stone base, stone storey bands, brick walls with
// glazed window bays, stone cornice and brick parapet, flat roof deck.
for (const c of C) {
  const { x, z, gr } = c;
  const edge = isEdge(c);
  const face = isFace(c);
  for (let y = 0; y <= roofY; y++) {
    let b = null;
    if (y < gr) {
      b = "stone_bricks";                              // foundation fill to grade
    } else if (y === gr) {
      b = "stone_bricks";                              // base course
    } else if (y === deckY) {
      b = "smooth_stone";                              // roof deck / floor slab
    } else if (y > deckY) {
      if (edge && y === deckY + 1) b = "stone_brick_slab"; // cornice
      else if (edge && y === deckY + 2) b = "bricks";      // parapet
    } else {
      const floorLine = ((y - L) % 2 === 0);
      if (floorLine) {
        b = edge ? "stone_bricks" : "smooth_stone";   // storey band / floor slab
      } else if (edge) {
        // Window bays on face walls; brick piers at corners and beside the door
        b = face && !isDoor(c) ? "glass" : "bricks";
      }
    }
    put(x, y, z, b);
  }
}

// Entrance: two-high oak door on the street face with a stone canopy
if (doorCell) {
  const dz = doorCell.z;
  const dy = doorCell.gr + 1;
  put(doorCell.x, dy, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorCell.x, dy + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (has(doorCell.x + dx, dz)) {
      put(doorCell.x + dx, dy + 2, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Warm light behind some window bays (interior air gap, resting on floor slabs)
for (const c of C) {
  if (!isFace(c) || isDoor(c)) continue;
  let inx = 0, inz = 0;
  if (!has(c.x, c.z - 1)) inz = 1;
  else if (!has(c.x, c.z + 1)) inz = -1;
  else if (!has(c.x - 1, c.z)) inx = 1;
  else if (!has(c.x + 1, c.z)) inx = -1;
  const ix = c.x + inx, iz = c.z + inz;
  if (!has(ix, iz)) continue;
  for (let y = c.gr + 1; y < deckY; y++) {
    if (((y - L) % 2 === 0)) continue; // window rows only
    if ((c.x * 3 + c.z * 5 + y) % 4 !== 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Roof equipment: one brick chimney stack on an interior roof cell
const interior = C.filter((c) => !isEdge(c)).sort((a, b) => b.x - a.x);
if (interior.length) {
  const ch = interior[0];
  for (let y = deckY + 1; y <= roofY + 1; y++) put(ch.x, y, ch.z, "bricks");
  put(ch.x, roofY + 2, ch.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001471.nbt`);
