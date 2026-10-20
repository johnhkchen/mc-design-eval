import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608974";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 17 x 18 footprint, roof ~11 blocks above lowest ground (c. 1980s-90s
// Xinyi-style commercial block: two storeys over a shopfront ground floor,
// white-tiled frame, tinted glazing, belt course, cornice and parapet).
const W = 17, H = 23, D = 18;
const ROOF = 11;     // roof level (absolute y) for a standard cell
const BELT = 5;      // storey line between ground floor and upper floor

const v = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward faces of a footprint cell (neighbour missing from the footprint)
function outFaces(x, z) {
  return ["north", "south", "east", "west"].filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
}

// Pick the entrance: a south-facing boundary cell nearest the middle of the
// footprint if any exists, otherwise any boundary cell nearest the middle.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let entrance = null;
{
  let best = Infinity, bestSouth = Infinity;
  let southPick = null, anyPick = null;
  for (const [x, z] of cells) {
    const faces = outFaces(x, z);
    if (!faces.length) continue;
    const d = Math.abs(x - cx);
    if (faces.includes("south") && d < bestSouth) { bestSouth = d; southPick = { x, z, face: "south" }; }
    if (d < best) { best = d; anyPick = { x, z, face: faces[0] }; }
  }
  entrance = southPick ?? anyPick;
}

for (const [x, z, gr] of cells) {
  const T = Math.max(ROOF, gr + 1);          // roof level for this cell
  const faces = outFaces(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // ---- Interior cell: floor slabs and roof deck only, air between ----
    v.set(x, gr, z, "smooth_stone");
    if (gr < BELT) v.set(x, BELT, z, "smooth_stone");
    v.set(x, T, z, "smooth_stone");
    // Rooftop plant: small light-grey housings on a sparse grid
    if ((x * 3 + z * 5) % 7 === 0 && T + 1 < H) {
      v.set(x, T + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // ---- Boundary cell: facade ----
  const face = faces[0];
  const [dx, dz] = DIRS[face];
  const idx = (face === "north" || face === "south") ? x : z;

  for (let y = gr; y <= T - 1; y++) {
    if (y >= H) break;
    let b;
    if (y === gr) {
      b = "stone_bricks";                       // base course
    } else if (y === T - 1) {
      b = "smooth_stone";                       // cornice band
    } else if (y === BELT && gr < BELT) {
      b = "smooth_stone";                       // storey belt course
    } else if (y < BELT && gr < BELT) {
      // Ground-floor shopfront: glazed bays between white piers
      b = (idx % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
    } else {
      // Upper floor: window bays on a white-tiled grid
      b = (idx % 3 === 1) ? "light_blue_stained_glass" : "white_concrete";
    }
    v.set(x, y, z, b);
  }

  // Parapet capping the wall
  if (T < H) v.set(x, T, z, "stone_brick_wall");

  // Warm light behind some upper-floor windows
  if (idx % 6 === 1 && gr <= 7 && 7 < T - 1) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && outFaces(ix, iz).length === 0) {
      v.set(ix, 7, iz, "glowstone");
    }
  }

  // Entrance: oak door with a lit lantern-height transom above
  if (entrance && entrance.x === x && entrance.z === z) {
    v.set(x, gr + 1, z, "oak_door", {
      facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    v.set(x, gr + 2, z, "oak_door", {
      facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Recessed entrance is marked by a lit lantern just inside the door
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && outFaces(ix, iz).length === 0 && gr + 3 < H) {
      v.set(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
