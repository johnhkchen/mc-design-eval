// A two-storey 1920s shop-and-flat block on a stepped footprint: a brick ground floor with a dark-timber shopfront on the
// south (street) face, a stucco upper storey with stone string and cornice courses, a parapet, and lower wings on the west
// and north-east. Windows are panes set into the outer face with a one-block air pocket behind; some pockets hold a glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237118.cells.json", "utf8"));
const g = new Voxels([10, 21, 12]);

// Each column: its lidar ground and roof, and the roof stepped to three clean tiers (8 main, 6 wing, 4 lean-to).
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, roof, top: roof >= 8 ? 8 : roof >= 6 ? 6 : 4 });
const at = (x, z) => col.get(`${x},${z}`);
const N = [0, -1], S = [0, 1], E = [1, 0], W = [-1, 0];
const DIRS = [N, S, E, W];
// the sides of a block at height y that face open air: the neighbour column is missing or stands lower than y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top <= y; });
// the bay index along a face: x on north/south faces, z on east/west faces
const along = ([dx, dz], x, z) => (dz ? x : z);
const lit = (x, y, z) => (x * 7 + y * 3 + z) % 4 === 0;

// the wall's material by height in a tier of top T: plinth, brick ground storey, stone string and cornice, stucco upper
function band(y, T) {
  if (y === 0 || y === 4 || y === T - 1) return "stone_bricks";
  if (y < 3) return "bricks";
  return "smooth_quartz";
}
const winRow = (y, T) => y === 1 || y === 2 || (T === 8 && (y === 5 || y === 6));

// 1. the solid massing, from y 0 up to each tier's top (the foundation is the y 0 course under every column)
for (const [key, { top: T }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) g.set(x, y, z, band(y, T));
  // the roof: a parapet ring on the exposed edge, the flat roof inside it
  const edge = DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < T; });
  g.set(x, T, z, edge ? "smooth_quartz" : "stone");
}

// 2. the openings: panes in the outer face on every third bay, shopfront glass and a door on the street face
const carve = [];
for (const [key, { top: T }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < T; y++) {
    if (!winRow(y, T)) continue;
    for (const dir of exposed(x, y, z)) {
      const [dx, dz] = dir;
      const inward = [x - dx, z - dz];
      const pocket = at(inward[0], inward[1]);
      if (!pocket || pocket.top <= y) continue;
      const front = dz === 1;
      if (front && T >= 6 && (y === 1 || y === 2)) {
        // the shopfront: a door in the middle of the street face, glass either side
        if (x === 5 && z === 10) {
          g.set(x, y, z, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
          carve.push([inward[0], y, inward[1], "air"]);
        } else {
          g.set(x, y, z, "glass");
          carve.push([inward[0], y, inward[1], lit(x, y, z) ? "glowstone" : "air"]);
        }
        break;
      }
      if (along(dir, x, z) % 2 !== 1) continue;
      const state = dz ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", state);
      carve.push([inward[0], y, inward[1], lit(x, y, z) ? "glowstone" : "air"]);
      break;
    }
  }
}
// the pockets behind the glass: air, or a glowstone lamp; set after the openings so they are not overwritten
for (const [x, y, z, b] of carve) g.set(x, y, z, b);
// the shopfront fascia: dark timber over the shop glass on the street face
for (const [key, { top: T }] of col) {
  const [x, z] = key.split(",").map(Number);
  if (T >= 6 && at(x, z + 1) === undefined) g.set(x, 3, z, "dark_oak_planks");
}

// 3. roof plant: a two-high service room on the main roof, set in from the parapet
for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6]]) {
  g.set(x, 9, z, "stone_bricks");
  g.set(x, 10, z, "smooth_quartz");
}

const saved = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237118.nbt");
console.log(saved);
