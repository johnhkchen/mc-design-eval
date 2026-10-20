import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, c. 1980s Taipei: light concrete frame,
// white piers, grey spandrels, glazed bays, ground-floor shopfront with a red canopy,
// flat roof with cornice, parapet and rooftop plant. Roof sits at y 11 above the lowest ground.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414156";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map(c => c[2]));
const cellMap = new Map();
for (const [x, z, gr] of cells) {
  cellMap.set(`${x},${z}`, Math.min(gr - minG, 5)); // ground above y0, clamped so storeys stay in place
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Exterior faces per cell
const exteriorOf = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const lit = (x, y, z) => (x + y * 2 + z) % 7 === 0;

// Pass 1: structure, facade and roof for every footprint cell
for (const [key, gr] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorOf(x, z);
  const edge = ext.length > 0;
  const corner = ext.length >= 2;
  const face = ext[0];
  const along = face === "north" || face === "south" ? x : z;
  const pier = corner || (edge && along % 3 === 0);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground slab / base course
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey 1 (ground floor shopfront band), y gr+1 .. 5
  for (let y = gr + 1; y <= 5; y++) {
    if (!edge) continue; // interior air gap
    if (y === 5) {
      g.set(x, y, z, "light_gray_concrete"); // spandrel
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (lit(x, y, z)) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "glass");
    }
  }

  // Floor slab between storeys
  g.set(x, 6, z, edge ? "white_concrete" : "smooth_stone");

  // Storey 2, y 7 .. 10
  if (edge) {
    for (let y = 7; y <= 10; y++) {
      if (y === 10) {
        g.set(x, y, z, "light_gray_concrete"); // belt course under roof
      } else if (pier) {
        g.set(x, y, z, "white_concrete");
      } else if (lit(x, y, z)) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "glass");
      }
    }
  }

  // Roof slab at y 11: cornice on edges, smooth roof inside
  g.set(x, 11, z, edge ? "white_concrete" : "smooth_stone");

  // Parapet and coping on the edge
  if (edge) {
    g.set(x, 12, z, "white_concrete");
    g.set(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: rooftop plant housings on interior cells
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (exteriorOf(x, z).length > 0) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "light_gray_concrete");
  }
}

// Pass 3: entrance on the north face, near the centre, with a red canopy
const entryCandidates = [];
for (const [key, gr] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorOf(x, z);
  if (ext.includes("north")) {
    entryCandidates.push({ x, z, gr, corner: ext.length >= 2, face: "north" });
  }
}
if (entryCandidates.length === 0) {
  for (const [key, gr] of cellMap) {
    const [x, z] = key.split(",").map(Number);
    const ext = exteriorOf(x, z);
    if (ext.length) entryCandidates.push({ x, z, gr, corner: ext.length >= 2, face: ext[0] });
  }
}
entryCandidates.sort((a, b) =>
  (a.corner - b.corner) || (Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2))
);

if (entryCandidates.length) {
  const e = entryCandidates[0];
  const doorY = e.gr + 1;
  // Door: lower and upper halves, facing outward
  g.set(e.x, doorY, e.z, "oak_door", {
    facing: e.face, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(e.x, doorY + 1, e.z, "oak_door", {
    facing: e.face, half: "upper", hinge: "left", open: "false", powered: "false",
  });

  // Canopy over the entrance, if it fits in the storefront band
  const canopyY = e.gr + 3;
  if (canopyY <= 4) {
    for (const dx of [-1, 0, 1]) {
      const cx = e.x + (e.face === "north" || e.face === "south" ? dx : 0);
      const cz = e.z + (e.face === "east" || e.face === "west" ? dx : 0);
      if (has(cx, cz)) g.set(cx, canopyY, cz, "red_concrete");
    }
  }
}

g.save(`${BASE}/${ID}.nbt`);
