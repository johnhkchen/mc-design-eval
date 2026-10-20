import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw540888756.cells.json`, "utf8"));

const W = 30, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const glassPaneZFace = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const glassPaneXFace = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, b] of cells) {
  // Exposure: a missing neighbour in z means the cell sits on a north/south face
  const exposedZ = !has(x, z - 1) || !has(x, z + 1);
  const exposedX = !has(x - 1, z) || !has(x + 1, z);
  const perim = exposedX || exposedZ;
  const corner = exposedX && exposedZ;
  // Position along the face (window rhythm every 3 blocks, mullion on multiples of 3)
  const t = corner ? -1 : (exposedZ ? x : z);
  const mullion = corner || t % 3 === 0;
  const paneProps = exposedZ ? glassPaneZFace : glassPaneXFace;

  // Inward direction for placing lights behind glass
  const dx = has(x + 1, z) ? 1 : -1;
  const dz = has(x, z + 1) ? 1 : -1;
  const inwardX = exposedX && !exposedZ ? (has(x + 1, z) ? 1 : -1) : 0;
  const inwardZ = exposedZ && !exposedX ? dz : 0;
  const lightX = x + inwardX;
  const lightZ = z + inwardZ;
  const lightInside = has(lightX, lightZ) && !(lightX === x && lightZ === z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  // Base course
  g.set(x, b, z, perim ? "stone_bricks" : "smooth_stone");

  // Ground floor (shopfront): b+1 .. b+3
  for (let y = b + 1; y <= b + 3; y++) {
    if (!perim) continue;
    const isDoorCol = exposedZ && !exposedX && z === D - 1 && t === 14;
    if (isDoorCol) {
      if (y === b + 1 || y === b + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === b + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        g.set(x, y, z, "quartz_block");
      }
    } else if (mullion) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "glass_pane", paneProps);
    }
  }

  // Transom band over shopfront
  if (perim) g.set(x, b + 4, z, "white_concrete");

  // Storey line (floor slab) at b+5
  g.set(x, b + 5, z, perim ? "quartz_block" : "smooth_stone");

  // Upper floor windows: b+6 .. b+9
  for (let y = b + 6; y <= b + 9; y++) {
    if (!perim) continue;
    if (mullion) {
      g.set(x, y, z, "quartz_block");
    } else {
      g.set(x, y, z, "glass_pane", paneProps);
      // warm light behind some windows, at the middle storey only
      if (y === b + 7 && t % 6 === 1 && lightInside) {
        g.set(lightX, y, lightZ, "shroomlight");
      }
    }
  }

  // Roof level: interior slab, perimeter parapet with cornice
  g.set(x, b + 10, z, perim ? "stone_bricks" : "smooth_stone");
  if (perim) g.set(x, b + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Roof plant: two small units on the roof slab
  if (!perim) {
    const unit =
      ((x === 6 || x === 7) && (z === 4 || z === 5)) ||
      ((x === 22 || x === 23) && (z === 4 || z === 5));
    if (unit) g.set(x, b + 11, z, "iron_block");
  }
}

g.save(`${dir}/OSMw540888756.nbt`);
