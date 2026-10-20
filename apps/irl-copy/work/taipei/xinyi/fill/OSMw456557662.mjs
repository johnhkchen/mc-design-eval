import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw456557662: 4 x 21 footprint, roof about 21 blocks above lowest ground.
// Read as a 1970s-80s Taipei mid-rise: four storeys of 5 blocks, cream tiled
// spandrels, white concrete frame, tinted glass, shopfront at grade with an
// entrance on the street face, flat roof with plant boxes and a short mast.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw456557662";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 4, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Ground per cell, clamped so the walls always have room above them.
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(19, Math.round(gr))));
}
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

// Perimeter: any cardinal neighbour missing from the footprint.
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward face of a perimeter cell.
function outward(x, z) {
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  if (!has(x, z + 1)) return "south";
  return "north";
}

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Pane connection props: runs along z on east/west faces, along x otherwise.
function paneProps(x, z) {
  const alongZ = !has(x - 1, z) || !has(x + 1, z);
  return alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

// Entrance: the street-face cell nearest the middle, at grade with a low storey.
let door = null;
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || gr > 2) continue;
  if (outward(x, z) !== "east") continue;
  if (!door || Math.abs(z - 10) < Math.abs(door.z - 10)) door = { x, z, gr };
}
// Fall back to any street-face cell if none on the east face.
if (!door) {
  for (const [x, z, gr] of cells) {
    if (!perim(x, z) || gr > 2) continue;
    if (!door || Math.abs(z - 10) < Math.abs(door.z - 10)) door = { x, z, gr };
  }
}
const doorKey = door ? `${door.x},${door.z}` : null;

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = ground(x, z);
  const per = perim(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Base course / ground floor slab at the cell's ground.
  put(x, gr, z, "polished_andesite");

  for (let y = gr + 1; y <= 20; y++) {
    const r = y % 5;

    // Roof slab at y 20 and floor slabs at y 5, 10, 15 span every cell.
    if (y === 20) { put(x, y, z, "gray_concrete"); continue; }
    if (r === 0) { put(x, y, z, "white_concrete"); continue; }

    // Interior cells: air behind the glass, nothing else.
    if (!per) continue;

    const storey = Math.floor(y / 5);
    const face = outward(x, z);
    const inwardX = face === "east" ? x - 1 : face === "west" ? x + 1 : x;
    const inwardZ = face === "south" ? z - 1 : face === "north" ? z + 1 : z;

    // Entrance door, two blocks tall at grade.
    if (storey === 0 && door && `${x},${z}` === doorKey && (y === gr + 1 || y === gr + 2)) {
      const f = outward(x, z);
      put(x, y, z, "spruce_door", {
        facing: f,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (r === 4) {
      // Cream tiled spandrel under each window band.
      put(x, y, z, "white_terracotta");
      continue;
    }

    // Window band (r 1..3): frames at every third cell, glass between.
    const pillar = z % 3 === 0;
    if (pillar) {
      put(x, y, z, storey === 0 ? "stone_bricks" : "white_concrete");
      continue;
    }
    put(x, y, z, "cyan_stained_glass_pane", paneProps(x, z));

    // Warm light behind some panes, in the air gap inside.
    if ((z + storey) % 4 === 1 && perim(inwardX, inwardZ) === false && has(inwardX, inwardZ)) {
      put(inwardX, y, inwardZ, "glowstone");
    }
  }

  // Parapet and cornice on the perimeter.
  if (per) {
    put(x, 21, z, "white_concrete");
    put(x, 22, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Roof plant: two boxes and a mast on the open roof.
    if (z % 7 === 3) {
      put(x, 21, z, "light_gray_concrete");
      put(x, 22, z, "light_gray_concrete");
    }
    if (x === 1 && z === 10) {
      for (let y = 21; y <= 25; y++) put(x, y, z, "iron_bars");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
