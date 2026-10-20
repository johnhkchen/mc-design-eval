import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891054";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 18 x 10 footprint, two storeys of about 5 blocks, parapet and roof plant.
// Era: late-1990s/2000s Xinyi commercial block: white-tile and concrete facade,
// tinted glass shopfront on the ground floor, grey granite base and cornice.
const W = 18, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));

// exterior sides: N = -z, S = +z, W = -x, E = +x
const exposed = (x, z) => {
  const o = [];
  if (!inFp(x, z - 1)) o.push("N");
  if (!inFp(x, z + 1)) o.push("S");
  if (!inFp(x - 1, z)) o.push("W");
  if (!inFp(x + 1, z)) o.push("E");
  return o;
};

// Entrance: middle of the north-facing front row
const frontXs = cells
  .filter(([x, z]) => exposed(x, z).includes("N") && exposed(x, z).length === 1)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const paneWall = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = Math.min(grRaw, H - 12);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  const out = exposed(x, z);
  const edge = out.length > 0;
  const corner = out.length >= 2;
  const alongX = out.includes("N") || out.includes("S");
  const idx = alongX ? x : z;

  // Ground-level floor slab (interior) or base course (edge)
  S(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  if (!edge) {
    // Interior: floor slabs at storey lines and roof deck, air between
    S(x, gr + 5, z, "smooth_stone");
    S(x, gr + 10, z, "gray_concrete");

    // Roof plant on the deck
    if ((x + 2 * z) % 5 === 0) {
      S(x, gr + 11, z, "light_gray_concrete");
      S(x, gr + 12, z, "iron_block");
    }
    continue;
  }

  // Edge shell: walls, storey lines and parapet
  for (let y = gr + 1; y <= gr + 10; y++) S(x, y, z, "white_concrete");
  S(x, gr + 5, z, "light_gray_concrete");       // storey line
  S(x, gr + 10, z, "smooth_stone");             // cornice
  S(x, gr + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // cap

  if (corner) {
    // Corner pillars run full height
    for (let y = gr + 1; y <= gr + 10; y++) S(x, y, z, "light_gray_concrete");
    continue;
  }

  const pillar = idx % 3 === 0;
  if (pillar) {
    for (let y = gr + 1; y <= gr + 9; y++) S(x, y, z, "light_gray_concrete");
    continue;
  }

  const inward = out.includes("N") ? [x, z + 1]
    : out.includes("S") ? [x, z - 1]
    : out.includes("W") ? [x + 1, z]
    : [x - 1, z];
  const innerOk = inFp(inward[0], inward[1]) && !exposed(inward[0], inward[1]).length;

  // Ground floor: shopfront glazing with a lintel band
  const isEntrance = out.includes("N") && x === entranceX;
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isEntrance) {
      S(x, y, z, "glass");
    } else {
      S(x, y, z, "glass");
    }
  }
  S(x, gr + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // lintel/canopy line
  if (isEntrance) {
    S(x, gr + 4, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  if (innerOk && (x + z) % 4 === 0) S(inward[0], gr + 2, inward[1], "glowstone");

  // Upper storey: framed windows on every third bay, plain panels otherwise
  const window = idx % 3 === 1;
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (window) {
      S(x, y, z, "light_blue_stained_glass_pane", paneWall(alongX));
    } else {
      S(x, y, z, "white_concrete");
    }
  }
  if (window && innerOk && (idx + z) % 2 === 0) {
    S(inward[0], gr + 7, inward[1], "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
