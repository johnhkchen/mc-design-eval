import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw644315164";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey civic/commercial block: 5-block storeys (4 wall rows + 1 slab row),
// light concrete piers, blue-glass bands, roof parapet at 11 blocks, central plant room.
const W = 102, H = 23, D = 33;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// footprint lookup: "x,z" -> ground (rounded)
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => fp.has(`${x},${z}`);

// pick one entrance on the north (-z) edge, nearest the middle of the frontage
let doorKey = null, bestD = Infinity;
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) {
    const d = Math.abs(x - 51);
    if (d < bestD) { bestD = d; doorKey = key; }
  }
}

for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const N = !has(x, z - 1), S = !has(x, z + 1), Wm = !has(x - 1, z), E = !has(x + 1, z);
  const edge = N || S || Wm || E;
  const corner = (N || S) && (Wm || E);
  const wallAlongX = N || S; // coordinate along the facade
  const c = wallAlongX ? x : z;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground-level floor / base course
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // storeys
  for (let s = 0; s < 2; s++) {
    for (let o = 0; o < 4; o++) {
      const y = gr + 5 * s + 1 + o;
      if (!edge) continue; // interiors stay air behind the glass
      if (corner) { put(x, y, z, "white_concrete"); continue; }

      // entrance on north face
      if (s === 0 && doorKey === key && N) {
        if (o === 0) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (o === 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      }

      if (o === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // sill spandrel
      if (o === 3) { put(x, y, z, "white_concrete"); continue; }        // head band

      // window bays with white piers every 4 blocks
      if (c % 4 === 0) { put(x, y, z, "white_concrete"); continue; }

      const pane = s === 0 ? "glass_pane" : "light_blue_stained_glass_pane";
      const props = wallAlongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, pane, props);

      // warm light placed just behind selected upper-storey windows
      if (s === 1 && o === 1 && c % 8 === 2) {
        let ix = x, iz = z;
        if (N) iz = z + 1; else if (S) iz = z - 1; else if (Wm) ix = x + 1; else ix = x - 1;
        if (has(ix, iz)) put(ix, gr + 5 * s + 1 + o, iz, "glowstone");
      }
    }

    // slab row closing each storey (floor for s=0, roof deck for s=1)
    const slabY = gr + 5 * s + 5;
    put(x, slabY, z, edge ? "white_concrete" : "smooth_stone");
  }

  // parapet on the roof edge, bringing the top to 11 blocks above the lowest ground
  if (edge) put(x, gr + 11, z, "white_concrete");

  // roof plant room in the middle of the roof
  if (!edge && x >= 40 && x <= 62 && z >= 11 && z <= 21) {
    put(x, gr + 11, z, "gray_concrete");
    if (x >= 44 && x <= 58 && z >= 14 && z <= 18) put(x, gr + 12, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
