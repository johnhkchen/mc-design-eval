import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121677";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 15 x 23 x 18: x 0..14, z 0..17. Roof lands near y=11 (lidar), two storeys of ~5 blocks.
const W = 15, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
let maxG = 0;
for (const v of ground.values()) maxG = Math.max(maxG, v);

// Storey lines (absolute y). Ground storey ~5 high, upper storey 5 high, parapet above.
const L1 = Math.max(5, maxG + 4); // first floor slab / storey line
const L2 = L1 + 5;                // roof deck level (cornice on perimeter)
const PAR = L2 + 1;               // parapet course

// Materials: cream tiled concrete facade, dark stone plinth, grey roof, clear glass.
const FACADE = "white_concrete";
const PLINTH = "stone_bricks";
const LINTEL = "stone_bricks";
const FLOOR = "smooth_stone";
const CORNICE = "smooth_quartz";
const ROOF = "light_gray_concrete";
const GLASS = "glass";

const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Which outward faces of a footprint cell are exposed
function facesOf(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
}

// Inward step for a face (toward the building interior)
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// Front door: middle of the northernmost (min z) run of plain north-facing cells
let minZ = Infinity;
for (const [x, z] of cells) if (facesOf(x, z).join() === "N") minZ = Math.min(minZ, z);
const frontRun = cells
  .filter(([x, z]) => z === minZ && facesOf(x, z).join() === "N")
  .sort((a, b) => a[0] - b[0]);
const doorCell = frontRun.length ? frontRun[Math.floor(frontRun.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// Pass 1: foundations, floors, slabs, roof deck, parapet, walls
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const perim = faces.length > 0;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, PLINTH);

  // Ground surface
  S(x, gr, z, perim ? PLINTH : FLOOR);

  // First-floor slab (storey line on perimeter, slab inside)
  if (L1 > gr) S(x, L1, z, perim ? LINTEL : FLOOR);

  // Roof deck / cornice
  if (L2 > gr) S(x, L2, z, perim ? CORNICE : ROOF);

  // Parapet on the perimeter
  if (perim) S(x, PAR, z, CORNICE);

  if (!perim) continue;

  // Perimeter walls between ground and roof
  for (let y = gr + 1; y < L2; y++) {
    if (y === L1) continue; // storey line already placed

    // Corners and multi-face cells: solid pillar
    if (faces.length > 1) {
      S(x, y, z, FACADE);
      continue;
    }

    const face = faces[0];
    const t = face === "N" || face === "S" ? x : z;
    const isPillar = t % 3 === 0;
    const ground = y < L1;

    // Door cell: two-high dark oak door, lintel above
    if (doorKey === `${x},${z}` && face === "N" && (y === gr + 1 || y === gr + 2)) {
      S(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (ground) {
      if (y === L1 - 1) {
        S(x, y, z, LINTEL); // shopfront lintel band
      } else if (isPillar) {
        S(x, y, z, FACADE);
      } else {
        S(x, y, z, GLASS);
      }
    } else {
      // Upper storey: spandrels above and below the window band
      if (y === L1 + 1 || y === L2 - 1) {
        S(x, y, z, FACADE);
      } else if (isPillar) {
        S(x, y, z, FACADE);
      } else {
        S(x, y, z, GLASS);
      }
    }
  }

  // Warm light behind selected upper windows: lantern on the floor inside
  if (faces.length === 1) {
    const face = faces[0];
    const t = face === "N" || face === "S" ? x : z;
    const [dx, dz] = INWARD[face];
    if (t % 6 === 2 && inside(x + dx, z + dz) && !facesOf(x + dx, z + dz).length) {
      S(x + dx, L1 + 1, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Ground-floor warm light just inside the entrance
if (doorCell) {
  const [dx, dz] = INWARD.N;
  const [x, z] = doorCell;
  if (inside(x + dx, z + dz)) {
    S(x + dx, gAt(x, z) + 1, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 2: roof equipment on interior roof cells (two or more cells in from the edge)
const deepInside = (x, z) =>
  [-2, -1, 0, 1, 2].every((i) =>
    [-2, -1, 0, 1, 2].every((j) => inside(x + i, z + j))
  );

for (const [x, z, gr] of cells) {
  if (!deepInside(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    // AC plant block on the roof deck
    S(x, PAR, z, "iron_block");
  } else if (x % 5 === 1 && z % 5 === 3 && gr === maxG) {
    // Low water tank (two high) on the roof deck
    S(x, PAR, z, ROOF);
    S(x, PAR + 1, z, ROOF);
  }
}

g.save(`${DIR}/${ID}.nbt`);
