import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 39 x 22 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, 1970s-80s reinforced-concrete commercial block:
// a shopfront ground storey (glass, white concrete piers, grey fascia),
// one upper storey of pale-concrete piers and blue-glass pane windows,
// a stone string course at the floor line and a light-grey parapet.
// Entrance is a recessed opening in the south face with a hanging lantern.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583924";
const W = 39, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ROOF_H = 10;          // local top course (roof is 11 blocks tall incl. this course)
const CENTRE_X = 19;        // entrance centre on south face
const perimeter = new Set();
const lampSpots = [];       // [x, z, ground] of interior cells behind upper windows

for (const [x, z, gr] of cells) {
  const missing = dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perim = missing.length > 0;
  const corner = missing.length >= 2;
  if (perim) perimeter.add(key(x, z));
  const [mdx, mdz] = missing[0] || [0, 0];
  // along-face coordinate: x for north/south faces, z for east/west faces
  const u = mdz !== 0 ? x : z;
  const isEntrance = mdz === 1 && Math.abs(x - CENTRE_X) <= 1 && !corner;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  for (let h = 0; h <= ROOF_H; h++) {
    const y = gr + h;
    let b = null;
    let props;

    if (h === 0) {
      b = perim ? "stone_bricks" : "smooth_stone";           // base course / ground slab
    } else if (h === 5) {
      b = "smooth_stone";                                     // floor line / string course
    } else if (h === ROOF_H) {
      b = perim ? "light_gray_concrete" : "gray_concrete";    // parapet cap / roof surface
    } else if (!perim) {
      b = null;                                               // open interior air gap
    } else if (corner) {
      b = "white_concrete";                                   // corner piers
    } else if (h <= 4) {
      if (h === 4) {
        b = "gray_concrete";                                  // shopfront fascia
      } else if (isEntrance) {
        b = null;                                             // doorway opening
      } else if (u % 3 === 0) {
        b = "white_concrete";                                 // shopfront piers
      } else {
        b = "light_blue_stained_glass";                       // shopfront glazing
      }
    } else {                                                  // h 6..9, upper storey
      if (u % 3 === 0) {
        b = "white_concrete";                                 // window piers
      } else if (h === 6 || h === 9) {
        b = "light_gray_concrete";                            // spandrels
      } else {
        b = "light_blue_stained_glass_pane";                  // windows
      }
    }

    if (b) g.set(x, y, z, b, props);
  }

  if (isEntrance && perim) {
    // hanging lantern under the fascia, centre of the doorway
    if (x === CENTRE_X) g.set(x, gr + 3, z, "lantern", { hanging: "true" });
  }

  // Warm light behind some upper windows (interior cell inward of the face)
  if (perim && !corner && mdx !== undefined) {
    const u2 = mdz !== 0 ? x : z;
    if (u2 % 6 === 1 && u2 % 3 !== 0) {
      lampSpots.push([x - mdx, z - mdz, gr, gr + 7]);
    }
  }
}

// Place glowstone light cells behind upper windows (only on interior footprint cells)
for (const [ix, iz, , _ignored] of lampSpots) {
  if (!has(ix, iz) || perimeter.has(key(ix, iz))) continue;
  const igr = ground.get(key(ix, iz));
  g.set(ix, igr + 7, iz, "glowstone");
}

const g = new Voxels([W, H, D]);
g.save(`${DIR}/${ID}.nbt`);
