import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 18 x 21 footprint, roof ~26 blocks above lowest ground.
// Read as a 1980s-90s Taipei mid-rise commercial block: five storeys, white
// tiled concrete frame with window bays, a stone base, a ground-floor shopfront
// with a recessed door, a plain parapet and a rooftop plant box.
const W = 18, H = 38, D = 21;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011412.cells.json", "utf8"));

const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G.has(key(x, z));
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// Podium level = highest ground under the footprint, so every storey stands on solid.
const Y0 = Math.max(...G.values());
// Five storeys of about 5 blocks, aiming for a roof near y 26.
const sh = Math.min(5, Math.max(3, Math.round((26 - Y0) / 5)));
const STOREYS = 5;
const topY = Y0 + STOREYS * sh;
if (topY + 3 >= H) throw new Error("building does not fit the 38-block volume");

// Outward face of an edge cell: u = position along the face, (dx,dz) = inward step.
function faceOf(x, z) {
  if (!inF(x, z - 1)) return { u: x, dx: 0, dz: 1, n: "north" };
  if (!inF(x, z + 1)) return { u: x, dx: 0, dz: -1, n: "south" };
  if (!inF(x - 1, z)) return { u: z, dx: 1, dz: 0, n: "west" };
  return { u: z, dx: -1, dz: 0, n: "east" };
}

// Recessed entrance: the north-facing edge cell nearest the centre line.
let door = null;
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!inF(x, z - 1)) {
    if (!door || Math.abs(x - W / 2) < Math.abs(door.x - W / 2)) door = { x, z };
  }
}

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation and podium: solid from y 0 up to the storey floor.
  for (let y = 0; y < Y0; y++) g.set(x, y, z, "stone_bricks");

  // Roof deck sits on top of the frame on every footprint cell.
  g.set(x, topY, z, "light_gray_concrete");

  if (!edge) {
    // Interior: floor slabs per storey, and columns on a 4-block grid for support.
    for (let s = 0; s < STOREYS; s++) g.set(x, Y0 + s * sh, z, "light_gray_concrete");
    if (x % 4 === 0 && z % 4 === 0) {
      for (let y = Y0; y < topY; y++) g.set(x, y, z, "white_concrete");
    }
    continue;
  }

  // Edge cell: the facade.
  const f = faceOf(x, z);
  const isDoorCell = door && door.x === x && door.z === z;

  for (let y = Y0; y < topY; y++) {
    const s = Math.floor((y - Y0) / sh);
    const r = (y - Y0) % sh;
    const pillar = f.u % 3 === 0;

    if (s === 0) {
      if (isDoorCell && (r === 1 || r === 2)) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, "spruce_door", { facing: f.n, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 0) g.set(x, y, z, "smooth_stone");
      else if (r === sh - 1) g.set(x, y, z, "white_concrete");
      else if (pillar) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass");
    } else {
      if (r === 0 || r === sh - 1) {
        g.set(x, y, z, "light_gray_concrete"); // floor band and lintel
      } else if (pillar) {
        g.set(x, y, z, "white_concrete");      // tiled mullion
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
        // Warm light behind some windows, in the room air beyond the glass.
        if (((f.u + s + x + z) % 4 === 0) && inF(x + f.dx, z + f.dz)) {
          g.set(x + f.dx, y, z + f.dz, "glowstone");
        }
      }
    }
  }

  // Parapet: two-block wall and a bottom-half slab cap.
  g.set(x, topY + 1, z, "white_concrete");
  g.set(x, topY + 2, z, "white_concrete");
  g.set(x, topY + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant box near the centre, with a lightning rod.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let dx = -2; dx <= 2; dx++) {
  for (let dz = -2; dz <= 2; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!inF(x, z)) continue;
    g.set(x, topY + 1, z, "light_gray_concrete");
    if (Math.abs(dx) === 2 || Math.abs(dz) === 2) g.set(x, topY + 2, z, "iron_block");
  }
}
if (inF(cx, cz)) {
  g.set(cx, topY + 2, cz, "light_gray_concrete");
  g.set(cx, topY + 3, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011412.nbt");
