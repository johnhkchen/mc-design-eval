import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise: a 1970s-80s Taiwanese mixed-use block. Two storeys over a
// stone ground floor, white tiled upper facade, quartz cornice, flat roof with
// a parapet and a few rooftop AC units. Ground floor is shopfront glass with
// one central entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020180";
const W = 9, H = 23, D = 12;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((e) => (Array.isArray(e) ? e : [e.x, e.z, e.ground]));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 11;           // flat roof level (top exclusive)
const groundTop = minG + 4;        // last ground-storey window row
const floorY = minG + 5;           // storey line / 2nd floor slab
const upperTop = minG + 8;         // last upper-storey window row
const cornY = minG + 9;            // cornice / roof surface
const parapetY = minG + 10;        // parapet

const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const inFp = (x, z) => G.has(`${x},${z}`);

// Outward facing from the first missing neighbour (priority: south front).
function outward(x, z) {
  if (!inFp(x, z + 1)) return "south";
  if (!inFp(x, z - 1)) return "north";
  if (!inFp(x + 1, z)) return "east";
  if (!inFp(x - 1, z)) return "west";
  return null;
}

function missingCount(x, z) {
  let n = 0;
  if (!inFp(x + 1, z)) n++;
  if (!inFp(x - 1, z)) n++;
  if (!inFp(x, z + 1)) n++;
  if (!inFp(x, z - 1)) n++;
  return n;
}

// Entrance: south wall cell closest to the centre column.
const southXs = cells
  .filter(([x, z]) => outward(x, z) === "south")
  .map(([x]) => x);
const doorX = southXs.length
  ? southXs.reduce((a, b) => (Math.abs(b - 4) < Math.abs(a - 4) ? b : a))
  : -1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const perim = out !== null;
  const corner = missingCount(x, z) >= 2;

  // Interior slabs and roof surface.
  if (!perim) {
    if (floorY >= gr) put(x, floorY, z, "smooth_stone");
    if (cornY >= gr) put(x, cornY, z, "gray_concrete");
  }

  if (!perim) continue;

  const idx = out === "south" || out === "north" ? x : z;

  // Walls from ground to parapet, one column at a time.
  for (let y = gr; y < roofY; y++) {
    if (y < gr) continue;

    if (y === gr) {
      put(x, y, z, "polished_andesite");          // base course
    } else if (y >= gr + 1 && y <= groundTop) {
      // Ground storey: shopfront glass on piers.
      const isDoorCol = out === "south" && x === doorX && !corner;
      if (isDoorCol && y === gr + 1) {
        put(x, y, z, "oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoorCol && y === gr + 2) {
        put(x, y, z, "oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoorCol && y === gr + 3) {
        put(x, y, z, "dark_oak_planks");          // entrance lintel
      } else if (corner || idx % 3 === 0) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "glass");
      }
    } else if (y === floorY) {
      put(x, y, z, "smooth_quartz");              // storey line
    } else if (y >= minG + 6 && y <= upperTop) {
      // Upper storey: white tiled piers, glass windows.
      if (corner || idx % 3 !== 1) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    } else if (y === cornY) {
      put(x, y, z, "smooth_quartz");              // cornice
    } else if (y === parapetY) {
      put(x, y, z, "white_concrete");             // parapet
    }
  }

  // Warm lights set behind some glass, in the air gap inside the room.
  const inX = x + (out === "east" ? -1 : out === "west" ? 1 : 0);
  const inZ = z + (out === "south" ? -1 : out === "north" ? 1 : 0);
  if (inFp(inX, inZ) && !corner) {
    if (idx % 6 === 2) put(inX, minG + 7, inZ, "glowstone");   // upper storey
    if (idx % 6 === 1 && out !== "south") put(inX, minG + 2, inZ, "glowstone"); // shop
  }
}

// Rooftop AC units on the roof interior, clear of the parapet.
for (let x = 2; x <= 3; x++) {
  for (let z = 7; z <= 8; z++) {
    if (!inFp(x, z)) continue;
    const gr = G.get(`${x},${z}`);
    if (parapetY >= gr) put(x, parapetY, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
