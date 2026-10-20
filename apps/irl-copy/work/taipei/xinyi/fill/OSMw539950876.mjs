import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record: a 2-storey, 1980s-90s Xinyi shophouse/office block with a
// granite base, quartz cornice, stone storey bands, glass shopfront and
// light-blue glass upper windows. Roof deck at y=10, parapet top at y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950876";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) {
  foot.set(key(x | 0, z | 0), Math.min(4, Math.max(0, Math.round(gr))));
}
const has = (x, z) => foot.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// exterior facing of an edge cell
function outFace(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}
// bay coordinate along the wall the cell faces
function bayCoord(x, z) {
  const f = outFace(x, z);
  return (f === "west" || f === "east") ? z : x;
}

// entrance: north-facing cell nearest x=3, on the lowest z row
let door = null;
for (const [x, z] of cells.map(([a, b]) => [a | 0, b | 0])) {
  if (outFace(x, z) !== "north") continue;
  if (!door || Math.abs(x - 3) < Math.abs(door.x - 3) || (Math.abs(x - 3) === Math.abs(door.x - 3) && z < door.z)) {
    door = { x, z, B: foot.get(key(x, z)) };
  }
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const [rx, rz] of cells) {
  const x = rx | 0, z = rz | 0;
  const B = foot.get(key(x, z));
  const edge = isEdge(x, z);

  // foundation up to the lowest-ground-following base
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // interior: floor slabs, roof deck, air gap behind the glass
    g.set(x, B, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, 10, z, "light_gray_concrete");

    // warm glowstone behind some upper-floor windows
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      if (!has(nx, nz) || !isEdge(nx, nz)) continue;
      if (has(nx + dx, nz + dz)) continue; // neighbour is not an exterior face in this direction
      const c = dx !== 0 ? nz : nx;
      if (c % 3 !== 0 && c % 6 === 2) {
        g.set(x, 7, z, "glowstone");
        break;
      }
    }
    continue;
  }

  // exterior wall column
  const c = bayCoord(x, z);
  const glass = c % 3 !== 0;
  const isDoor = door && door.x === x && door.z === z;

  for (let y = B; y <= 10; y++) {
    if (y === 10) { g.set(x, y, z, "smooth_quartz"); continue; }      // cornice / roof edge
    if (y === B) { g.set(x, y, z, "polished_granite"); continue; }    // base course
    if (isDoor && (y === B + 1 || y === B + 2)) {
      g.set(x, y, z, "dark_oak_door", doorProps(y === B + 1 ? "lower" : "upper"));
      continue;
    }
    if (y === 4) { g.set(x, y, z, "smooth_quartz"); continue; }       // shopfront lintel
    if (y < 4) {                                                       // shopfront
      g.set(x, y, z, glass ? "glass" : "smooth_quartz");
      continue;
    }
    if (y === 5 || y === 9) { g.set(x, y, z, "stone_bricks"); continue; } // storey lines
    if (y >= 6 && y <= 8) {                                            // upper windows
      g.set(x, y, z, glass ? "light_blue_stained_glass" : "white_concrete");
    }
  }
}

// roof plant on the upper deck, only where footprint exists
for (let x = 2; x <= 4; x++) {
  for (let z = 9; z <= 11; z++) {
    if (has(x, z)) g.set(x, 11, z, "light_gray_concrete");
  }
}
if (has(3, 10)) g.set(3, 12, 10, "white_concrete");

g.save(`${DIR}/${ID}.nbt`);
