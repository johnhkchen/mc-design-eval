import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei Xinyi Post Office (OSM w327712846)
// A 1990s civic post office: two storeys, white tiled walls, red storey belt and
// parapet (Chunghwa Post red), blue-tinted glass bays, and a recessed red-lintelled
// entrance on the longest street frontage. Warm lights sit inside the glazing.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const raw = JSON.parse(readFileSync(`${DIR}/OSMw327712846.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.y]));

const W = 29, H = 23, D = 55;
const ROOF = 11;      // roof and parapet top, blocks above lowest ground
const BAND = 5;       // storey belt
const CORNICE = 10;   // cornice under the parapet
const G1 = [1, 4];    // ground-storey window rows (inclusive)
const G2 = [6, 9];    // upper-storey window rows (inclusive)

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

const faceOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
};

// Entrance: the exposed face with the most cells (the street frontage).
const counts = { north: 0, south: 0, east: 0, west: 0 };
for (const [x, z] of cells) for (const d of faceOf(x, z)) counts[d]++;
const entranceDir = Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a));
const alongX = entranceDir === "north" || entranceDir === "south";
const tOf = (x, z) => (alongX ? x : z);

// Span of the entrance face: centre the door on it.
let tmin = Infinity, tmax = -Infinity;
for (const [x, z] of cells) {
  if (faceOf(x, z).includes(entranceDir)) {
    tmin = Math.min(tmin, tOf(x, z));
    tmax = Math.max(tmax, tOf(x, z));
  }
}
const tmid = (tmin + tmax) / 2;

// Facade rhythm: each perimeter cell is read along its primary face
// (north/south preferred), so corners and steps keep the window pattern.
const primaryFace = (faces) =>
  faces.find((d) => d === "north" || d === "south") ?? faces[0];

const inRange = (y, [a, b]) => y >= a && y <= b;

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = faceOf(x, z);

  if (faces.length === 0) {
    // Interior: ground slab, storey floor, ceiling, roof membrane. Air between.
    if (gr <= 10) g.set(x, gr, z, "stone_bricks");
    if (gr < BAND) g.set(x, BAND, z, "stone_bricks");
    if (gr < CORNICE) g.set(x, CORNICE, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");

    // Roof units.
    if (x % 9 === 4 && z % 13 === 6) g.set(x, ROOF + 1, z, "iron_block");

    // Warm lights behind the glazing, one per storey in a sparse grid.
    if (x % 6 === 3 && z % 6 === 3) {
      if (gr < 2) g.set(x, 2, z, "glowstone");
      if (gr < 7) g.set(x, 7, z, "glowstone");
    }
    continue;
  }

  // Perimeter: base course on the foundation.
  g.set(x, gr, z, "stone_bricks");

  const face = primaryFace(faces);
  const t = tOf(x, z);
  const k = ((t - tmin) % 4 + 4) % 4;
  const onEntrance = face === entranceDir;
  const dEnt = Math.abs(t - tmid);
  const isEntranceZone = onEntrance && dEnt <= 3;     // 7-wide recessed entrance
  const isDoor = onEntrance && dEnt < 0.5;
  const isWindow = !isEntranceZone && (k === 1 || k === 2);

  for (let y = gr + 1; y <= CORNICE; y++) {
    let id = "white_concrete";
    let props;

    if (y === BAND) {
      id = "red_terracotta";                          // storey belt
    } else if (y === CORNICE) {
      id = "smooth_stone";                            // cornice
    } else if (isEntranceZone) {
      if (y === gr + 4) {
        id = "red_terracotta";                        // lintel over the entrance
      } else if (y === gr + 1 || y === gr + 2) {
        if (isDoor) {
          id = "dark_oak_door";
          props = {
            facing: entranceDir,
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else {
          id = "glass";                               // shopfront glazing
        }
      } else if (y === gr + 3) {
        id = "white_concrete";                        // transom wall above glazing
      }
    } else if (isWindow && (inRange(y, G1) || inRange(y, G2))) {
      id = "light_blue_stained_glass_pane";           // window glass
    }

    if (y >= gr + 1) g.set(x, y, z, id, props);
  }

  // Parapet on top of the cornice.
  g.set(x, ROOF, z, "red_terracotta");
}

g.save(`${DIR}/OSMw327712846.nbt`);
