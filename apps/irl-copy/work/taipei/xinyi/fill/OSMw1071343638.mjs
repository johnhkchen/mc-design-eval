import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343638";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8")); // [x, z, ground]

const W = 21, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), gr);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const T = L + 11;                                 // roof level, ~11 blocks above lowest ground
const F1 = L + 5;                                 // second-floor slab / storey line

const isEdge = (x, z) =>
  !occ.has(key(x + 1, z)) || !occ.has(key(x - 1, z)) ||
  !occ.has(key(x, z + 1)) || !occ.has(key(x, z - 1));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// glass pane oriented along the facade (uses neighbours to find the run direction)
const pane = (x, z) => {
  const alongX = occ.has(key(x - 1, z)) || occ.has(key(x + 1, z));
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// door: outer edge cell on the minimum-z side, nearest the footprint middle column
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
const minZ = Math.min(...edgeCells.map((c) => c[1]));
const midX = (W - 1) / 2;
const doorCell = edgeCells
  .filter((c) => c[1] === minZ)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr] of cells) {
  const e = isEdge(x, z);
  const a = x + z; // facade rhythm index

  // foundation below the cell's own ground, up to y 0
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // plinth / base course at the cell's ground
  put(x, gr, z, "stone_bricks");

  for (let y = gr + 1; y <= T; y++) {
    if (y === T) {
      // parapet on the outer shell; sparse roof plant on the interior
      if (e) put(x, y, z, "white_concrete");
      else if (((x * 3 + z * 5) % 11) === 0) put(x, y, z, "iron_block");
      continue;
    }
    if (y === T - 1) {
      // cornice on the shell, roof slab inside
      put(x, y, z, e ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (y === F1) {
      // storey line / floor slab across the whole footprint
      put(x, y, z, e ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (y <= L + 4) {
      // ground floor: commercial shopfront
      if (!e) continue;
      if (y === L + 4) { put(x, y, z, "white_concrete"); continue; }
      if (a % 3 === 0) { put(x, y, z, "dark_oak_planks"); continue; }
      if (y === L + 2 && a % 5 === 2) { put(x, y, z, "glowstone"); continue; }
      if (y <= L + 3) { put(x, y, z, "glass_pane", pane(x, z)); continue; }
      continue;
    }
    if (y >= L + 6 && y <= L + 9) {
      // upper storey: framed window grid
      if (!e) continue;
      if (y === L + 6 || y === L + 9) { put(x, y, z, "white_concrete"); continue; }
      if (a % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      if (y === L + 7 && (x * 3 + z) % 7 === 0) { put(x, y, z, "shroomlight"); continue; }
      put(x, y, z, "glass_pane", pane(x, z));
      continue;
    }
  }
}

// entrance: oak door with a hanging lantern as a canopy light, on the front shell
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  if (dg + 2 <= L + 3) {
    put(dx, dg + 1, dz, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(dx, dg + 2, dz, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(dx, dg + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
