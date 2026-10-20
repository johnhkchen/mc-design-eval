import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951885";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 22 x 19; 2 storeys of 5 blocks plus a 1-block roof/parapet course.
const W = 22, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

// Lowest ground under the footprint = y0 of the building body.
const base = Math.min(...cells.map((c) => c[2]));
const TOP = base + 11;          // roof deck sits at TOP-1, equipment above it
const G1 = base + 4;            // ground storey top (lintel course)
const CORNICE = base + 5;       // cornice / upper floor line
const G2 = base + 9;            // upper storey spandrel

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which way an edge cell's exterior faces, and the inward direction.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { face: "W", idx: z, dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { face: "E", idx: z, dx: -1, dz: 0 };
  if (!has(x, z - 1)) return { face: "N", idx: x, dx: 0, dz: 1 };
  return { face: "S", idx: x, dx: 0, dz: -1 };
}

const isEntranceCell = (x, z) => !has(x, z + 1) && x >= 9 && x <= 12;

// Pass 1: foundations, walls, floors, roof.
for (const [x, z, gr] of cells) {
  // Foundation below each cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const { face, idx } = faceOf(x, z);
    const pier = idx % 3 === 0;
    const entrance = face === "S" && isEntranceCell(x, z);

    for (let y = gr; y <= TOP - 1; y++) {
      let id;
      if (y === TOP - 1) {
        id = "white_concrete";                       // parapet
      } else if (y === gr) {
        id = "stone_bricks";                         // base course
      } else if (y < CORNICE) {
        // Ground storey: shopfront with piers, entrance glazed, lintel above.
        if (entrance && y <= base + 3) id = "light_blue_stained_glass";
        else if (y === G1) id = "white_concrete";
        else if (pier) id = "white_concrete";
        else if (y >= base + 1 && y <= base + 3) id = "light_blue_stained_glass";
        else id = "white_concrete";
      } else if (y === CORNICE) {
        id = "smooth_stone";                         // cornice band
      } else if (y <= G2) {
        // Upper storey: punched windows between piers.
        if (y === G2) id = "white_concrete";
        else if (pier) id = "white_concrete";
        else if (y >= base + 6 && y <= base + 8) id = "light_blue_stained_glass";
        else id = "white_concrete";
      } else {
        id = "white_concrete";
      }
      put(x, y, z, id);
    }
  } else {
    // Interior: floor slabs per storey and roof deck; air otherwise (no interiors).
    if (gr <= base + 4 || gr === base) put(x, gr, z, "light_gray_concrete");
    if (CORNICE >= gr) put(x, CORNICE, z, "light_gray_concrete");
    put(x, TOP - 1, z, "light_gray_concrete");
  }
}

// Pass 2: warm light behind some upper-storey windows (glowstone in the air gap).
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { face, idx, dx, dz } = faceOf(x, z);
  if (idx % 3 === 0) continue;
  const ly = base + 7;
  if (ly < gr) continue;
  if (((idx * 5 + base + (face === "S" ? 2 : 0)) % 4) !== 0) continue;
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isEdge(ix, iz) && ly > groundAt(ix, iz)) {
    put(ix, ly, iz, "glowstone");
  }
}

// Pass 3: rooftop plant on the roof deck (kept below the 23-block limit).
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 6 === 3 && z % 5 === 2) {
    put(x, TOP, z, "iron_block");
    if (TOP + 1 < H) put(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
