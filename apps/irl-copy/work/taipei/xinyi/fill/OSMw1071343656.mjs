import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343656";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 15;
const ROOF_TOP = 11;          // roof about 11 blocks above lowest ground
const v = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (!has(x, z) || y < 0 || y >= H) return;
  if (p) v.set(x, y, z, id, p);
  else v.set(x, y, z, id);
};

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Exterior face of an edge cell: outward direction, index along the face, face length, inward offset.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dir: "north", idx: x, n: W, dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { dir: "south", idx: x, n: W, dx: 0, dz: -1 };
  if (!has(x - 1, z)) return { dir: "west", idx: z, n: D, dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { dir: "east", idx: z, n: D, dx: -1, dz: 0 };
  return null;
}

// Facade of a 2-storey mid-century commercial block: shopfront ground floor,
// framed window grid above, cornice and parapet, flat roof with plant.
function wall(x, y, z, gr, f) {
  const { dir, idx, n, dx, dz } = f;
  const mid = Math.floor(n / 2);

  // Entrance door centred on its face, ground floor
  if ((y === 1 || y === 2) && idx === mid) {
    put(x, y, z, "oak_door", {
      facing: dir,
      half: y === 1 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    return;
  }

  if (y === gr) { put(x, y, z, "polished_andesite"); return; }   // base course

  if (y >= 1 && y <= 4) {                                        // shopfront
    if (y === 4 || idx % 4 === 0) put(x, y, z, "smooth_stone");  // transom and pillars
    else put(x, y, z, "glass_pane", GLASS);
    return;
  }

  if (y === 5) { put(x, y, z, "smooth_stone"); return; }         // storey line

  if (y >= 6 && y <= 9) {                                        // upper floor grid
    const win = idx % 3 !== 0;
    if (y === 6 || y === 9 || !win) {
      put(x, y, z, idx % 3 === 0 || y === 6 || y === 9 ? "quartz_block" : "white_concrete");
      return;
    }
    if (y === 7 || y === 8) {
      put(x, y, z, "glass_pane", GLASS);
      // warm light in the room behind some windows
      if (y === 7 && idx % 6 === 1) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && faceOf(ix, iz) === null) put(ix, 7, iz, "shroomlight");
      }
    }
    return;
  }

  if (y === 10) { put(x, y, z, "smooth_stone"); return; }        // cornice
  if (y === 11) { put(x, y, z, "white_concrete"); return; }      // parapet
}

for (const [x, z, gr] of cells) {
  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const f = faceOf(x, z);
  for (let y = Math.max(gr, 0); y <= ROOF_TOP; y++) {
    if (f) {
      wall(x, y, z, gr, f);
    } else {
      // interior: floor slabs and roof deck, no rooms
      if (y === gr) put(x, y, z, "polished_andesite");
      else if (y === 5) put(x, y, z, "smooth_stone");
      else if (y === 10) put(x, y, z, "gray_concrete");
      else if (y === 11 && x % 6 === 3 && z % 5 === 2) put(x, y, z, "iron_block");  // roof plant
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
