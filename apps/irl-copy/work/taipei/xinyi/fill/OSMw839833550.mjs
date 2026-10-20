import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833550";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFp = (x, z) => G.has(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const T = L + 11;                                 // roof surface (lidar: ~11 above lowest ground)

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const outward = (x, z) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d];
  return !inFp(x + dx, z + dz);
});

// Main entrance: the street (north) frontage cell nearest the middle of the north edge
const northCells = cells
  .filter(([x, z]) => !inFp(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells[Math.floor(northCells.length / 2)];
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : "";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;

  if (!perim) {
    // Interior: floor slabs per storey, roof deck, a little roof plant. No interior fit-out.
    put(x, gr, z, "light_gray_concrete");
    for (let y = gr + 1; y <= T - 1; y++) {
      const rel = T - 1 - y;
      if (rel === 0 || rel === 6 || (rel >= 10 && (rel - 10) % 5 === 0)) {
        put(x, y, z, "light_gray_concrete");
      }
    }
    if ((x * 3 + z) % 7 === 0) put(x, T, z, "stone_bricks"); // roof mechanical unit
    continue;
  }

  // Facade axis: along x on north/south faces, along z on east/west faces
  const onXAxis = out.includes("north") || out.includes("south");
  const face = out[0];
  const idx = onXAxis ? x : z;
  const isDoor = `${x},${z}` === doorKey;

  // Inward cell (for warm lights behind glass)
  let ix = 0, iz = 0;
  if (!corner) {
    const inv = OPP[face];
    const [dx, dz] = DIRS[inv];
    ix = dx; iz = dz;
  }

  for (let y = gr; y <= T - 1; y++) {
    const rel = T - 1 - y;

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (rel === 0) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (rel === 1) { put(x, y, z, "smooth_stone"); continue; }          // cornice
    if (rel === 6 || (rel >= 10 && (rel - 10) % 5 === 0)) {
      put(x, y, z, "light_gray_concrete"); continue;                    // floor string courses
    }

    // Entrance: lintel above the door, door in the ground storey
    if (isDoor) {
      if (rel === 9) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
        });
        continue;
      }
      if (rel === 8) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
        });
        continue;
      }
      if (rel === 7) { put(x, y, z, "white_concrete"); continue; }
    }

    const pillar = corner || idx % 3 === 0;
    if (pillar) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Glass: a pane grid, with the frame as white concrete mullions
    const paneProps = onXAxis
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "glass_pane", paneProps);

    // Warm light behind a few windows (inside cell, air gap behind the glass)
    if (rel % 10 === 3 && idx % 6 === 1 && !corner) {
      const bx = x + ix, bz = z + iz;
      if (inFp(bx, bz) && outward(bx, bz).length === 0) {
        put(bx, y, bz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
