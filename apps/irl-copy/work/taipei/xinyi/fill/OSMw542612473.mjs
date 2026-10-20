import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw542612473: 2-storey, 1980s-style Taipei commercial block with shopfront,
// white tiled-concrete facade, glass-pane bays with piers, parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612473";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => foot.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// Common floor level = highest footprint ground, so the whole block sits level.
let L = 0;
for (const [, , gr] of cells) L = Math.max(L, gr);

// Outward-facing sides for each footprint cell.
const outsOf = (x, z) =>
  Object.keys(DIRS).filter(d => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Entrance: ground-floor south-facing perimeter cell nearest the centre line.
const southCands = cells
  .filter(([x, z]) => outsOf(x, z).includes("south"))
  .map(([x, z]) => [x, z]);
let entrance = null;
if (southCands.length) {
  entrance = southCands.reduce((best, c) =>
    Math.abs(c[0] - W / 2) < Math.abs(best[0] - W / 2) ? c : best);
}
const entKey = entrance ? key(entrance[0], entrance[1]) : null;

for (const [x, z] of cells) {
  // Foundation: solid from y 0 up to the common floor level.
  for (let y = 0; y < L; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground (L), second floor (L+5), roof (L+10).
  put(x, L, z, "smooth_stone");
  put(x, L + 5, z, "white_concrete");
  put(x, L + 10, z, "light_gray_concrete");

  const outs = outsOf(x, z);
  const perimeter = outs.length > 0;

  if (!perimeter) {
    // Interior roof: sparse rooftop plant boxes.
    if ((x * 3 + z * 5) % 11 === 0) put(x, L + 11, z, "light_gray_concrete");
    continue;
  }

  // Parapet and cornice course.
  put(x, L + 10, z, "smooth_stone");
  put(x, L + 11, z, "white_concrete");

  const face = outs[0];
  const alongZ = face === "east" || face === "west"; // wall runs along z
  const t = alongZ ? z : x;
  const corner = outs.length >= 2;
  const pier = corner || t % 3 === 0;
  const panesProps = alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const inward = OPP[face];
  const [idx, idz] = DIRS[inward];
  const innerIn = inF(x + idx, z + idz);

  for (let s = 0; s < 2; s++) {
    const base = L + 1 + 5 * s;
    for (let r = 0; r < 4; r++) {
      const y = base + r;
      const isEnt = s === 0 && entKey === key(x, z) && (r === 1 || r === 2);
      if (isEnt) continue; // door set below

      if (r === 0) {
        put(x, y, z, s === 0 ? "gray_concrete" : "white_concrete");
        continue;
      }
      if (r === 3) {
        put(x, y, z, "smooth_stone");
        continue;
      }
      // r = 1, 2 : glazing zone
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (s === 0) {
        put(x, y, z, "cyan_stained_glass_pane", panesProps);
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", panesProps);
      }
    }

    // Warm lights behind some glazed bays.
    if (!pier && innerIn && (t + 2 * s) % 3 === 1) {
      put(x + idx, base + 1, z + idz, "glowstone");
    }
  }

  // Entrance door on the ground floor.
  if (entKey === key(x, z)) {
    const facing = OPP[face];
    put(x, L + 1, z, "dark_oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, L + 2, z, "dark_oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Warm light in the shop behind the entrance.
    if (innerIn) put(x + idx, L + 3, z + idz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
