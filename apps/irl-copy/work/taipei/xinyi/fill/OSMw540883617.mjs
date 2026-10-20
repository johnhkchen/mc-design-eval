import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883617";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 23 x 6 grid: x 0..6, y 0..22, z 0..5
const g = new Voxels([7, 23, 6]);

// Ground normalised so y 0 is the lowest ground under the footprint.
const minG = Math.min(...cells.map((c) => c[2]));
const cellG = new Map();
for (const [x, z, gr] of cells) {
  cellG.set(`${x},${z}`, Math.min(11, Math.round(gr - minG)));
}
const has = (x, z) => cellG.has(`${x},${z}`);

// Two-storey cream-tiled shophouse with a red cornice band, flat roof and parapet.
// Roof level sits 11 blocks above the lowest ground (G + 11 parapet).

// Work out edge cells and the entrance (non-corner south-facing edge nearest the middle).
const info = new Map();
for (const [key, G] of cellG) {
  const [x, z] = key.split(",").map(Number);
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  info.set(key, { x, z, G, n, s, w, e, edge: n || s || w || e, corner: (n || s) && (w || e) });
}

let door = null;
let bestDist = Infinity;
for (const v of info.values()) {
  if (!v.edge || v.corner) continue;
  if (v.s || v.n) {
    const d = Math.abs(v.x - 3);
    if (d < bestDist) { bestDist = d; door = v; }
  }
}
if (!door) {
  for (const v of info.values()) if (v.edge && !v.corner) { door = v; break; }
}

// Pane orientation helper: wall running east-west gets east/west connections.
const panePropsFor = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

let acPlaced = false;

for (const v of info.values()) {
  const { x, z, G } = v;

  // Foundation from y 0 up to this cell's ground, then ground slab.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, "smooth_stone");

  // Storey slab at G+5 and roof deck at G+10 on every cell.
  g.set(x, G + 5, z, "smooth_stone");
  g.set(x, G + 10, z, "smooth_quartz");

  if (!v.edge) {
    // Interior: one simple AC unit on the roof for equipment read.
    if (!acPlaced) {
      g.set(x, G + 11, z, "light_gray_concrete");
      acPlaced = true;
    }
    continue;
  }

  // Facade direction and index along it.
  let face, idx;
  if (v.n || v.s) {
    face = v.n ? "north" : "south";
    idx = x;
  } else {
    face = v.w ? "west" : "east";
    idx = z;
  }

  const isWindowBay = !v.corner && idx % 2 === 1;
  const isDoor = door && door.x === x && door.z === z;

  // Full wall column (solid pier/wall) from ground to roof level.
  for (let y = G; y <= G + 10; y++) g.set(x, y, z, "smooth_quartz");

  // Base course.
  g.set(x, G, z, "stone_bricks");

  // Ground floor: shopfront glazing or piers, with a red-tile fascia over the door.
  for (let y = G + 1; y <= G + 3; y++) {
    if (isDoor) {
      if (y === G + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (y === G + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "red_terracotta");
      }
    } else if (isWindowBay) {
      g.set(x, y, z, "glass_pane", panePropsFor(face));
    }
  }
  // Canopy header over the entrance, one block above the door.
  if (isDoor) g.set(x, G + 4, z, "red_terracotta");

  // Storey line.
  g.set(x, G + 5, z, "polished_andesite");

  // Upper storey windows: sill, glazing, head.
  if (isWindowBay && !isDoor) {
    g.set(x, G + 6, z, "polished_andesite");
    g.set(x, G + 7, z, "glass_pane", panePropsFor(face));
    g.set(x, G + 8, z, "glass_pane", panePropsFor(face));
    g.set(x, G + 9, z, "polished_andesite");
  }

  // Cornice band and parapet.
  g.set(x, G + 10, z, "red_terracotta");
  g.set(x, G + 11, z, "smooth_quartz");

  // Warm light behind every other upper window, inside the interior air.
  if (isWindowBay && !isDoor && idx % 4 === 1) {
    let ix = x, iz = z;
    if (face === "north") iz = z + 1;
    else if (face === "south") iz = z - 1;
    else if (face === "west") ix = x + 1;
    else ix = x - 1;
    const inward = info.get(`${ix},${iz}`);
    if (inward && !inward.edge) {
      g.set(ix, inward.G + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
