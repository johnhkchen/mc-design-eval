import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402988";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const map = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  map.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const inside = (x, z) => map.has(`${x},${z}`);
const gAt = (x, z) => map.get(`${x},${z}`);
const isExt = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inside(x + dx, z + dz));

// Roof base: about 11 blocks above lowest ground (about two 5-block storeys plus parapet)
const T = Math.min(minG + 11, H - 2);

// Entrance: on the min-z street face, at the median x of that face
const faceXs = [];
for (const [x, z] of map.keys().map(k => k.split(",").map(Number))) {
  if (!inside(x, z - 1)) faceXs.push([x, z]);
}
const minZ = Math.min(...faceXs.map(([, z]) => z));
const frontXs = faceXs.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const EX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = isExt(x, z);
  const entrance = ext && z === minZ && x === EX;

  for (let y = gr; y < T; y++) {
    const rel = y - gr;
    const sr = rel % 5;
    const ground = rel < 5;

    if (ext) {
      if (y === T - 1) {
        g.set(x, y, z, "red_terracotta");                 // top cornice band
      } else if (sr === 0) {
        g.set(x, y, z, rel === 0 ? "stone_bricks" : "smooth_quartz"); // base course / spandrel
      } else if (sr === 4) {
        g.set(x, y, z, "smooth_quartz");                  // storey line / lintel
      } else if (ground && entrance) {
        if (rel === 1) g.set(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) g.set(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
      } else if (ground) {
        // Shopfront: continuous glass between stone piers
        if ((x + z) % 3 === 0) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
      } else {
        // Upper storeys: window bays between white concrete piers
        if ((x + z) % 3 !== 0) g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
        else g.set(x, y, z, "white_concrete");
      }
    } else {
      // Interior: air gap behind glass, one floor slab per storey
      if (sr === 0) g.set(x, y, z, "smooth_stone");
      else if (sr === 2 && (x + 2 * z) % 9 === 0) g.set(x, y, z, "shroomlight");
    }
  }

  // Roof deck over the whole footprint
  if (T - 1 >= gr) {
    if (!ext) g.set(x, T - 1, z, "smooth_stone");
  }

  // Parapet ring and roof plant
  if (ext) {
    if (T < H) g.set(x, T, z, "red_terracotta_slab", { type: "bottom", waterlogged: "false" });
  } else if (T < H - 1 && (x * 5 + z * 3) % 11 === 0) {
    g.set(x, T, z, "iron_block");                         // rooftop AC plant
  } else if (T < H - 1 && (x * 3 + z * 7) % 13 === 0) {
    g.set(x, T, z, "light_gray_concrete");                // service box
  }
}

g.save(`${DIR}/${ID}.nbt`);
