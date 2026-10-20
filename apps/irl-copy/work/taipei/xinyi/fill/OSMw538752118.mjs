import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538752118: 20 x 18 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey mid-century commercial block: stone-based shopfront,
// white-concrete upper storey with a glazed window grid, a stone cornice, a
// parapet, and a small rooftop plant room with a lightning rod.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752118";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const DECK_Y = 10;     // roof deck (top of the upper storey)
const PARAPET_Y = 11;  // parapet course sits on the deck edge

const G = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

const C = cells.map(([x, z, gr]) => ({ x, z, gr }));

// Bounding box centre for the rooftop plant room
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const { x, z } of C) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Outward facing of a footprint cell: the first side with no neighbour in the footprint
const FACES = [
  { f: "n", dx: 0, dz: -1 },
  { f: "s", dx: 0, dz: 1 },
  { f: "w", dx: -1, dz: 0 },
  { f: "e", dx: 1, dz: 0 },
];
function facade(x, z) {
  for (const face of FACES) {
    if (!has(x + face.dx, z + face.dz)) return face;
  }
  return null;
}

// Main entrance: middle of the first available street-facing wall (north preferred)
const edgeByFace = { n: [], s: [], w: [], e: [] };
for (const { x, z } of C) {
  const f = facade(x, z);
  if (f) edgeByFace[f.f].push({ x, z });
}
let entranceKey = null;
for (const f of ["n", "s", "e", "w"]) {
  const list = edgeByFace[f];
  if (list.length) {
    const along = f === "n" || f === "s" ? "x" : "z";
    list.sort((p, q) => p[along] - q[along]);
    const mid = list[Math.floor(list.length / 2)];
    entranceKey = key(mid.x, mid.z);
    break;
  }
}

for (const { x, z, gr } of C) {
  const edge = facade(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, edge ? "stone_bricks" : "stone");

  // Floor slab at this cell's ground, upper floor slab, roof deck
  g.set(x, gr, z, "smooth_stone");
  if (gr < 5) g.set(x, 5, z, "smooth_stone");
  if (gr <= DECK_Y) g.set(x, DECK_Y, z, edge ? "stone_bricks" : "smooth_stone");

  if (!edge) {
    // Interior: rooftop plant room and lightning rod on the roof
    if (gr <= DECK_Y && Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
      g.set(x, 11, z, "light_gray_concrete");
      g.set(x, 12, z, "light_gray_concrete");
    }
    if (x === cx && z === cz && gr <= DECK_Y) g.set(x, 13, z, "lightning_rod");
    continue;
  }

  // Facade wall
  const along = edge.f === "n" || edge.f === "s" ? x : z;
  const win = along % 3 !== 0;               // every third column is a pier
  const isEntrance = key(x, z) === entranceKey && edge.f === "n";
  const inX = x - edge.dx, inZ = z - edge.dz; // interior neighbour
  const inwardInside = has(inX, inZ);

  for (let y = gr + 1; y <= 9; y++) {
    let b;
    if (isEntrance && y === gr + 1) b = "smooth_stone";                 // threshold
    else if (isEntrance && (y === gr + 2 || y === gr + 3)) b = "air";  // doorway
    else if (isEntrance && y === gr + 4) b = "gray_concrete";          // lintel
    else if (y <= 4) {                                                  // shopfront storey
      if (y === gr + 1) b = "stone_bricks";                             // base course
      else if (y === 4) b = "gray_concrete";                            // transom
      else b = win ? "light_blue_stained_glass" : "gray_concrete";
    }
    else if (y === 5) b = "stone_bricks";                               // storey line
    else if (y === 6 || y === 9) b = "white_concrete";                  // sill and lintel
    else b = win ? "light_blue_stained_glass_pane" : "white_concrete";  // upper windows

    if (b === "air") continue;
    g.set(x, y, z, b);

    // Warm light behind some upper windows
    if (y === 7 && win && !isEntrance && inwardInside && G.get(key(inX, inZ)) < 7 && along % 6 === 1) {
      g.set(inX, 7, inZ, "glowstone");
    }
  }

  if (isEntrance && inwardInside && G.get(key(inX, inZ)) <= gr) {
    g.set(inX, gr + 1, inZ, "lantern");
  }

  if (gr + 1 <= 9 || gr <= DECK_Y) {
    g.set(x, PARAPET_Y, z, "stone_brick_wall");
  }
}

g.save(`${DIR}/${ID}.nbt`);
