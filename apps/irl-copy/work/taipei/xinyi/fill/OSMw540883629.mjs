import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, Xinyi district: two storeys on a
// stone foundation, pale tiled walls, grey slab lines, a shopfront at street
// level, a parapet, and rooftop plant. Storey lines sit at rel 0, 5 and 10,
// and the roof is at rel 11 (about 11 blocks above the lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883629";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front face is the north (z-min) side when exposed; entrance sits mid-front.
const frontXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x);
const entranceX = frontXs.length
  ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2)
  : -1;

const winN = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const winEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const ground = gr;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: base course, storey line, roof deck.
  put(x, ground, z, "smooth_stone");
  put(x, ground + 5, z, "light_gray_concrete");
  put(x, ground + 10, z, "light_gray_concrete");

  // Rooftop plant on interior roof cells.
  const exposedAny = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (!exposedAny && (x * 2 + z) % 7 === 0) {
    put(x, ground + 11, z, "iron_block");
  }

  // Interior warm light behind the glass on the upper storey (no interior fit-out).
  if (!exposedAny && (x * 7 + z * 3) % 5 === 0) {
    put(x, ground + 7, z, "glowstone");
  }

  if (!exposedAny) continue;

  const n = !has(x, z - 1);
  const s = !has(x, z + 1);
  const e = !has(x + 1, z);
  const w = !has(x - 1, z);
  const corner = (n || s) && (e || w);

  // Perimeter parapet on every exposed cell.
  put(x, ground + 10, z, "light_gray_concrete");
  put(x, ground + 11, z, "white_concrete");

  // Index along the face and the face's glass orientation.
  const alongNS = n || s;
  const i = alongNS ? x : z;
  const pillar = corner || i % 3 === 0;
  const props = alongNS ? winN : winEW;
  const isFront = n;
  const isEntrance = isFront && x === entranceX;

  // Corner or bay pillar full height above the slab.
  if (pillar) {
    for (let r = 1; r <= 9; r++) {
      put(x, ground + r, z, corner ? "light_gray_concrete" : "white_concrete");
    }
    put(x, ground + 11, z, "white_concrete");
    continue;
  }

  // Ground floor: bulkhead, glazing, transom band.
  if (isEntrance) {
    // Entrance opening rel 1-2, lantern under the transom at rel 3.
    put(x, ground + 4, z, "white_concrete");
    put(x, ground + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    put(x, ground + 1, z, "polished_andesite");
    put(x, ground + 2, z, "glass_pane", props);
    put(x, ground + 3, z, "glass_pane", props);
    put(x, ground + 4, z, "white_concrete");
  }

  // Upper storey: sill, glazing, head band.
  put(x, ground + 6, z, "white_concrete");
  put(x, ground + 7, z, "glass_pane", props);
  put(x, ground + 8, z, "glass_pane", props);
  put(x, ground + 9, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
