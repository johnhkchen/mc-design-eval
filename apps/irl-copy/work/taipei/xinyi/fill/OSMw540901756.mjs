import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw540901756.cells.json`, "utf8"));

const W = 11, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces: direction vectors
const DIRS = {
  north: [0, -1, "north"],
  south: [0, 1, "south"],
  west: [-1, 0, "west"],
  east: [1, 0, "east"],
};

// Perimeter outward faces per cell
const outsOf = (x, z) => {
  const out = [];
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
};

// Entrance: north face if present, else first outward face found
const allCells = cells.map(([x, z, gy]) => ({ x, z, gy, outs: outsOf(x, z) }));
let entranceFace = "north";
if (!allCells.some((c) => c.outs.includes("north"))) {
  const firstOut = allCells.find((c) => c.outs.length)?.outs[0] ?? "south";
  entranceFace = firstOut;
}
const entranceCells = allCells.filter((c) => c.outs.includes(entranceFace));
const entranceU = entranceCells.length
  ? Math.floor(
      entranceCells.reduce((s, c) => s + (entranceFace === "north" || entranceFace === "south" ? c.x : c.z), 0) /
        entranceCells.length
    )
  : -1;

const uOf = (c, face) => (face === "north" || face === "south" ? c.x : c.z);

// Facade block for a perimeter cell at relative row r on face `face`
const facadeBlock = (c, face, r) => {
  const u = uOf(c, face);
  const pier = u % 3 === 0;
  const isEntrance = face === entranceFace && u === entranceU;
  switch (r) {
    case 0: return ["stone_bricks"];
    case 1:
    case 2:
      if (isEntrance) return r === 1
        ? ["dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }]
        : ["dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }];
      return pier ? ["white_concrete"] : ["glass"];
    case 3: return ["light_gray_concrete"];
    case 4: return ["white_concrete"];
    case 5: return ["smooth_stone"];
    case 6: return ["white_concrete"];
    case 7:
    case 8:
      return pier ? ["white_concrete"] : ["glass_pane"];
    case 9: return ["white_concrete"];
    case 10: return ["smooth_stone"];
    default: return ["white_concrete"];
  }
};

// Pass 1: foundations, core, perimeter walls, roof
for (const c of allCells) {
  const { x, z, gy, outs } = c;
  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  if (outs.length === 0) {
    // Interior core: solid so nothing floats
    for (let y = gy; y <= gy + 9; y++) put(x, y, z, "white_concrete");
    put(x, gy + 10, z, "light_gray_concrete");
  } else {
    // Perimeter walls, storey by storey
    const face = outs[0];
    for (let r = 0; r <= 10; r++) {
      let spec;
      if (r === 10) {
        spec = ["smooth_stone"]; // parapet
      } else {
        spec = facadeBlock(c, outs.includes(entranceFace) ? entranceFace : face, r);
      }
      put(x, gy + r, z, spec[0], spec[1]);
    }
  }
}

// Rooftop mechanical units on some interior cells (sit on roof surface)
for (const c of allCells) {
  if (c.outs.length === 0 && (c.x + c.z) % 5 === 0) {
    put(c.x, c.gy + 11, c.z, "light_gray_concrete");
  }
}

// Pass 2: air gap behind windows and warm lights in some windows
for (const c of allCells) {
  if (c.outs.length === 0) continue;
  const face = c.outs.includes(entranceFace) ? entranceFace : c.outs[0];
  const [dx, dz] = DIRS[face];
  const ix = c.x - dx, iz = c.z - dz;
  if (!has(ix, iz)) continue;
  const inner = allCells.find((k) => k.x === ix && k.z === iz);
  if (!inner || inner.outs.length) continue; // only carve truly interior cells
  const u = uOf(c, face);
  if (u % 3 === 0) continue;
  const rows = [1, 2, 7, 8];
  for (const r of rows) {
    const y = c.gy + r;
    if (c.outs.includes(face) && face === entranceFace && u === entranceU && (r === 1 || r === 2)) continue;
    put(ix, y, iz, "air");
  }
  // Warm glow behind some upper-storey windows
  if (u % 6 === 1) put(ix, c.gy + 7, iz, "glowstone");
  // Warm glow behind some shopfront windows
  if (u % 6 === 2) put(ix, c.gy + 2, iz, "glowstone");
}

g.save(`${DIR}/OSMw540901756.nbt`);
