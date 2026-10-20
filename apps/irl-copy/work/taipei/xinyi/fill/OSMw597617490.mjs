import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, Xinyi district, c. 1980s-90s: two shopfront/office
// storeys over a stone base, white tiled-concrete piers, glazed bays, cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617490";
const W = 26, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) gmap.set(`${x},${z}`, gr);
}
const has = (x, z) => gmap.has(`${x},${z}`);
const xs = [...gmap.keys()].map((k) => +k.split(",")[0]);
const zs = [...gmap.keys()].map((k) => +k.split(",")[1]);
const minX = Math.min(...xs), minZ = Math.min(...zs);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const isInterior = (x, z) => has(x, z) && !isEdge(x, z);

for (const [key, g] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  const edge = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground (g), storey 2 (g+5), roof deck (g+10).
  put(x, g, z, edge ? "stone_bricks" : "smooth_stone");
  put(x, g + 5, z, "smooth_stone");
  put(x, g + 10, z, edge ? "stone_brick_slab" : "smooth_stone",
    edge ? { type: "bottom", waterlogged: "false" } : undefined);

  if (!edge) {
    // Roof plant: a light plant block group in the middle of the roof.
    if (x >= minX + 8 && x <= minX + 11 && z >= minZ + 4 && z <= minZ + 7) {
      put(x, g + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade column index along the face the cell sits on.
  const kk = (N || S) ? x - minX : z - minZ;
  const pillar = corner || kk % 3 === 0;
  const door = N && !corner && x === minX + 12;

  // Ground storey shopfront (g+1..g+4).
  for (let y = g + 1; y <= g + 4; y++) {
    if (door && y <= g + 2) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: y === g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (door && y === g + 3) {
      put(x, y, z, "glass");
    } else if (pillar && !door) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }

  // Storey 2 floor band and window bays (g+6..g+9).
  put(x, g + 5, z, "smooth_stone");
  put(x, g + 6, z, "white_concrete");
  put(x, g + 9, z, "white_concrete");
  for (const y of [g + 7, g + 8]) {
    put(x, y, z, pillar ? "white_concrete" : "glass");
  }

  // Cornice and parapet.
  put(x, g + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, g + 11, z, "white_concrete");

  // Warm light behind some glazing: a lantern on the ground floor, a glowstone upstairs.
  if (!pillar && !door) {
    let tx = null, tz = null;
    if (N) { tx = x; tz = z + 2; }
    else if (S) { tx = x; tz = z - 2; }
    else if (Wf) { tx = x + 2; tz = z; }
    else if (E) { tx = x - 2; tz = z; }
    if (tx !== null && isInterior(tx, tz)) {
      if (kk % 6 === 4) {
        put(tx, g + 1, tz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      if (kk % 6 === 1) {
        put(tx, g + 6, tz, "glowstone");
      }
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
