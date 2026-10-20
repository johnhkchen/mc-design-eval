import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457985";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
const at = (x, z) => ground.get(`${x},${z}`);

// Record: roof about 11 blocks above lowest ground, storeys about 5 blocks.
// Two storeys: floor slabs at y=5 and y=10, flat roof/cornice at y=11.
const FLOORS = [5, 10];
const ROOF = 11;

// Outward face normal for an edge cell, or null for interior cells.
function outward(x, z) {
  if (at(x, z - 1) === undefined) return [0, -1];
  if (at(x, z + 1) === undefined) return [0, 1];
  if (at(x - 1, z) === undefined) return [-1, 0];
  if (at(x + 1, z) === undefined) return [1, 0];
  return null;
}

const cellList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr, n: outward(x, z) };
});

// 1. Foundation: solid from y0 up to each cell's ground.
for (const c of cellList) {
  for (let y = 0; y <= c.gr; y++) g.set(c.x, y, c.z, "stone");
}

// 2. Floor slabs at storey lines, above each cell's ground.
for (const c of cellList) {
  for (const fy of FLOORS) {
    if (fy > c.gr) g.set(c.x, fy, c.z, "smooth_quartz");
  }
}

// 3. Facades: base course, shopfront, piers, spandrels, lights.
for (const c of cellList) {
  if (!c.n) continue;
  const [dx, dz] = c.n;
  // Index along the face, and whether this is a pier (every 3rd, or a corner).
  const idx = dz !== 0 ? c.x : c.z;
  const alongA = dz !== 0 ? at(c.x - 1, c.z) : at(c.x, c.z - 1);
  const alongB = dz !== 0 ? at(c.x + 1, c.z) : at(c.x, c.z + 1);
  const pier = idx % 3 === 0 || alongA === undefined || alongB === undefined;

  for (let y = c.gr + 1; y <= 10; y++) {
    if (FLOORS.includes(y)) continue;
    let id;
    if (y === c.gr + 1 && y <= 4) {
      id = "polished_andesite"; // base course
    } else if (y <= 4) {
      id = y === 4 ? "white_concrete" : (pier ? "white_concrete" : "glass_pane"); // ground shopfront, lintel at 4
    } else if (y >= 6 && y <= 8) {
      id = pier ? "white_concrete" : "glass_pane"; // upper storey window grid
    } else if (y === 9) {
      id = "white_concrete"; // spandrel under cornice slab
    } else {
      id = "white_concrete";
    }
    g.set(c.x, y, c.z, id);
  }

  // Warm lights set just inside the glass.
  const ix = c.x - dx, iz = c.z - dz;
  if (at(ix, iz) !== undefined && !pier) {
    if (idx % 6 === 1) {
      g.set(ix, 7, iz, "shroomlight");
    } else if (idx % 6 === 2 && c.gr + 2 <= 3) {
      g.set(ix, 2, iz, "glowstone");
    }
  }
}

// 4. Roof: parapet/cornice on edges, roof deck inside, all at y=11.
for (const c of cellList) {
  if (c.gr >= ROOF) continue;
  g.set(c.x, ROOF, c.z, c.n
    ? "quartz_slab"
    : "light_gray_concrete", c.n ? { type: "bottom", waterlogged: "false" } : undefined);
}

// 5. Rooftop plant room in the middle of the deck.
for (const c of cellList) {
  if (c.n) continue;
  if (c.x >= 7 && c.x <= 15 && c.z >= 5 && c.z <= 11 && c.gr < ROOF) {
    g.set(c.x, ROOF + 1, c.z, "light_gray_concrete");
    g.set(c.x, ROOF + 2, c.z, "smooth_stone");
  }
}

// 6. Entrance: door on the south face, nearest the middle of that face.
const southCells = cellList.filter(c => c.n && c.n[1] === 1);
if (southCells.length) {
  const xs = southCells.map(c => c.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const door = southCells.reduce((best, c) =>
    Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best);
  const dy = door.gr + 1;
  if (dy + 1 <= 10) {
    // Door's own lintel line above the opening.
    g.set(door.x, dy, door.z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(door.x, dy + 1, door.z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(door.x, dy + 2, door.z, "white_concrete");
    // Flanking lanterns on the shopfront piers beside the door.
    for (const off of [-1, 1]) {
      const lx = door.x + off;
      if (at(lx, door.z) !== undefined) g.set(lx, dy + 1, door.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
