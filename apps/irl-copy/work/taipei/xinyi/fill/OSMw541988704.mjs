import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988704";
const W = 21, H = 23, D = 14;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell: outward normals where the neighbour is missing
const faces = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has(x + dx, z + dz));
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Entrance: middle of the south-facing (+z) exterior wall, else middle of any exterior wall
const perimCells = cells
  .map(([x, z]) => ({ x, z, f: faces(x, z) }))
  .filter((c) => c.f.length > 0);
let doorCands = perimCells.filter((c) => c.f.some(([dx, dz]) => dx === 0 && dz === 1));
if (doorCands.length === 0) doorCands = perimCells;
doorCands.sort((a, b) => a.x + a.z - (b.x + b.z));
const doorCell = doorCands[Math.floor(doorCands.length / 2)];
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
const doorFace = doorCell ? doorCell.f.find(([dx, dz]) => dx === 0 && dz === 1) ?? doorCell.f[0] : null;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line (0, 1, 2 = roof deck at gr+10)
  for (let s = 0; s <= 2; s++) put(x, gr + 5 * s, z, "light_gray_concrete");

  const f = faces(x, z);
  if (f.length === 0) {
    // Interior roof plant: small units on the roof deck
    if (x % 5 === 2 && z % 4 === 2) put(x, gr + 11, z, "light_gray_concrete");
    continue;
  }

  const [dx, dz] = f[0];
  const t = dx !== 0 ? z : x; // position along the facade
  const pier = t % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;

  // Storeys 0 (shopfront) and 1 (offices): wall zone, then storey band
  for (let s = 0; s <= 1; s++) {
    const b = gr + 5 * s;
    for (let y = b + 1; y <= b + 3; y++) {
      if (s === 0) {
        if (pier) put(x, y, z, "stone_bricks");
        else if (y === b + 3) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "glass");
      } else {
        put(x, y, z, pier ? "smooth_quartz" : "glass");
      }
    }
    put(x, b + 4, z, "white_concrete"); // storey line

    // Warm light behind some windows, only where the inside cell is interior air
    if (!pier && !isDoor) {
      const lit = s === 0 ? t % 6 === 2 : (t + 1) % 5 === 1;
      const ix = x - dx, iz = z - dz;
      if (lit && has(ix, iz) && faces(ix, iz).length === 0) {
        put(ix, b + 2, iz, "glowstone");
      }
    }
  }

  // Entrance door on the ground storey
  if (isDoor) {
    const facing = FACING[`${doorFace[0]},${doorFace[1]}`];
    put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Parapet on the roof deck (roof deck is at gr+10)
  put(x, gr + 11, z, pier ? "stone_bricks" : "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
