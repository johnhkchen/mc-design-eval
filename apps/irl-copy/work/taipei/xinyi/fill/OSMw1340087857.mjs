import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Lidar roof ~7 blocks above lowest ground, so a single
// commercial/civic hall: a 5-block storey (glass band over a granite base) with
// a 2-block cornice and parapet, cream tiled walls, blue glass, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340087857";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 46, H = 19, D = 48;
const ROOF = 6;                       // top body block; roof surface sits at y=7

const minG = Math.min(...cells.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr - minG);
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const face = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
};

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Entrance: two-wide door in the north (min-z) face, centred, on low cells only.
const doorX = [22, 23];
const doorCells = new Set();
for (const x of doorX) {
  for (let z = 0; z < D; z++) {
    if (has(x, z) && !has(x, z - 1)) {
      if (gAt(x, z) <= 2) doorCells.add(`${x},${z}`);
      break;
    }
  }
}

// Main pass over footprint cells.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gAt(x, z);

  // Foundation up to this cell's ground, then floor slab at ground level.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  S(x, gr, z, "smooth_stone");

  // Solid rock/plinth where ground already reaches the roof line.
  if (gr >= 5) continue;

  const isP = perim(x, z);
  if (!isP) {
    // Interior: air gap, floor slab already placed, roof slab on top.
    S(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const f = face(x, z);
  const along = (f === "N" || f === "S") ? x : z;
  const conn = (f === "N" || f === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = doorCells.has(`${x},${z}`);

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) { S(x, y, z, "light_gray_concrete"); continue; }   // parapet cap
    if (y === 5) { S(x, y, z, "smooth_quartz"); continue; }             // cornice
    if (isDoor && y === gr + 1) {
      const hinge = x === doorX[0] ? "left" : "right";
      S(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gr + 2) {
      const hinge = x === doorX[0] ? "left" : "right";
      S(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge, powered: "false" });
      continue;
    }
    if (y === gr + 1 && gr + 1 <= 3) { S(x, y, z, "polished_granite"); continue; } // base course
    if (y >= gr + 2 && y <= 4) {
      if (along % 6 === 0) { S(x, y, z, "light_gray_concrete"); continue; }     // pilaster
      S(x, y, z, "light_blue_stained_glass_pane", conn);
      // Warm light behind some glass, on the inner cell.
      if (y === 3 && along % 12 === 3) {
        const ix = f === "N" ? x : f === "S" ? x : f === "W" ? x + 1 : x - 1;
        const iz = f === "N" ? z + 1 : f === "S" ? z - 1 : z;
        if (has(ix, iz) && !perim(ix, iz) && 3 > gAt(ix, iz)) S(ix, 3, iz, "glowstone");
      }
      continue;
    }
    S(x, y, z, "white_concrete");
  }
}

// Rooftop plant: four small 2x2 units on the interior roof, at y=7.
for (const x0 of [10, 30]) {
  for (const z0 of [10, 34]) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
      const x = x0 + dx, z = z0 + dz;
      return has(x, z) && !perim(x, z) && gAt(x, z) <= 4;
    });
    if (!ok) continue;
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      S(x0 + dx, 7, z0 + dz, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
