import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a 1-storey Taipei commercial block of the 1990s:
// tiled quartz-white cladding, tinted glass grid on a stone plinth, a parapet
// roof with plant boxes. Roof sits about 7 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339540104";
const W = 14, H = 19, D = 65;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground level (clamped so the roof and plant fit in H)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), H - 10));
}

const has = (x, z) => ground.has(`${x},${z}`);
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (state) g.set(x, y, z, block, state);
  else g.set(x, y, z, block);
};
const missing = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
};
const inwardOf = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] };
const GLASS = { north: "true", south: "true", east: "true", west: "true" };

// Entrance: on the west face, the candidate nearest the median z of west-facing cells
const westCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => missing(x, z).length === 1 && missing(x, z)[0] === "west");
let entrance = null;
if (westCells.length) {
  const zs = westCells.map(([, z]) => z).sort((a, b) => a - b);
  const med = zs[Math.floor(zs.length / 2)];
  entrance = westCells.reduce((best, c) =>
    Math.abs(c[1] - med) < Math.abs(best[1] - med) ? c : best);
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = missing(x, z);
  const isShell = faces.length > 0;

  // foundation and base course: solid from y0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks"); // base course / floor at street level

  if (!isShell) {
    // interior: floor slab and ceiling slab only, air between (no interiors)
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 6, z, "light_gray_concrete");
  } else {
    // shell walls, g+1 .. g+6
    const corner = faces.length >= 2;
    const face = faces[0];
    const idx = face === "west" || face === "east" ? z : x;
    const pier = corner || idx % 3 === 0;
    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

    // ground storey: glass grid with gray piers, shopfront
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (pier) put(x, y, z, "gray_concrete");
      else put(x, y, z, "cyan_stained_glass_pane", GLASS);
    }
    // lintel band and storey line
    put(x, gr + 4, z, "gray_concrete");
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 6, z, "smooth_quartz"); // parapet cap

    if (isEntrance && !corner) {
      put(x, gr + 1, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "smooth_quartz");
    }

    // warm light behind some glass: shroomlight in the interior cell just inside
    if (!pier && !isEntrance && idx % 6 === 1) {
      const [dx, dz] = inwardOf[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && missing(ix, iz).length === 0) {
        put(ix, gr + 2, iz, "shroomlight");
      }
    }
  }

  // entrance lantern hanging inside the door bay
  if (entrance && entrance[0] === x && entrance[1] === z) {
    const ix = x + 1;
    if (has(ix, z) && missing(ix, z).length === 0) {
      put(ix, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // flat roof over every footprint cell, at ground + 7
  put(x, gr + 7, z, "smooth_stone");
}

// roof plant: a few boxes on interior roof cells
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (missing(x, z).length === 0 && x % 4 === 1 && z % 8 === 3) {
    put(x, gr + 8, z, "light_gray_concrete");
    put(x, gr + 9, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
