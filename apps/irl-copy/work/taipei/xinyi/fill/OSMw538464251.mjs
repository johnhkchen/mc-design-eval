import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538464251: unrecorded 12 x 12 block plot in Xinyi. Read as a two-storey
// 1970s-80s concrete shophouse: white concrete frame, smooth quartz string courses,
// a polished andesite plinth, grey tinted glazing in a regular bay grid, a
// ground-floor entrance, and a flat roof with a parapet (roof about 11 blocks up).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464251";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([12, 23, 12]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.floor(gr));
const has = (x, z) => ground.has(key(x, z));

const TOP = 10;      // cornice level; parapet sits at 11
const PARAPET = 11;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x > 11 || z > 11 || y < 0 || y > 22) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward faces. (dx,dz) points out of the building; the bay index runs along the wall.
const FACES = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];

// Window bays: piers every third block and at the corners.
const isWindowBay = (i) => i >= 1 && i <= 10 && i % 3 !== 0;

const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = FACES.filter((f) => !has(x + f.dx, z + f.dz));

  if (faces.length === 0) {
    // Interior cell: floor slabs at ground, first-floor ceiling and roof; air between.
    for (let y = gr; y <= TOP; y++) {
      if (y === gr || y === 5 || y === TOP) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior cell: the first outward face decides the bay index (corners are piers on both faces).
  const f = faces[0];
  const i = f.axis === "x" ? x : z;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) {
      put(x, y, z, "white_concrete");
    } else if (y === gr) {
      put(x, y, z, "polished_andesite");          // plinth course
    } else if (y === 4 || y === 9) {
      put(x, y, z, "white_concrete");             // spandrel below windows
    } else if (y === 5 || y === TOP) {
      put(x, y, z, "smooth_quartz");              // storey line / cornice
    } else if ((y >= 1 && y <= 3) || (y >= 6 && y <= 8)) {
      if (isWindowBay(i)) {
        put(x, y, z, "gray_stained_glass_pane", paneProps(f.axis));
      } else {
        put(x, y, z, "white_concrete");           // pier
      }
    }
  }

  // Entrance: double door on the south face, with a glazed transom above.
  if (x === 4 && z === 11 && faces.some((ff) => ff.name === "south")) {
    const d = gr + 1;
    put(x, d, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, d + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, d + 2, z, "gray_stained_glass_pane", paneProps("x"));
    // Warm light just inside the entrance.
    if (has(x, z - 1)) put(x, d + 1, z - 1, "glowstone");
  }

  // Warm lamps behind a subset of first-floor windows (interior cell, air gap behind the glass).
  if (isWindowBay(i) && i % 6 === 4) {
    const ix = x - f.dx;
    const iz = z - f.dz;
    if (has(ix, iz) && gr < 2) put(ix, 2, iz, "shroomlight");
  }
}

// Roof equipment and a small antenna on the interior roof cells.
const roofInterior = (x, z) => has(x, z) && !FACES.some((f) => !has(x + f.dx, z + f.dz) && x + f.dx === x && false);
const isRoofInterior = (x, z) =>
  has(x, z) && FACES.every((f) => has(x + f.dx, z + f.dz));
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  if (isRoofInterior(x, z)) put(x, PARAPET, z, "light_gray_concrete");
}
if (isRoofInterior(8, 8)) put(8, PARAPET, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
