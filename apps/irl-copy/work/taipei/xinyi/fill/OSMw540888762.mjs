import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888762";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground levels (relative to the lowest ground under the building)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const low = Math.min(...cells.map((c) => c[2]));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => Math.max(0, Math.min(8, Math.round(ground.get(`${x},${z}`) - low)));

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const doorX = Math.round((minX + maxX) / 2);

const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Outward face of a perimeter cell; "along" is the coordinate running along that face
function face(x, z) {
  if (!has(x, z + 1)) return { dir: "south", along: x, lo: minX, hi: maxX };
  if (!has(x, z - 1)) return { dir: "north", along: x, lo: minX, hi: maxX };
  if (!has(x + 1, z)) return { dir: "east", along: z, lo: minZ, hi: maxZ };
  return { dir: "west", along: z, lo: minZ, hi: maxZ };
}

const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation up to the ground under this cell
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: ground-floor slab, second-floor slab, roof slab, no air-filled rooms
    S(x, gr, z, "smooth_quartz");
    if (gr < 5) S(x, 5, z, "smooth_quartz");
    S(x, 10, z, "light_gray_concrete");
    // Roof plant: a 2x2 pair of units on the roof
    const rx = x - (minX + 4), rz = z - (minZ + 3);
    if (rx >= 0 && rx <= 1 && rz >= 0 && rz <= 1) S(x, 11, z, "iron_block");
    continue;
  }

  // Perimeter: wall stack from its ground to the roof
  const f = face(x, z);
  const pier = f.along === f.lo || f.along === f.hi || (f.along - f.lo) % 3 === 0;
  const wall = pier ? "quartz_pillar" : "smooth_quartz";
  const isDoorCol = f.dir === "south" && z === maxZ && f.along === doorX;
  const isCanopyCol = f.dir === "south" && z === maxZ && Math.abs(f.along - doorX) <= 2;

  for (let y = gr; y <= 9; y++) {
    let id = wall;
    let props;
    if (y === gr) {
      id = "stone_bricks"; // base course
    } else if (y === 4 || y === 5) {
      id = "light_gray_concrete"; // storey line
      if (y === 5) id = "smooth_quartz";
    } else if (!pier) {
      const glassBand = (y >= gr + 1 && y <= gr + 2) || (y >= 6 && y <= 8);
      if (isDoorCol && (y === gr + 1 || y === gr + 2)) {
        id = "dark_oak_door";
        props = {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (glassBand) {
        id = "light_blue_stained_glass_pane";
      } else if (y === gr + 3 || y === 9) {
        id = "gray_concrete"; // lintel / sill
      }
    }
    if (isCanopyCol && y === gr + 3 && !pier) {
      id = "dark_oak_slab";
      props = { type: "top", waterlogged: "false" };
    }
    if (props) S(x, y, z, id, props);
    else S(x, y, z, id);
  }

  // Cornice and parapet
  S(x, 10, z, "light_gray_concrete");
  S(x, 11, z, "stone_brick_wall", { east: "low", north: "low", south: "low", west: "low", up: "false", waterlogged: "false" });

  // Warm light behind selected upper windows on the street face
  if (f.dir === "south" && !pier && !isDoorCol) {
    const k = (f.along - f.lo) % 6;
    if (k === 4 && has(x, z - 1) && !perim(x, z - 1) && has(x, z - 2) && !perim(x, z - 2)) {
      S(x, 7, z - 2, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
