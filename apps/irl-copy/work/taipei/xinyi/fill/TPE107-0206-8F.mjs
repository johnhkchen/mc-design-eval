import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0206-8F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// ---- footprint and grounds ----
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const B = Math.min(...ground.values());   // lowest ground under the footprint
const ROOF = B + 10;                      // last solid level; roof surface at B+11
const FLOOR2 = B + 5;                     // storey line between the two storeys

// ---- depth from the outside edge (1 = perimeter cell) ----
const depth = new Map();
let frontier = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) {
    depth.set(`${x},${z}`, 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(`${x},${z}`);
    for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
      const k = `${nx},${nz}`;
      if (inside(nx, nz) && !depth.has(k)) {
        depth.set(k, d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}
const dAt = (x, z) => depth.get(`${x},${z}`) ?? 99;

const isCorner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

// ---- entrance: middle of the street-facing (minimum-z) perimeter run ----
const minZ = Math.min(...cells.filter(([x, z]) => dAt(x, z) === 1).map(c => c[1]));
const frontCells = cells
  .filter(([x, z]) => dAt(x, z) === 1 && z === minZ)
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const midX = frontCells.length
  ? frontCells[Math.floor((frontCells.length - 1) / 2)]
  : cells[0][0];
const ex = midX, ez = minZ;
const E = gAt(ex, ez);
const entranceCols = [ex - 2, ex - 1, ex, ex + 1, ex + 2];
const isFrontCell = x => inside(x, ez) && dAt(x, ez) === 1;

// ---- main shell ----
for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gy; y++) g.set(x, y, z, "stone_bricks");

  const edge = dAt(x, z) === 1;
  for (let y = gy + 1; y <= ROOF && y < H; y++) {
    let id = null;
    if (y === ROOF) {
      id = edge && isCorner(x, z) ? "quartz_block" : "light_gray_concrete";   // roof slab / parapet cap
    } else if (y === FLOOR2) {
      id = edge ? "light_gray_concrete" : "white_concrete";                  // storey line / floor slab
    } else if (edge) {
      if (y === B + 1) {
        id = "stone_bricks";                                                 // base course
      } else if (isCorner(x, z)) {
        id = "quartz_block";                                                 // corner columns
      } else {
        const windowRow = (y >= B + 2 && y <= B + 4) || (y >= B + 6 && y <= B + 9);
        if (windowRow) {
          // paired glass bays between light-grey mullions, with a recessed
          // reveal on every storey so the facade has shadow lines
          const bay = (x + z) % 3;
          id = bay === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
        } else {
          // spandrel panels: alternate white and light-grey for a tiled rhythm
          id = (x + z) % 2 === 0 ? "white_concrete" : "light_gray_concrete";
        }
      }
    }
    if (id) g.set(x, y, z, id);
  }
}

// ---- warm lights behind the glass (depth 2, inside the window bays) ----
for (const [x, z, gy] of cells) {
  if (dAt(x, z) !== 2 || (x + z) % 6 !== 0) continue;
  for (const y of [B + 2, B + 7]) {
    if (y > gy && y < FLOOR2 + 5) g.set(x, y, z, "glowstone");
  }
}

// ---- recessed entrance: door, reveal, canopy on pillars ----
// clear the door bay and the lobby behind it
for (const x of [ex - 1, ex, ex + 1]) {
  if (!inside(x, ez)) continue;
  for (const y of [E + 1, E + 2]) {
    g.set(x, y, ez + 1, "air");
  }
}
g.set(ex, E + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, E + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// quartz reveal columns on both sides of the door, two high
for (const px of [ex - 1, ex + 1]) {
  if (!isFrontCell(px)) continue;
  const pg = gAt(px, ez);
  for (let y = pg + 1; y <= E + 3; y++) g.set(px, y, ez, "quartz_block");
}
// lintel/canopy row over the entrance bay, carried by the columns
for (const x of entranceCols) {
  if (!isFrontCell(x)) continue;
  g.set(x, E + 3, ez, "light_gray_concrete");
}
// glowing lantern-style light above the door, inside the lobby
if (inside(ex, ez)) g.set(ex, E + 3, ez + 1, "glowstone");

// ---- roof plant: a low box on the roof slab, central and set back ----
const cx = 9, cz = 7;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (dAt(x, z) < 3) continue;
  if (Math.abs(x - cx) > 2 || Math.abs(z - cz) > 1) continue;
  if (ROOF + 3 >= H) continue;
  g.set(x, ROOF + 1, z, "light_gray_concrete");
  g.set(x, ROOF + 2, z, "light_gray_concrete");
  g.set(x, ROOF + 3, z, "stone");
}

g.save(`${DIR}/${ID}.nbt`);
