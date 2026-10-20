import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403765";
const W = 21, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const ROOF = B + 11;                              // roof/parapet top level
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function P(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function missing(x, z) {
  return Object.keys(DIRS).filter((k) => !has(x + DIRS[k][0], z + DIRS[k][1]));
}

// Foundation and walls
for (const [x, z, gr] of cells) {
  // foundation plinth up to this cell's ground
  for (let y = 0; y < gr; y++) P(x, y, z, "stone_bricks");

  const miss = missing(x, z);
  const ext = miss.length > 0;
  const corner = miss.length >= 2;
  const f = miss[0];
  const onNS = f === "north" || f === "south";
  const i = f ? (onNS ? x : z) : 0;
  const centre = onNS ? (minX + maxX) / 2 : (minZ + maxZ) / 2;
  const isDoor = ext && !corner && f === "south" && x === Math.round(centre);

  // inward cell (interior air behind the glass)
  let inwardInterior = false, ix = x, iz = z;
  if (ext && !corner && f) {
    ix = x - DIRS[f][0];
    iz = z - DIRS[f][1];
    inwardInterior = has(ix, iz) && missing(ix, iz).length === 0;
  }

  for (let y = gr; y <= ROOF; y++) {
    if (!ext) {
      // interior: floor slabs and roof deck only, rest is air
      if (y === B + 5 || y === B + 10) P(x, y, z, "smooth_stone");
      else if (y === ROOF && (x * 7 + z * 3) % 11 === 0) P(x, y, z, "iron_block");
      continue;
    }

    // exterior shell
    if (y === ROOF) {
      P(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (corner) {
      P(x, y, z, y === B + 10 ? "light_gray_concrete" : "light_gray_concrete");
      continue;
    }
    if (y === B + 10 || y === B + 5) {
      P(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === B) {
      P(x, y, z, "gray_concrete");
      continue;
    }

    if (y >= B + 1 && y <= B + 4) {
      // ground floor: commercial shopfront
      if (y === B + 4) { P(x, y, z, "black_concrete"); continue; }
      if (isDoor) {
        if (y === B + 1) {
          P(x, y, z, "oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === B + 2) {
          P(x, y, z, "oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          P(x, y, z, "glass");
        }
        continue;
      }
      if (i % 3 === 0 || !f) { P(x, y, z, "white_concrete"); continue; }
      P(x, y, z, "glass");
      if (inwardInterior && y === B + 2 && i % 3 === 2) P(ix, y, iz, "glowstone");
      continue;
    }

    if (y >= B + 6 && y <= B + 9) {
      // upper storey: punched windows with frames
      if (y === B + 6) { P(x, y, z, "quartz_block"); continue; }
      if (y === B + 9) { P(x, y, z, "white_concrete"); continue; }
      if (i % 3 === 0 || !f) { P(x, y, z, "white_concrete"); continue; }
      P(x, y, z, "glass");
      if (inwardInterior && y === B + 7 && i % 6 === 1) P(ix, y, iz, "shroomlight");
      continue;
    }

    P(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
