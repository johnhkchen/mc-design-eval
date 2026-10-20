import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001656.cells.json`, "utf8"));

const W = 43, H = 39, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr, rf });
const has = (x, z) => map.has(key(x, z));

// Common floor datum: highest ground under the footprint, so storeys are level.
let B = 0;
for (const [, , gr] of cells) B = Math.max(B, gr);
const RF_MIN = B + 4;

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward directions: n = -z (low z), s = +z, w = -x, e = +x.
const DIRS = [
  { dx: 0, dz: -1, name: "n" },
  { dx: 0, dz: 1, name: "s" },
  { dx: -1, dz: 0, name: "w" },
  { dx: 1, dz: 0, name: "e" },
];

const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const pane = (alongX) =>
  alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Entrance: on the low-z face, the cell nearest the footprint's centre column.
const xsAll = cells.map(([x]) => x);
const cx = (Math.min(...xsAll) + Math.max(...xsAll)) / 2;
let entr = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if (!entr || Math.abs(x - cx) < Math.abs(entr.x - cx)) entr = { x, z };
}

for (const [x, z, gr, rf0] of cells) {
  const rf = Math.max(rf0, RF_MIN);
  const ext = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const perim = ext.length > 0;
  const corner = ext.length >= 2;
  const face = ext[0];
  const isEntr = entr && entr.x === x && entr.z === z && face && face.name === "n";

  for (let y = 0; y < rf; y++) {
    // Foundation and plinth below the common datum.
    if (y < B) {
      set(x, y, z, "stone_bricks");
      continue;
    }

    // Roof slab / cornice course.
    if (y === rf - 1) {
      set(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    // Interior: floor slabs at storey bases, air otherwise.
    if (!perim) {
      if ((y - B) % 2 === 0) set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter: limestone base course and quoined corners.
    if (y === B) {
      set(x, y, z, "stone_bricks");
      continue;
    }
    if (corner) {
      set(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance: iron door, two halves, with stone surround above.
    if (isEntr && (y === B || y === B + 1)) {
      set(x, y, z, "iron_door", {
        facing: "north",
        half: y === B ? "lower" : "upper",
        hinge: x <= cx ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntr && y === B + 2) {
      set(x, y, z, "stone_bricks");
      continue;
    }

    const s = (y - B) % 2; // 0 = spandrel row, 1 = window row
    const alongX = face.name === "n" || face.name === "s";
    const a = alongX ? x : z;

    if (s === 0) {
      // Spandrel: brick with a limestone sill course at the bottom of each storey.
      set(x, y, z, "bricks");
      continue;
    }

    // Window row: bays of recessed glass, brick piers every third block.
    const inX = x - face.dx;
    const inZ = z - face.dz;
    const canRecess = has(inX, inZ) && !isPerim(inX, inZ);

    if (a % 3 !== 0 && canRecess) {
      // Opening in the face, glass set one block back inside the wall (a reveal).
      set(x, y, z, "air");
      set(inX, y, inZ, "light_blue_stained_glass_pane", pane(alongX));
      // Warm light two blocks inside, behind some panes.
      if ((x * 7 + z * 3 + y) % 11 === 0) {
        const lx = x - 2 * face.dx;
        const lz = z - 2 * face.dz;
        if (has(lx, lz) && !isPerim(lx, lz)) set(lx, y, lz, "glowstone");
      }
    } else if (a % 3 !== 0) {
      // Flush glass where recess is impossible (thin footprint parts).
      set(x, y, z, "light_blue_stained_glass_pane", pane(alongX));
    } else {
      set(x, y, z, "bricks");
    }
  }

  // Parapet on the street-wall perimeter.
  if (perim) set(x, rf, z, "stone_bricks");

  // Mechanical bulkhead near the centre of the roof.
  if (x >= 14 && x <= 28 && z >= 7 && z <= 14) {
    for (let yy = rf; yy < rf + 3; yy++) {
      set(x, yy, z, yy === rf + 2 ? "stone_bricks" : "bricks");
    }
  }
}

g.save(`${DIR}/NYC3001656.nbt`);
