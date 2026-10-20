import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644355";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 20;
const ROOF = 11;          // roof deck surface, about 11 blocks above lowest ground
const PARAPET = ROOF + 1; // parapet / cornice cap
const BELTS = [5, 10];    // storey lines (ground storey 0..4, upper storey 6..9)

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

// Outward faces of an edge cell: N = -z, S = +z, W = -x, E = +x
const faces = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
};

// Inward neighbour for a face (used to place warm lights behind glass)
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: two columns on the N face, near the middle of the 23-wide front
const DOOR_X = [10, 11];

for (const [x, z, gr] of cells) {
  if (gr >= H) continue;

  // Foundation below the cell's ground, then the ground-level floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr <= ROOF) put(x, gr, z, "smooth_stone");

  const fs = faces(x, z);
  const perimeter = fs.length > 0;

  if (perimeter) {
    const corner = fs.length > 1;
    const primary = fs[0];
    const t = primary === "N" || primary === "S" ? x : z; // position along the face
    const pier = corner || t % 3 === 0;

    for (let y = gr + 1; y <= ROOF; y++) {
      let id;
      if (y === ROOF) {
        id = "smooth_stone";                       // cornice course under the roof
      } else if (BELTS.includes(y)) {
        id = "smooth_stone";                       // storey lines
      } else if (y < BELTS[0]) {
        // Ground storey: shopfront glass between stone piers
        id = pier ? "stone_bricks" : "glass";
      } else {
        // Upper storey: piers, sills and lintels, and glazing between
        if (pier || y === 6 || y === 9) id = "white_concrete";
        else id = "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }

    // Parapet cap
    if (PARAPET <= H - 1) put(x, PARAPET, z, "white_concrete");

    // Warm light behind some upper-storey windows (inside the air gap)
    if (!pier && fs.length === 1) {
      const t2 = primary === "N" || primary === "S" ? x : z;
      if (t2 % 6 === 1) {
        const [dx, dz] = inward[primary];
        if (inside(x + dx, z + dz)) put(x + dx, 7, z + dz, "glowstone");
      }
    }

    // Entrance on the N face
    if (fs.includes("N") && DOOR_X.includes(x) && gr + 2 < BELTS[0]) {
      const yLow = gr + 1;
      put(x, yLow, z, "oak_door", {
        facing: "north", half: "lower", hinge: x === 10 ? "left" : "right",
        open: "false", powered: "false",
      });
      put(x, yLow + 1, z, "oak_door", {
        facing: "north", half: "upper", hinge: x === 10 ? "left" : "right",
        open: "false", powered: "false",
      });
      // Warm light just inside the entrance
      if (inside(x, z + 1)) put(x, yLow + 1, z + 1, "glowstone");
    }
  } else {
    // Interior: floor slabs at storey lines only, air otherwise (no interiors)
    for (const b of BELTS) if (b > gr && b <= ROOF) put(x, b, z, "smooth_stone");
  }

  // Roof deck over the whole footprint, parapet ring on the edge
  if (gr < ROOF) put(x, ROOF, z, perimeter ? "smooth_stone" : "light_gray_concrete");

  // Roof equipment: a few AC plinths on interior roof cells
  if (!perimeter && gr <= ROOF && x % 8 === 5 && z % 8 === 5) {
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
