import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block: two storeys, flat roof with cornice and parapet,
// ground-floor shopfronts with a central entrance, upper-floor window grid, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343857";
const W = 32, H = 23, D = 16;
const ROOF = 11;          // roof slab row (about 11 blocks above lowest ground)
const MAX_GROUND = 7;     // keep the storeys and roof above the foundation

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(MAX_GROUND, gy)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const NORMALS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward facing side of a footprint cell (null for interior cells).
function outward(x, z) {
  for (const [name, [dx, dz]] of Object.entries(NORMALS)) {
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}

// Along-face coordinate: x for north/south faces, z for east/west faces.
const alongOf = (out, x, z) => (out === "north" || out === "south" ? x : z);

// Pick the largest facade as the front and centre the entrance on it.
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const o = outward(x, z);
  if (o) faceCount[o]++;
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const frontAlong = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z) === front) frontAlong.push(alongOf(front, x, z));
}
frontAlong.sort((a, b) => a - b);
const doorU = frontAlong[Math.floor(frontAlong.length / 2)];

const paneProps = (out) =>
  out === "north" || out === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, H, D]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const f2 = Math.min(gr + 5, 9);       // storey line between the two floors

  // Foundation under the footprint, up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Roof slab across every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  if (!out) {
    // Interior: floor slabs only, air elsewhere (no interiors modelled).
    g.set(x, gr, z, "smooth_stone");
    g.set(x, f2, z, "smooth_stone");

    // Rooftop plant boxes on a regular grid.
    if (x % 6 === 3 && z % 6 === 3) g.set(x, ROOF + 1, z, "iron_block");

    // Warm light behind the upper-floor glass (interior side of windows).
    continue;
  }

  const [nx, nz] = NORMALS[out];
  const along = alongOf(out, x, z);
  const isFrontEntrance = out === front && along === doorU;

  // Base course at the cell's ground level.
  g.set(x, gr, z, "polished_andesite");

  // Ground storey shopfronts: deepslate piers and full glass between.
  for (let y = gr + 1; y <= f2 - 2; y++) {
    if (isFrontEntrance && y <= gr + 2) {
      const facing = out;
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isFrontEntrance && y === gr + 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (along % 4 === 0) g.set(x, y, z, "deepslate_tiles");
    else g.set(x, y, z, "glass");
  }
  // Lintel over the shopfronts and storey line band.
  if (f2 - 1 > gr) g.set(x, f2 - 1, z, "smooth_stone");
  g.set(x, f2, z, "smooth_stone");

  // Upper storey: white concrete piers, sills and heads, glass pane grid between.
  for (let y = f2 + 1; y <= 9; y++) {
    if (y === f2 + 1 || y === 9) {
      g.set(x, y, z, "white_concrete");
    } else if (along % 4 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(out));
    }
  }

  // Cornice, roof edge and parapet.
  g.set(x, 10, z, "quartz_block");
  g.set(x, ROOF, z, "smooth_quartz_slab");
  g.set(x, ROOF + 1, z, "white_concrete");

  // Warm light: glowstone on the interior side of some windows.
  const ix = x - nx, iz = z - nz;
  if (has(ix, iz) && outward(ix, iz) === null) {
    if (along % 8 === 2 && f2 + 3 <= 8 && along % 4 !== 0) {
      g.set(ix, f2 + 3, iz, "glowstone");
    }
    if (along % 8 === 6 && gr + 2 < f2 - 1 && along % 4 !== 0) {
      g.set(ix, gr + 2, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
