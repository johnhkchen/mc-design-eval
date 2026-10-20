import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE115-0047-16F";
const W = 28, H = 23, D = 26;
const TOP = 11;   // parapet top, about 11 blocks above lowest ground (lidar record)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Which outside face a perimeter cell sits on, plus its index along that face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dir: "north", out: [0, -1], idx: x };
  if (!has(x, z + 1)) return { dir: "south", out: [0, 1], idx: x };
  if (!has(x - 1, z)) return { dir: "west", out: [-1, 0], idx: z };
  if (!has(x + 1, z)) return { dir: "east", out: [1, 0], idx: z };
  return null;
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Walls, floors, deck, parapet, shopfronts, entrance, recessed glazing, lights.
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);

  if (!f) {
    // Interior: floor slab per storey and roof deck; air gap behind the glass.
    for (let y = gr; y <= TOP; y++) {
      if (y === gr) put(x, y, z, "smooth_stone");
      else if (y === 5 && 5 > gr) put(x, y, z, "white_concrete");
      else if (y === 10 && 10 > gr) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const pier = f.idx % 3 === 0;
  const isEntrance = f.dir === "south" && (x === 13 || x === 14) && gr <= 2;
  const ix = x - f.out[0], iz = z - f.out[1];          // one cell in, toward the building
  const inwardOk = has(ix, iz) && !faceOf(ix, iz);

  for (let y = gr; y <= TOP; y++) {
    // Entrance doorway, two blocks tall at ground storey.
    if (isEntrance && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    let b = null;
    if (y === TOP) {
      b = "light_gray_concrete";                       // parapet
    } else if (y === 10) {
      b = "smooth_quartz";                             // cornice
    } else if (y === 5 || y === 9) {
      b = "white_concrete";                            // storey spandrels
    } else if (y >= 6 && y <= 8) {
      b = pier ? "light_gray_concrete" : "cyan_stained_glass";
    } else if (y === 4) {
      b = "white_concrete";                            // ground storey lintel
    } else if (y <= 3 && y > gr) {
      b = pier ? "polished_andesite" : "cyan_stained_glass"; // shopfront
    } else if (y === gr) {
      b = "polished_andesite";                         // base course
    }

    if (!b) continue;

    // Recessed glazing: the glass sits one cell in, the outer shell is left open,
    // so the solid piers read as proud frames rather than a flat skin.
    if (b === "cyan_stained_glass" && inwardOk) {
      put(ix, y, iz, "cyan_stained_glass");
      continue;
    }
    put(x, y, z, b);
  }

  // Warm light two cells in, behind the recessed glass on some upper-storey bays.
  if (f.idx % 6 === 2 && !pier && gr <= 6) {
    const jx = x - 2 * f.out[0], jz = z - 2 * f.out[1];
    if (has(jx, jz) && !faceOf(jx, jz)) {
      put(jx, 7, jz, "glowstone");
    }
  }
}

// 3. Roof plant room on the deck, set back from the parapet.
for (const [x, z, gr] of cells) {
  if (faceOf(x, z)) continue;
  if (x < 9 || x > 18 || z < 8 || z > 17) continue;
  if (gr > 10) continue;
  put(x, 11, z, "light_gray_concrete");
  put(x, 12, z, "light_gray_concrete");
  put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
