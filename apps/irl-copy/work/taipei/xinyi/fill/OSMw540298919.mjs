import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298919";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 12, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell
function facesOf(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("north");
  if (!inFp(x, z + 1)) f.push("south");
  if (!inFp(x - 1, z)) f.push("west");
  if (!inFp(x + 1, z)) f.push("east");
  return f;
}

// Inward offset per face (from the wall cell into the building)
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: middle of the south face (fallback north / any face)
const perim = cells.filter(([x, z]) => facesOf(x, z).length > 0);
function pickEntrance() {
  for (const side of ["south", "north", "west", "east"]) {
    const list = perim.filter(([x, z]) => facesOf(x, z).includes(side))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (list.length) return { side, cell: list[Math.floor(list.length / 2)] };
  }
  return null;
}
const entr = pickEntrance();
const entrKey = entr ? `${entr.cell[0]},${entr.cell[1]}` : null;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const faces = facesOf(x, z);

  // Interior: ground slab, storey slab, roof deck; air between (no interiors)
  if (faces.length === 0) {
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, gr + 10, z, "light_gray_concrete");
    // Roof plant: a low mechanical block group near the centre-north
    if (x >= 3 && x <= 5 && z >= 8 && z <= 11) {
      g.set(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall: face chosen by first exterior side
  const face = faces[0];
  const along = (face === "north" || face === "south") ? x : z;
  const pier = along % 3 === 0;
  const isEntr = `${x},${z}` === entrKey && face === entr.side;
  const [ix, iz] = INWARD[face];

  // Base course
  g.set(x, gr, z, "polished_andesite");

  // Ground floor shopfront (rel 1..3), entrance door at rel 1-2
  for (let rel = 1; rel <= 3; rel++) {
    const y = gr + rel;
    if (isEntr && rel <= 2) {
      const half = rel === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (isEntr && rel === 3) {
      g.set(x, y, z, "glass");
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass");
    }
  }

  // Shopfront lintel and floor line
  g.set(x, gr + 4, z, "smooth_stone");
  g.set(x, gr + 5, z, "stone_bricks");

  // Upper storey: spandrels top and bottom, glazed window band between
  const lit = !pier && along % 3 === 2 && (x + z) % 4 === 0;
  for (const rel of [6, 9]) {
    g.set(x, gr + rel, z, pier ? "white_concrete" : "light_gray_concrete");
  }
  for (const rel of [7, 8]) {
    const y = gr + rel;
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane");
      if (lit && rel === 7) {
        // Warm light in the air gap just behind the glass
        const nx = x + ix, nz = z + iz;
        if (inFp(nx, nz) && facesOf(nx, nz).length === 0) {
          g.set(nx, groundAt(nx, nz) + 7, nz, "shroomlight");
        }
      }
    }
  }

  // Cornice and parapet
  g.set(x, gr + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, gr + 11, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
