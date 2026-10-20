import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883600";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 7 x 21, roof about 11 above lowest ground. Reading: a 1980s
// two-storey commercial block in pale tiled concrete with a stone plinth,
// a shopfront with a central entrance on the north short face, storey bands,
// a parapet cornice and a rooftop water tank.
const W = 7, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const minG = Math.min(...gmap.values());
const roofY = minG + 11;          // first parapet row
const topY = roofY + 2;           // parapet cap row

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// storey glass rows: storey 1 minG+1..minG+4, storey 2 minG+6..minG+9
const isGlassRow = (y) =>
  (y >= minG + 1 && y <= minG + 4) || (y >= minG + 6 && y <= minG + 9);

const WALL = "white_concrete";
const BASE = "stone_bricks";
const BAND = "smooth_stone";
const GLASS = "light_blue_stained_glass";

for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const perim = missW || missE || missN || missS;
  const corner = (missW || missE) && (missN || missS);

  let face = null, idx = 0, inner = null;
  if (perim && !corner) {
    if (missW) { face = "W"; idx = z; inner = [x + 1, z]; }
    else if (missE) { face = "E"; idx = z; inner = [x - 1, z]; }
    else if (missN) { face = "N"; idx = x; inner = [x, z + 1]; }
    else if (missS) { face = "S"; idx = x; inner = [x, z - 1]; }
  }

  // entrance: north short face, centred on x = 3
  const isDoor = face === "N" && idx === 3 && gr <= minG + 1;
  const isAwning = face === "N" && idx >= 2 && idx <= 4;

  for (let y = gr; y <= topY; y++) {
    if (perim) {
      if (y >= topY) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (y >= roofY) { put(x, y, z, WALL); continue; }

      if (isDoor && (y === minG + 1 || y === minG + 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === minG + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      if (isAwning && y === minG + 4) {
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }

      if (y === gr) { put(x, y, z, BASE); continue; }
      if (y === minG + 5 || y === minG + 10) { put(x, y, z, BAND); continue; }

      if (isGlassRow(y) && face && (idx % 3 !== 0 || isDoor)) {
        put(x, y, z, GLASS);
        // warm light just inside some window bays
        if (y === minG + 2 && !isDoor && idx % 6 === 1 && inner && has(inner[0], inner[1])) {
          put(inner[0], y, inner[1], "glowstone");
        }
        if (y === minG + 7 && !isDoor && idx % 6 === 4 && inner && has(inner[0], inner[1])) {
          put(inner[0], y, inner[1], "glowstone");
        }
        continue;
      }

      put(x, y, z, WALL);
    } else {
      // interior: only the floor slabs (air gap behind glass otherwise)
      if (y === minG || y === minG + 5 || y === minG + 10) {
        put(x, y, z, BAND);
      }
    }
  }
}

// rooftop water tank on the interior of the roof, toward the back
for (let x = 1; x <= 2; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    for (let y = roofY; y <= roofY + 2; y++) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
