import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752117";
const W = 27, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);
const groundAt = (x, z) => G.get(x + "," + z);
const minG = Math.min(...cells.map((c) => c[2]));
const b = minG;                 // base course level
const TOP = b + 11;             // parapet cap, about 11 blocks above lowest ground

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front (street) side: the row with the smallest z; door sits at its median x.
const frontZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === frontZ).map((c) => c[0]).sort((a, b2) => a - b2);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Pass 1: foundations, walls, slabs, cornice, parapet.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const P = perim(x, z);
  const C = corner(x, z);
  const pil = C || (x + z) % 4 === 0;
  const isDoor = z === frontZ && x === doorX;

  if (isDoor) {
    put(x, gr, z, "dark_oak_door", doorProps("lower"));
    put(x, gr + 1, z, "dark_oak_door", doorProps("upper"));
  }

  for (let y = gr; y <= TOP; y++) {
    if (isDoor && (y === gr || y === gr + 1)) continue;

    if (!P) {
      // Interior: floor slabs at each storey line and the roof deck. Rest is air.
      if (y === b + 5 || y === b + 10) put(x, y, z, "light_gray_concrete");
      continue;
    }

    let id = null;
    if (y === b) id = "stone_bricks";                                   // base course
    else if (y <= b + 4) {                                              // ground storey shopfront
      if (pil) id = "white_concrete";
      else if (y === b + 4) id = "smooth_stone";                        // lintel band
      else id = "glass_pane";
    } else if (y === b + 5) id = "white_concrete";                      // storey stringcourse
    else if (y <= b + 9) {                                              // upper storey windows
      if (pil) id = "white_concrete";
      else if (y === b + 6) id = "smooth_stone";                        // sill
      else if (y === b + 9) id = "white_concrete";                      // head
      else id = "glass_pane";
    } else if (y === b + 10) id = "smooth_stone";                       // cornice
    else if (y === b + 11) id = "white_concrete";                       // parapet cap

    if (id) put(x, y, z, id);
  }

  // Roof plant on the deck, centred on the footprint.
  if (!P && gr <= b + 10 && x >= 9 && x <= 17 && z >= 5 && z <= 9) {
    put(x, b + 11, z, "light_gray_concrete");
    if (x >= 11 && x <= 15 && z >= 6 && z <= 8) put(x, b + 12, z, "stone_bricks");
  }
}

// Pass 2: warm lights behind some upper-storey windows (in the interior cell beside the glass).
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || corner(x, z) || (x + z) % 4 === 0) continue;
  if ((x + z) % 3 !== 0) continue;
  const nbrs = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  for (const [nx, nz] of nbrs) {
    if (!has(nx, nz) || perim(nx, nz)) continue;
    const ng = groundAt(nx, nz);
    if (ng <= b + 7) {
      put(nx, b + 7, nz, "glowstone");
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
