import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280200";
const W = 21, H = 38, D = 16;

// Footprint and per-cell ground.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gr = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gd] of cells) gr.set(key(x, z), Math.round(gd));
const inFp = (x, z) => gr.has(key(x, z));
const groundAt = (x, z) => gr.get(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, st) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Outward faces: [name, dx, dz, along-axis]
const FACES = [
  ["north", 0, -1, "x"],
  ["south", 0, 1, "x"],
  ["west", -1, 0, "z"],
  ["east", 1, 0, "z"],
];
const perimeterFaces = (x, z) =>
  FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

// Entrance: north-facing perimeter cell nearest the middle of the facade.
let doorX = null, doorZ = null, best = Infinity;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (perimeterFaces(x, z).some(f => f[0] === "north")) {
    const d = Math.abs(x - 10);
    if (d < best) { best = d; doorX = x; doorZ = z; }
  }
}

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const FLOOR = "light_gray_concrete";
const FOUND = "stone_bricks";

// Facade block for a perimeter cell at storey k, row r (1..4 above slab).
function facadeBlock(x, z, k, r, faces) {
  if (k === 0 && r === 1) return { id: FOUND };
  if (r === 4) return { id: k === 0 ? "smooth_stone" : SPANDREL };

  // Entrance door occupies rows 1-2 of the ground storey.
  if (k === 0 && x === doorX && z === doorZ && faces.some(f => f[0] === "north")) {
    return {
      id: "dark_oak_door",
      st: {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }

  const along = faces[0][3] === "x" ? x : z;
  const pier = faces.length > 1 || along % 3 === 0;
  if (pier) return { id: PIER };

  // Warm light behind some upper-floor windows.
  if (k > 0 && r === 2 && (x * 3 + z * 5 + k) % 7 === 0) {
    const [, dx, dz] = faces[0];
    const ix = x - dx, iz = z - dz; // inward cell
    if (inFp(ix, iz) && perimeterFaces(ix, iz).length === 0) {
      put(ix, groundAt(x, z) + k * 5 + r, iz, "glowstone");
    }
  }
  return { id: GLASS };
}

for (const [x, z, gd] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) put(x, y, z, FOUND);

  const faces = perimeterFaces(x, z);
  const isEdge = faces.length > 0;

  // Five storeys, each a floor slab with four rows of walls above it.
  for (let k = 0; k < 5; k++) {
    const base = gd + 5 * k;
    put(x, base, z, k === 0 && isEdge ? "stone_bricks" : FLOOR);
    if (isEdge) {
      for (let r = 1; r <= 4; r++) {
        const b = facadeBlock(x, z, k, r, faces);
        put(x, base + r, z, b.id, b.st);
      }
    }
  }

  // Roof slab over the top storey.
  put(x, gd + 25, z, FLOOR);

  // Parapet and cornice on the edge.
  if (isEdge) {
    put(x, gd + 26, z, "smooth_quartz");
    put(x, gd + 27, z, PIER);
  }

  // Rooftop plant room.
  if (x >= 6 && x <= 14 && z >= 5 && z <= 10) {
    put(x, gd + 26, z, SPANDREL);
    put(x, gd + 27, z, SPANDREL);
    put(x, gd + 28, z, "stone_bricks");
  }
}

// Antenna on the plant centre.
if (inFp(10, 8)) {
  const gd = groundAt(10, 8);
  for (let y = gd + 29; y <= gd + 31; y++) {
    put(10, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
